
export interface IHitCache {
    cacheHit(visitorId:string, data: string):void
    lookupHits(visitorId: string): string
    flushHits(visitorId: string):void
}
