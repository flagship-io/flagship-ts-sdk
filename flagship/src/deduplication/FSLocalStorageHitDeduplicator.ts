import { IFlagshipConfig } from '../config';
import { IFSHitDeduplicator } from '../interface/IFSHitDeduplicator';

const DEFAULT_SESSION_TIMEOUT_MS = 1800000; // 30 minutes
const LS_PREFIX = 'fs_dedup_';

export interface FSLocalStorageHitDeduplicatorOptions {
  /**
   * Maximum number of entries in the cache
   * Default: 10000
   */
  maxCacheSize?: number;

  /**
   * How frequently to run cleanup of expired sessions (in ms)
   * Default: 5 minutes (300000ms)
   */
  cleanupIntervalMs?: number;

  /**
   * Custom localStorage key prefix
   * Default: 'fs_dedup_'
   */
  storageKeyPrefix?: string;

  /**
   * Percentage of entries to evict when exceeding maxCacheSize
   * Default: 25%
   */
  evictionPercentage?: number;
}

interface DeduplicatorMeta {
  totalEntries: number;
  lastCleanup: number;
}

/**
 * LocalStorage implementation of the hit deduplicator
 * Persists deduplication state across page reloads
 */
export class FSLocalStorageHitDeduplicator implements IFSHitDeduplicator {
  private sessionTimeoutMs: number;
  private maxCacheSize: number;
  private cleanupIntervalId?: NodeJS.Timeout;
  private initialized: boolean = false;
  private cleanupInterval: number;
  private keyPrefix: string;
  private hitsPrefix: string;
  private activitiesKey: string;
  private metaKey: string;
  private evictionPercentage: number;

  // In-memory cache of visitor activities to reduce localStorage reads
  private visitorActivitiesCache: Record<string, number> | null = null;

  // In-memory cache of metadata
  private metadataCache: DeduplicatorMeta | null = null;

  // In-memory cache of visitor hits
  private visitorHitsCache: Map<string, Set<string>> = new Map();

  // Track which visitor hits have been modified and need to be saved
  private modifiedVisitorHits: Set<string> = new Set();

  private _config: IFlagshipConfig | undefined;

  /**
   * Creates a new localStorage-based hit deduplicator
   */
  constructor(options: FSLocalStorageHitDeduplicatorOptions = {}) {
    this.sessionTimeoutMs = DEFAULT_SESSION_TIMEOUT_MS;
    this.maxCacheSize = options.maxCacheSize ?? 10000;
    this.cleanupInterval = options.cleanupIntervalMs ?? 300000;

    // Set up key prefixes
    this.keyPrefix = options.storageKeyPrefix ?? LS_PREFIX;
    this.hitsPrefix = `${this.keyPrefix}hits_`;
    this.activitiesKey = `${this.keyPrefix}activities`;
    this.metaKey = `${this.keyPrefix}meta`;
    this.evictionPercentage = options.evictionPercentage ?? 0.25; // Default: 25% of excess entries

    // Check if localStorage is available
    this.checkLocalStorageAvailable();
  }

  getMaxCacheSize(): number {
    return this.maxCacheSize;
  }
  getEvictionPercentage(): number {
    return this.evictionPercentage;
  }

  /**
   * Set config for the deduplicator
   */
  setConfig(config: IFlagshipConfig): void {
    this._config = config;
  }

  /**
   * Initialize the deduplicator
   */
  async initializeAsync(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Initialize metadata
    const stored = localStorage.getItem(this.metaKey);
    if (!stored) {
      this.metadataCache = {
        totalEntries: 0,
        lastCleanup: Date.now()
      };
      this.saveMetadata();
    } else {
      try {
        this.metadataCache = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse metadata from localStorage:', e);
        this.metadataCache = {
          totalEntries: 0,
          lastCleanup: Date.now()
        };
        this.saveMetadata();
      }
    }

    // Initialize activities if not exists
    if (!localStorage.getItem(this.activitiesKey)) {
      this.saveVisitorActivities({});
    }

    // Load activities into memory cache
    this.loadVisitorActivities();

    // Pre-load hit data for active visitors
    this.preloadActiveVisitorHits();

    // Schedule periodic cleanup
    this.cleanupIntervalId = setInterval(() => {
      this.cleanupExpiredAsync();
    }, this.cleanupInterval);

    // Schedule periodic save for modified hits
    this.saveIntervalId = setInterval(() => {
      this.saveModifiedHits();
    }, 10000); // Save every 10 seconds

    this.initialized = true;
  }

