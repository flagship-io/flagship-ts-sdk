
export interface IHitCacheImplementation {
    /**
     * This method will be called when a hit has failed to be sent if there is no internet, there has been a timeout or if the request responded with something > 2XX
     * @param visitorId visitor ID
     * @param data hit data
     */
    cacheHit(visitorId:string, data: string):void
    /**
     * This method will be called to load hits from cache and trying to send it again in the background.
     * Note: Hits older than 4H will be ignored
     * @param visitorId Visitor
     */
    lookupHits(visitorId: string): string
    /**
     * This method will be called to erase the hits cache
     * @param visitorId visitor ID
     */
    flushHits(visitorId: string):void
}
