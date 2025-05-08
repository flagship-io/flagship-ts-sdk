import { IFlagshipConfig } from '../config/IFlagshipConfig';
import { IFSHitDeduplicator } from '../interface/IFSHitDeduplicator';

// Import Redis conditionally to avoid dependency issues
let Redis: any;
try {
  Redis = require('redis');
} catch (e) {
  // Redis is not installed, will be handled in constructor
}

const DEFAULT_SESSION_TIMEOUT_MS = 1800000; // 30 minutes

export interface FSRedisHitDeduplicatorOptions {
  /**
   * Redis connection host
   * Default: localhost
   */
  host?: string;

  /**
   * Redis connection port
   * Default: 6379
   */
  port?: number;

  /**
   * Redis password (if required)
   */
  password?: string;

  /**
   * Redis username (if required)
   */
  username?: string;

  /**
   * Redis database index
   * Default: 0
   */
  db?: number;

  /**
   * Redis connection URL
   * Alternative to host/port/password
   */
  url?: string;

  /**
   * Redis key prefix to avoid collisions with other data
   * Default: 'fs_dedup:'
   */
  keyPrefix?: string;

  /**
   * Maximum number of entries in the cache (0 means no limit)
   * Default: 0 (no application-level limit)
   */
  maxCacheSize?: number;

  /**
   * Session timeout in milliseconds
   * Default: 30 minutes (1800000ms)
   */
  sessionTimeoutMs?: number;

  /**
   * Percentage of excess entries to remove during eviction
   * Default: 0.25 (25%)
   */
  evictionPercentage?: number;

  /**
   * Existing Redis client instance (optional)
   */
  client?: any;

  /**
   * Redis connection options (passed directly to Redis client)
   */
  redisOptions?: Record<string, any>;

  /**
   * Whether to use TLS for Redis connection
   * Default: false
   */
  tls?: boolean;
}

/**
 * Redis implementation of the hit deduplicator
 * Uses Redis sets and hashes for efficient hit deduplication
 */
export class FSRedisHitDeduplicator implements IFSHitDeduplicator {
  private client: any;
  private isClientProvided: boolean = false;
  private isConnected: boolean = false;
  private initialized: boolean = false;

  private sessionTimeoutMs: number;
  private maxCacheSize: number;
  private evictionPercentage: number;
  private keyPrefix: string;

  // Key prefixes for different data types
  private hitsPrefix: string;
  private activitiesKey: string;
  private metaKey: string;

  // Fallback mode - if Redis fails, we operate in no-op mode
  private fallbackMode: boolean = false;
  private connectionErrorCount: number = 0;

  // Config reference
  private _config: IFlagshipConfig | undefined;

