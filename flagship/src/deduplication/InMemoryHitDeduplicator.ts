import { IFlagshipConfig } from '../config';
import { IFSHitDeduplicator } from '../interface/IFSHitDeduplicator';

const DEFAULT_SESSION_TIMEOUT_MS = 1800000; // 30 minutes


export interface FSInMemoryHitDeduplicatorOptions {
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

  evictionPercentage?: number;
}


/**
 * In-memory implementation of the hit deduplicator
 */
export class FSInMemoryHitDeduplicator implements IFSHitDeduplicator {
  // Store activation entries by visitor ID
  private hitCache: Map<string, Set<string>>;

  // Track last activity time per visitor
  private visitorActivity: Map<string, number>;

  private sessionTimeoutMs: number;
  private maxCacheSize: number;
  private evictionPercentage: number;
  private cleanupIntervalId?: NodeJS.Timeout;
  private totalEntries: number;
  private initialized: boolean = false;
  private cleanupInterval: number;
  private _config: IFlagshipConfig | undefined;

  /**
   * Creates a new in-memory hit deduplicator
   */
  constructor(options: FSInMemoryHitDeduplicatorOptions = {}) {

    this.hitCache = new Map();
    this.visitorActivity = new Map();
    this.totalEntries = 0;
    this.initialized = false;

    this.sessionTimeoutMs = DEFAULT_SESSION_TIMEOUT_MS;

    // Default: 10000 entries maximum
    this.maxCacheSize = options.maxCacheSize ?? 10000;

    // Default: 5 minutes
    this.cleanupInterval = options.cleanupIntervalMs ?? 300000;

    // Default: 25% of excess entries
    this.evictionPercentage = options.evictionPercentage ?? 0.25;
  }
  getMaxCacheSize(): number {
    return this.maxCacheSize;
  }
  getEvictionPercentage(): number {
    return this.evictionPercentage;
  }
  setConfig(config: IFlagshipConfig): void {
    this._config = config;
  }
  getCleanupInterval(): number {
    return this.cleanupInterval;
  }

  /**
   * Initialize the deduplicator
   */
  async initializeAsync(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.cleanupIntervalId = setInterval(() => {
      this.cleanupExpiredAsync();
    }, this.cleanupInterval);

    this.initialized = true;
  }

  /**
   * Check if a hit is a duplicate
   * @param visitorId The visitor ID
   * @param value The value to check (e.g., variation group ID)
   * @returns Promise resolving to true if duplicate, false if new
   */
  async isDuplicateAsync(visitorId: string, anonymousId:string|null, value: string): Promise<boolean> {

    const now = Date.now();

    // Check if visitor's session has expired
    const lastVisitorActivity = this.visitorActivity.get(visitorId);
    if (lastVisitorActivity && now - lastVisitorActivity >= this.sessionTimeoutMs) {
    // Session expired - clear previous data for this visitor
      this.removeVisitorData(visitorId);
    }

    // If anonymousId is provided, check if its session has expired too
    if (anonymousId !== null) {
      const lastAnonymousActivity = this.visitorActivity.get(anonymousId);
      if (lastAnonymousActivity && now - lastAnonymousActivity >= this.sessionTimeoutMs) {
      // Session expired - clear previous data for this anonymous ID
        this.removeVisitorData(anonymousId);
      }
    }

    // Update visitor's last activity time
    this.reportActivityAsync(visitorId, anonymousId);

    // Check if this visitor has any cached hits
    if (!this.hitCache.has(visitorId)) {
      this.hitCache.set(visitorId, new Set());
    }

    const visitorHits = this.hitCache.get(visitorId) as Set<string>;

    // Check if this specific hit already exists
    if (visitorHits.has(value)) {
      return true; // It's a duplicate
    }

    if (anonymousId !== null) {
      if (!this.hitCache.has(anonymousId)) {
        this.hitCache.set(anonymousId, new Set());
      }
      const anonymousHits = this.hitCache.get(anonymousId) as Set<string>;

      // Check if this specific hit already exists for the anonymous ID
      if (anonymousHits.has(value)) {
        return true; // It's a duplicate
      }
      // Add the new hit to the anonymous ID's set
      anonymousHits.add(value);
      this.totalEntries++;
    }

    // Add the new hit
    visitorHits.add(value);
    this.totalEntries++;

    // Check if we need to evict entries
    if (this.totalEntries > this.maxCacheSize) {
      this.evictOldestAsync();
    }

    return false; // Not a duplicate
  }

  /**
   * Update the last activity timestamp for a visitor
   * @param visitorId The visitor ID
   */
  async reportActivityAsync(visitorId: string, anonymousId:string|null): Promise<void> {
    this.visitorActivity.set(visitorId, Date.now());
    if (anonymousId !== null) {
      this.visitorActivity.set(anonymousId, Date.now());
    }
  }

  /**
   * Evict oldest entries when cache limit is reached
   */
  async evictOldestAsync(): Promise<void> {
    // If we're under the limit, nothing to do
    if (this.totalEntries <= this.maxCacheSize) {
      return;
    }

    // Sort visitors by last activity time (oldest first)
    const sortedVisitors = [...this.visitorActivity.entries()]
      .sort((a, b) => a[1] - b[1]);

    // Calculate how many entries to remove (25% of excess or at least 1)
    const excessEntries = this.totalEntries - this.maxCacheSize;
    const entriesToRemove = Math.max(1, Math.ceil(excessEntries * this.getEvictionPercentage()));

    let removedCount = 0;
    let visitorIndex = 0;

    // Remove entries from oldest visitors until we've removed enough
    while (removedCount < entriesToRemove && visitorIndex < sortedVisitors.length) {
      const [visitorId] = sortedVisitors[visitorIndex];
      const visitorHits = this.hitCache.get(visitorId);

      if (visitorHits) {
        const hitCount = visitorHits.size;
        this.hitCache.delete(visitorId);
        removedCount += hitCount;
        this.totalEntries -= hitCount;
      }

      visitorIndex++;
    }
  }

  /**
   * Clean up expired sessions (visitors with no activity)
   */
  async cleanupExpiredAsync(): Promise<void> {
    const now = Date.now();
    const inactiveVisitors: string[] = [];

    // Find visitors with expired sessions
    for (const [visitorId, lastActivity] of this.visitorActivity.entries()) {
      if (now - lastActivity >= this.sessionTimeoutMs) {
        inactiveVisitors.push(visitorId);
      }
    }

    // Remove all data for inactive visitors
    for (const visitorId of inactiveVisitors) {
      this.removeVisitorData(visitorId);
    }
  }

  /**
   * Remove all data related to a visitor
   */
  private removeVisitorData(visitorId: string): void {
    // Get the visitor's hit set
    const visitorHits = this.hitCache.get(visitorId);

    // If the visitor has hits, update total count and remove them
    if (visitorHits) {
      this.totalEntries -= visitorHits.size;
      this.hitCache.delete(visitorId);
    }

    // Remove visitor's activity tracking
    this.visitorActivity.delete(visitorId);
  }

  /**
   * Release resources when no longer needed
   */
  async disposeAsync(): Promise<void> {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = undefined;
    }

    // Clear all caches
    this.hitCache.clear();
    this.visitorActivity.clear();
    this.totalEntries = 0;
    this.initialized = false;
  }

  /**
   * Get the current total number of cached entries (for testing/monitoring)
   */
  getTotalEntries(): number {
    return this.totalEntries;
  }

  /**
   * Get the number of active visitors (for testing/monitoring)
   */
  getActiveVisitorCount(): number {
    return this.visitorActivity.size;
  }
}
