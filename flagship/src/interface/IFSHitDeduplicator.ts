import { IFlagshipConfig } from '../config/IFlagshipConfig';

/**
 * Interface for hit deduplication implementations
 */
export interface IFSHitDeduplicator {
    /**
     * Configure the deduplicator with Flagship config
     */
    setConfig(config: IFlagshipConfig): void;

    /**
     * Check if a hit is a duplicate
     * This method checks if a hit is a duplicate based on the visitor ID, anonymous ID, and the value to check for duplicates.
     * @param visitorId The visitor ID
     * @param anonymousId The anonymous ID
     * @param value The value to check for duplicates
     * @returns true if duplicate, false if new
     */
    isDuplicateAsync(visitorId: string, anonymousId: string|null, value: string): Promise<boolean>;

    /**
     * Evict oldest entries when cache limit is reached
     */
    evictOldestAsync(): Promise<void>;

    /**
     * Clean up expired entries
     */
    cleanupExpiredAsync(): Promise<void>;

    /**
     * Initialize the deduplicator
     */
    initializeAsync(): Promise<void>;

    /**
     * Release resources when deduplicator is no longer needed
     */
    disposeAsync(): Promise<void>;

    /**
     * Report the last activity of a visitor to the deduplicator
     * This is used to update the last activity timestamp of a visitor in the deduplicator.
     * This is useful for deduplication strategies that rely on the last activity timestamp to determine if the visitor session should be ended.
     * For example, if a visitor has not been active for a certain period of time, the deduplicator may consider their session to be ended and allow new hits to be sent.
     * @param visitorId The visitor ID
     * @param anonymousId The anonymous ID
     */
    reportActivityAsync(visitorId: string, anonymousId: string|null): Promise<void>;

    /**
     * Get current maximum cache size
     * @returns The maximum number of entries allowed (0 means no limit)
     */
    getMaxCacheSize(): number;

    /**
     * Get current eviction percentage
     * @returns The percentage of excess entries to remove during eviction (0-100)
     */
    getEvictionPercentage(): number;
}