  /**
   * Creates a new Redis-based hit deduplicator
   */
  constructor(options: FSRedisHitDeduplicatorOptions = {}) {
    // Check if Redis is available
    if (!Redis && !options.client) {
      throw new Error(
        'Redis package not installed. Install it using: npm install redis'
      );
    }

    // Initialize settings
    this.sessionTimeoutMs = options.sessionTimeoutMs ?? DEFAULT_SESSION_TIMEOUT_MS;
    this.maxCacheSize = options.maxCacheSize ?? 0; // Default to no limit (0)
    this.keyPrefix = options.keyPrefix ?? 'fs_dedup:';
    this.hitsPrefix = `${this.keyPrefix}hits:`;
    this.activitiesKey = `${this.keyPrefix}activities`;
    this.metaKey = `${this.keyPrefix}meta`;
    this.evictionPercentage = options.evictionPercentage ?? 0.25;

    // Setup client
    if (options.client) {
      this.client = options.client;
      this.isClientProvided = true;
      this.isConnected = true;
    } else {
      // Create Redis client
      const redisOptions: Record<string, any> = {
        socket: {
          host: options.host || 'localhost',
          port: options.port || 6379,
          tls: options.tls || false
        },
        ...options.redisOptions
      };

      // Add auth if provided
      if (options.password) {
        redisOptions.password = options.password;
      }

      if (options.username) {
        redisOptions.username = options.username;
      }

      // Use URL if provided
      if (options.url) {
        this.client = Redis.createClient({
          url: options.url,
          ...options.redisOptions
        });
      } else {
        this.client = Redis.createClient(redisOptions);
      }

      // Setup event handlers
      this.client.on('error', (err: Error) => {
        console.error('Redis Error:', err);
        this.connectionErrorCount++;

        if (this.connectionErrorCount > 3) {
          this.fallbackMode = true;
        }
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.fallbackMode = false;
        this.connectionErrorCount = 0;
      });

      this.client.on('end', () => {
        this.isConnected = false;
      });
    }
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

    try {
      // Connect to Redis if not already connected
      if (!this.isClientProvided && !this.isConnected) {
        await this.client.connect();
        this.isConnected = true;
      }

      // Initialize metadata
      const exists = await this.client.exists(this.metaKey);
      if (!exists) {
        await this.client.hSet(this.metaKey, 'totalEntries', '0');
        await this.client.hSet(this.metaKey, 'lastCleanup', Date.now().toString());
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Redis hit deduplicator:', error);
      this.fallbackMode = true;
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
    this.reportActivityAsync(visitorId, anonymousId);

    // In fallback mode, always return false (no deduplication)
    if (this.fallbackMode || !this.isConnected) {
      return false;
    }

    try {
      // Generate key for visitor's hits
      const visitorHitKey = this.getVisitorHitsKey(visitorId);

      // Check if this hit already exists for visitor ID
      const isDuplicate = await this.client.sIsMember(visitorHitKey, value);

      if (isDuplicate) {
        return true; // It's a duplicate
      }

      // If we have an anonymous ID, also check if the hit exists under that ID
      if (anonymousId && anonymousId !== visitorId) {
        const anonHitKey = this.getVisitorHitsKey(anonymousId);
        const isAnonDuplicate = await this.client.sIsMember(anonHitKey, value);

        if (isAnonDuplicate) {
          return true; // It's a duplicate under the anonymous ID
        }

        // Add the hit to the anonymous ID's set as well
        await this.client.sAdd(anonHitKey, value);

        // Refresh TTL for this visitor's hits
        await this.client.expire(anonHitKey, Math.floor(this.sessionTimeoutMs / 1000));

        // Update total entries count
        await this.client.hIncrBy(this.metaKey, 'totalEntries', 1);
      }

      // Add new hit to the visitor's set
      await this.client.sAdd(visitorHitKey, value);

      // Refresh TTL for this visitor's hits
      await this.client.expire(visitorHitKey, Math.floor(this.sessionTimeoutMs / 1000));

      // Update total entries count
      await this.client.hIncrBy(this.metaKey, 'totalEntries', 1);

      // Check if we need to evict entries - only if maxCacheSize > 0
      if (this.maxCacheSize > 0) {
        const totalEntries = parseInt(await this.client.hGet(this.metaKey, 'totalEntries') || '0');
        if (totalEntries > this.maxCacheSize) {
          // Don't await - run eviction in background
          this.evictOldestAsync().catch(console.error);
        }
      }

      return false; // Not a duplicate
    } catch (error) {
      console.error('Error checking for duplicate hit:', error);
      return false; // In error case, allow the hit
    }
  }

  /**
   * Update the last activity timestamp for a visitor
   * Also extends the TTL for any existing hit records
   * @param visitorId The visitor ID
   * @param anonymousId The anonymous ID (if available)
   */
  async reportActivityAsync(visitorId: string, anonymousId: string | null): Promise<void> {
    if (this.fallbackMode || !this.isConnected) {
      return; // No-op in fallback mode
    }

    try {
      const now = Date.now().toString();
      const ttlSeconds = Math.floor(this.sessionTimeoutMs / 1000);

      // Set the activity timestamp with a TTL
      await this.client.hSet(this.activitiesKey, visitorId, now);
      await this.client.expire(this.activitiesKey, ttlSeconds);

      // Refresh TTL for visitor hits key if it exists
      const visitorHitKey = this.getVisitorHitsKey(visitorId);
      const visitorHitKeyExists = await this.client.exists(visitorHitKey);
      if (visitorHitKeyExists) {
        await this.client.expire(visitorHitKey, ttlSeconds);
      }

      // If there's an anonymous ID, update its activity too
      if (anonymousId && anonymousId !== visitorId) {
        await this.client.hSet(this.activitiesKey, anonymousId, now);

        // Refresh TTL for anonymous hits key if it exists
        const anonHitKey = this.getVisitorHitsKey(anonymousId);
        const anonHitKeyExists = await this.client.exists(anonHitKey);
        if (anonHitKeyExists) {
          await this.client.expire(anonHitKey, ttlSeconds);
        }
      }
    } catch (error) {
      console.error('Error reporting visitor activity:', error);
    }
  }

  /**
   * Evict oldest entries when cache limit is reached
   * Only active if maxCacheSize > 0
   */
  async evictOldestAsync(): Promise<void> {
    // Skip if fallback mode, not connected, or no max size set
    if (this.fallbackMode || !this.isConnected || this.maxCacheSize <= 0) {
      return;
    }

    try {
      // Get current total entries
      const totalEntriesStr = await this.client.hGet(this.metaKey, 'totalEntries');
      const totalEntries = parseInt(totalEntriesStr || '0');

      // If we're under the limit, nothing to do
      if (totalEntries <= this.maxCacheSize) {
        return;
      }

      // Calculate how many entries to remove
      const excessEntries = totalEntries - this.maxCacheSize;

      // Determine eviction percentage based on how far over the limit we are
      let evictionPercentage = this.evictionPercentage;

      // If we're more than 10% over the limit, use a more aggressive strategy
      if (excessEntries > this.maxCacheSize * 0.1) {
        evictionPercentage = Math.min(0.5, evictionPercentage * 1.5); // 50% or 1.5x normal rate
      }

      // If we're more than 50% over the limit, use very aggressive eviction
      if (excessEntries > this.maxCacheSize * 0.5) {
        evictionPercentage = 1.0; // Remove 100% of excess
      }

      const entriesToRemove = Math.max(1, Math.ceil(excessEntries * evictionPercentage));

      // Get all visitor activities and sort by timestamp (oldest first)
      const activities = await this.client.hGetAll(this.activitiesKey);

      const visitorActivities: [string, number][] = Object.entries(activities).map(
        ([visitorId, timestamp]) => [visitorId, parseInt(timestamp as string)]
      );

      // Sort by timestamp (oldest first)
      visitorActivities.sort((a, b) => a[1] - b[1]);

      let removedCount = 0;
      let visitorIndex = 0;

      // Pipeline for batch operations
      const pipeline = this.client.multi();

      // Remove entries from oldest visitors until we've removed enough
      while (removedCount < entriesToRemove && visitorIndex < visitorActivities.length) {
        const [visitorId] = visitorActivities[visitorIndex];
        const hitKey = this.getVisitorHitsKey(visitorId);

        // Get hit count for this visitor
        const hitCount = await this.client.sCard(hitKey);

        if (hitCount > 0) {
          removedCount += hitCount;

          // Remove visitor hits and activity
          pipeline.del(hitKey);
          pipeline.hDel(this.activitiesKey, visitorId);
        }

        visitorIndex++;
      }

      // Update total entries
      pipeline.hSet(this.metaKey, 'totalEntries', (totalEntries - removedCount).toString());

      // Execute all commands
      await pipeline.exec();
    } catch (error) {
      console.error('Error evicting oldest entries:', error);
    }
  }

  /**
   * Clean up expired sessions (visitors with no activity)
   * This is a no-op in Redis implementation since Redis automatically removes expired keys
   */
  async cleanupExpiredAsync(): Promise<void> {
    // No-op - Redis automatically removes expired keys
    return Promise.resolve();
  }

  /**
   * Release resources when no longer needed
   */
  async disposeAsync(): Promise<void> {
    // Close Redis connection if we created it
    if (!this.isClientProvided && this.isConnected) {
      try {
        await this.client.quit();
      } catch (error) {
        console.error('Error closing Redis connection:', error);
      }
      this.isConnected = false;
    }

    this.initialized = false;
  }

  /**
   * Get visitor hits key
   */
  private getVisitorHitsKey(visitorId: string): string {
    return `${this.hitsPrefix}${visitorId}`;
  }

  /**
   * Get the maximum cache size
   */
  getMaxCacheSize(): number {
    return this.maxCacheSize;
  }

  /**
   * Get the eviction percentage
   */
  getEvictionPercentage(): number {
    return this.evictionPercentage * 100; // Convert from decimal to percentage
  }

  /**
   * Get total entries count (for testing/monitoring)
   */
  async getTotalEntries(): Promise<number> {
    if (this.fallbackMode || !this.isConnected) {
      return 0;
    }

    try {
      const count = await this.client.hGet(this.metaKey, 'totalEntries');
      return parseInt(count || '0');
    } catch (error) {
      console.error('Error getting total entries:', error);
      return 0;
    }
  }

  /**
   * Get active visitor count (for testing/monitoring)
   */
  async getActiveVisitorCount(): Promise<number> {
    if (this.fallbackMode || !this.isConnected) {
      return 0;
    }

    try {
      return await this.client.hLen(this.activitiesKey);
    } catch (error) {
      console.error('Error getting active visitor count:', error);
      return 0;
    }
  }

  /**
   * Check if the deduplicator is ready
   */
  isReady(): boolean {
    return this.initialized && this.isConnected && !this.fallbackMode;
  }

  /**
   * Clear all hit deduplication data
   */
  async clearAsync(): Promise<void> {
    if (this.fallbackMode || !this.isConnected) {
      return;
    }

    try {
      // Get all keys with our prefix
      const keys = await this.client.keys(`${this.keyPrefix}*`);

      if (keys.length > 0) {
        // Delete all keys
        await this.client.del(keys);
      }

      // Reset metadata
      await this.client.hSet(this.metaKey, 'totalEntries', '0');
      await this.client.hSet(this.metaKey, 'lastCleanup', Date.now().toString());
    } catch (error) {
      console.error('Error clearing deduplication data:', error);
    }
  }
}
