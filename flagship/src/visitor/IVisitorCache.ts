export interface IVisitorCache {
    /**
     * This method will be called after synchronization in order to cache visitor data
     * @param {string} visitorId visitor ID
     * @param {string} data visitor data JSON
     */
    cacheVisitor:(visitorId: string, Data: string)=>void
    /**
     * This method will be called to load visitor cache data corresponding to visitor
     * @param visitorId visitor ID
     */
    lookupVisitor(visitorId: string): string

    /**
     * This method will be called to erase the visitor cache data
     * @param visitorId
     */
    flushVisitor(visitorId: string):void
}
