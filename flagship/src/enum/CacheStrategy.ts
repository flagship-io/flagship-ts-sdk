
/**
 * Define the strategy that will be used for hit caching
 */
export enum CacheStrategy {
    /**
     * When a hit is emitted, it will be first cached in database using IHitCacheImplementation and added into the pool, then after batching and sending, it will also be flushed from database using IHitCacheImplementation.
     *
     * Note: the SDK has a default cache implementation for browser using localStorage
     */
    'CONTINUOUS_CACHING',

    /**
     * When a hit is emitted, it will be added into the pool, then after batching and sending, all database hits will be flushed, then the entire pool will be cached using IHitCacheImplementation for both actions.
     */
    'PERIODIC_CACHING'
}