  /**
   * Preload hits for all active visitors to improve performance
   */
  private preloadActiveVisitorHits(): void {
    if (!this.visitorActivitiesCache) {
      return;
    }

    // Only preload hits for visitors with recent activity
    const now = Date.now();
    const recentThreshold = now - (this.sessionTimeoutMs / 2); // Load visitors active in the last half-session

    // Find visitors with recent activity
    for (const [visitorId, lastActivity] of Object.entries(this.visitorActivitiesCache)) {
      if (lastActivity >= recentThreshold) {
        // Lazy-load this visitor's hits
        this.loadVisitorHitsFromStorage(visitorId);
      }
    }
  }

  /**
   * Check if localStorage is available
   * @throws Error if localStorage is not available
   */
  private checkLocalStorageAvailable(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('localStorage is not available in this environment');
    }

    try {
      // Test storage
      localStorage.setItem('fs_test', 'test');
      localStorage.removeItem('fs_test');
    } catch (e) {
      throw new Error('localStorage is not accessible: ' + e);
    }
  }

  /**
   * Check if a hit is a duplicate
   * @param visitorId The visitor ID
   * @param anonymousId The anonymous ID (if available)
   * @param value The value to check (e.g., variation group ID)
   * @returns Promise resolving to true if duplicate, false if new
   */
  async isDuplicateAsync(visitorId: string, anonymousId: string | null, value: string): Promise<boolean> {
    // Update visitor's last activity time
    await this.reportActivityAsync(visitorId, anonymousId);

    // Ensure metadata is loaded
    if (!this.metadataCache) {
      await this.initializeAsync();
    }

    // Get visitor's hits from cache or load from storage
    const visitorHits = this.getVisitorHits(visitorId);

    // Check if this specific hit already exists for visitor ID
    if (visitorHits.has(value)) {
      return true; // It's a duplicate
    }

    // If we have an anonymous ID, also check if the hit exists under that ID
    if (anonymousId && anonymousId !== visitorId) {
      const anonHits = this.getVisitorHits(anonymousId);
      if (anonHits.has(value)) {
        return true; // It's a duplicate under the anonymous ID
      }

      // Add the hit to the anonymous ID's set as well
      anonHits.add(value);
      this.modifiedVisitorHits.add(anonymousId);

      // Update total entries count
      if (this.metadataCache) {
        this.metadataCache.totalEntries++;
      }
    }

    // Add the new hit to the visitor ID
    visitorHits.add(value);
    this.modifiedVisitorHits.add(visitorId); // Mark for saving

    // Update total entries count
    if (this.metadataCache) {
      this.metadataCache.totalEntries++;
      this.saveMetadata();
    }

    // Check if we need to evict entries
    if (this.metadataCache && this.metadataCache.totalEntries > this.maxCacheSize) {
      await this.evictOldestAsync();
    }

    return false; // Not a duplicate
  }

  /**
   * Update the last activity timestamp for a visitor
   * @param visitorId The visitor ID
   * @param anonymousId The anonymous ID (if available)
   */
  async reportActivityAsync(visitorId: string, anonymousId: string | null): Promise<void> {
    // Ensure activities are loaded
    if (this.visitorActivitiesCache === null) {
      this.loadVisitorActivities();
    }

    // Update in memory
    const now = Date.now();
    if (this.visitorActivitiesCache) {
      this.visitorActivitiesCache[visitorId] = now;

      // If there's an anonymous ID, update its activity too
      if (anonymousId && anonymousId !== visitorId) {
        this.visitorActivitiesCache[anonymousId] = now;
      }
    }

    // Debounced save to localStorage to reduce writes
    this._debouncedSaveActivities();
  }

  // Save interval for modified hits
  private saveIntervalId?: NodeJS.Timeout;

  // Simple debounce for saving activities
  private _saveActivitiesTimeout: NodeJS.Timeout | null = null;
  private _debouncedSaveActivities(): void {
    if (this._saveActivitiesTimeout) {
      clearTimeout(this._saveActivitiesTimeout);
    }

    this._saveActivitiesTimeout = setTimeout(() => {
      if (this.visitorActivitiesCache) {
        this.saveVisitorActivities(this.visitorActivitiesCache);
      }
      this._saveActivitiesTimeout = null;
    }, 500); // 500ms debounce
  }

  /**
   * Save all modified visitor hits to localStorage
   */
  private saveModifiedHits(): void {
    if (this.modifiedVisitorHits.size === 0) {
      return; // Nothing to save
    }

    // Save each modified visitor's hits
    for (const visitorId of this.modifiedVisitorHits) {
      const hits = this.visitorHitsCache.get(visitorId);
      if (hits) {
        this.saveVisitorHitsToStorage(visitorId, hits);
      }
    }

    // Clear the modified set
    this.modifiedVisitorHits.clear();
  }

  /**
   * Evict oldest entries when cache limit is reached
   */
  async evictOldestAsync(): Promise<void> {
    if (!this.metadataCache || this.metadataCache.totalEntries <= this.maxCacheSize) {
      return;
    }

    // Ensure visitor activities are loaded
    if (this.visitorActivitiesCache === null) {
      this.loadVisitorActivities();
    }

    // Get all activity entries and sort by timestamp (oldest first)
    const visitorActivities: [string, number][] = Object.entries(this.visitorActivitiesCache || {});

    // Sort by timestamp (oldest first)
    visitorActivities.sort((a, b) => a[1] - b[1]);

    // Calculate how many entries to remove (25% of excess or at least 1)
    const excessEntries = this.metadataCache.totalEntries - this.maxCacheSize;
    const entriesToRemove = Math.max(1, Math.ceil(excessEntries * 0.25));

    let removedCount = 0;
    let visitorIndex = 0;
    const removedVisitors: string[] = [];

    // Remove entries from oldest visitors until we've removed enough
    while (removedCount < entriesToRemove && visitorIndex < visitorActivities.length) {
      const [visitorId] = visitorActivities[visitorIndex];
      const visitorHits = this.getVisitorHits(visitorId);

      if (visitorHits.size > 0) {
        removedCount += visitorHits.size;
        this.removeVisitorData(visitorId);
        removedVisitors.push(visitorId);
      }

      visitorIndex++;
    }

    // Update total entries count
    if (this.metadataCache) {
      this.metadataCache.totalEntries -= removedCount;
      this.saveMetadata();
    }

    // Update in-memory caches
    if (this.visitorActivitiesCache) {
      for (const visitorId of removedVisitors) {
        delete this.visitorActivitiesCache[visitorId];
        this.visitorHitsCache.delete(visitorId);

        // No need to mark as modified - we're removing from storage directly
        localStorage.removeItem(this.hitsPrefix + visitorId);
      }
      this.saveVisitorActivities(this.visitorActivitiesCache);
    }
  }

  /**
   * Clean up expired sessions (visitors with no activity)
   */
  async cleanupExpiredAsync(): Promise<void> {
    const now = Date.now();

    // Ensure metadata is loaded
    if (!this.metadataCache) {
      return; // Not initialized yet
    }

    let removedCount = 0;

    // Ensure visitor activities are loaded
    if (this.visitorActivitiesCache === null) {
      this.loadVisitorActivities();
    }

    const activities = this.visitorActivitiesCache || {};
    const inactiveVisitors: string[] = [];

    // Find visitors with expired sessions
    for (const [visitorId, lastActivity] of Object.entries(activities)) {
      if (now - lastActivity >= this.sessionTimeoutMs) {
        inactiveVisitors.push(visitorId);

        // Get number of hits before removing
        const visitorHits = this.getVisitorHits(visitorId);
        removedCount += visitorHits.size;

        // Remove all data for this visitor
        this.removeVisitorData(visitorId);
      }
    }

    // Update metadata
    if (this.metadataCache) {
      this.metadataCache.totalEntries -= removedCount;
      this.metadataCache.lastCleanup = now;
      this.saveMetadata();
    }

    // Update in-memory cache and localStorage
    if (this.visitorActivitiesCache && inactiveVisitors.length > 0) {
      for (const visitorId of inactiveVisitors) {
        delete this.visitorActivitiesCache[visitorId];
        this.visitorHitsCache.delete(visitorId);
        localStorage.removeItem(this.hitsPrefix + visitorId);
      }
      this.saveVisitorActivities(this.visitorActivitiesCache);
    }
  }

  /**
   * Remove all data related to a visitor
   */
  private removeVisitorData(visitorId: string): void {
    // Remove visitor hits from cache and storage
    this.visitorHitsCache.delete(visitorId);
    localStorage.removeItem(this.hitsPrefix + visitorId);
    this.modifiedVisitorHits.delete(visitorId); // Remove from modified set

    // Remove from activity tracking
    if (this.visitorActivitiesCache) {
      delete this.visitorActivitiesCache[visitorId];
    }
  }

  /**
   * Release resources when no longer needed
   */
  async disposeAsync(): Promise<void> {
    // Clear intervals
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = undefined;
    }

    if (this.saveIntervalId) {
      clearInterval(this.saveIntervalId);
      this.saveIntervalId = undefined;
    }

    // Clear debounce timeout
    if (this._saveActivitiesTimeout) {
      clearTimeout(this._saveActivitiesTimeout);
      this._saveActivitiesTimeout = null;
    }

    // Force save any pending activities
    if (this.visitorActivitiesCache) {
      this.saveVisitorActivities(this.visitorActivitiesCache);
    }

    // Save any modified hits
    this.saveModifiedHits();

    this.visitorActivitiesCache = null;
    this.metadataCache = null;
    this.visitorHitsCache.clear();
    this.modifiedVisitorHits.clear();
    this.initialized = false;
  }

  /**
   * Get visitor hits from cache or localStorage
   */
  private getVisitorHits(visitorId: string): Set<string> {
    // Check if hits are already in memory
    if (this.visitorHitsCache.has(visitorId)) {
      return this.visitorHitsCache.get(visitorId) as Set<string>;
    }

    // Load from localStorage
    return this.loadVisitorHitsFromStorage(visitorId);
  }

  /**
   * Load visitor hits from localStorage into cache
   */
  private loadVisitorHitsFromStorage(visitorId: string): Set<string> {
    const key = this.hitsPrefix + visitorId;
    const stored = localStorage.getItem(key);

    let hits: Set<string>;
    if (!stored) {
      hits = new Set<string>();
    } else {
      try {
        // Parse stored JSON array into Set
        hits = new Set<string>(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse visitor hits from localStorage:', e);
        hits = new Set<string>();
      }
    }

    // Cache the result
    this.visitorHitsCache.set(visitorId, hits);
    return hits;
  }

  /**
   * Save visitor hits to localStorage
   */
  private saveVisitorHitsToStorage(visitorId: string, hits: Set<string>): void {
    const key = this.hitsPrefix + visitorId;

    try {
      // Convert Set to array for JSON serialization
      localStorage.setItem(key, JSON.stringify([...hits]));
    } catch (e) {
      console.error('Failed to save visitor hits to localStorage:', e);
      // If localStorage is full, try to clean up
      this.evictOldestAsync().catch(console.error);

      // Try saving again
      try {
        localStorage.setItem(key, JSON.stringify([...hits]));
      } catch (e2) {
        console.error('Still failed to save visitor hits after cleanup:', e2);
      }
    }
  }

  /**
   * Load visitor activities from localStorage
   */
  private loadVisitorActivities(): void {
    const stored = localStorage.getItem(this.activitiesKey);

    if (!stored) {
      this.visitorActivitiesCache = {};
      return;
    }

    try {
      this.visitorActivitiesCache = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse visitor activities from localStorage:', e);
      this.visitorActivitiesCache = {};
    }
  }

  /**
   * Save visitor activities to localStorage
   */
  private saveVisitorActivities(activities: Record<string, number>): void {
    try {
      localStorage.setItem(this.activitiesKey, JSON.stringify(activities));
    } catch (e) {
      console.error('Failed to save visitor activities to localStorage:', e);

      // If localStorage is full, try pruning older activities
      try {
        // Keep only 100 most recent activities if we're having storage issues
        const sortedActivities = Object.entries(activities)
          .sort((a, b) => b[1] - a[1]) // Sort by most recent
          .slice(0, 100); // Take top 100

        const prunedActivities = Object.fromEntries(sortedActivities);
        localStorage.setItem(this.activitiesKey, JSON.stringify(prunedActivities));

        // Update the cache
        this.visitorActivitiesCache = prunedActivities;
      } catch (e2) {
        console.error('Still failed to save visitor activities after pruning:', e2);
      }
    }
  }

  /**
   * Save metadata to localStorage
   */
  private saveMetadata(): void {
    if (!this.metadataCache) {
      return;
    }

    try {
      localStorage.setItem(this.metaKey, JSON.stringify(this.metadataCache));
    } catch (e) {
      console.error('Failed to save metadata to localStorage:', e);
    }
  }

  /**
   * Get the current total number of cached entries (for testing/monitoring)
   */
  getTotalEntries(): number {
    return this.metadataCache?.totalEntries || 0;
  }

  /**
   * Get the number of active visitors (for testing/monitoring)
   */
  getActiveVisitorCount(): number {
    if (this.visitorActivitiesCache === null) {
      this.loadVisitorActivities();
    }
    return Object.keys(this.visitorActivitiesCache || {}).length;
  }

  /**
   * Clear all deduplication data from localStorage
   */
  clear(): void {
    // Remove all items with our prefix
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.keyPrefix)) {
        localStorage.removeItem(key);
      }
    }

    // Reset metadata
    this.metadataCache = {
      totalEntries: 0,
      lastCleanup: Date.now()
    };
    this.saveMetadata();

    // Reset activities
    this.visitorActivitiesCache = {};
    this.saveVisitorActivities({});

    // Reset hits cache
    this.visitorHitsCache.clear();
    this.modifiedVisitorHits.clear();
  }
}
