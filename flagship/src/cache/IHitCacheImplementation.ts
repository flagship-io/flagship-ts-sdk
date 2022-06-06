import { IHitAbstract } from '../hit/index'

export interface IHitCacheImplementation {
    /**
     * This method will be called to cache visitor hits when a hit has failed to be sent if there is no internet, there has been a timeout or if the request responded with something > 2XX. */
    cacheHit(hits: Map<string, IHitAbstract>):Promise<void>
    /**
     * This method will be called to load hits corresponding to visitor ID from your database and trying to send them again in the background.
     * Note: Hits older than 4H will be ignored
     */
    lookupHits():Promise<Map<string, IHitAbstract>>
    /**
     * This method will be called to erase the visitor hits cache corresponding to visitor ID from your database. */
    flushHits(hitIds: string[]): Promise<void>
}
