import { HitCacheLookupDTO, HitCacheSaveDTO } from '../models/HitDTO'

export interface IHitCache {
    cacheHit(visitorId:string, data: HitCacheSaveDTO):void
    lookupHits(visitorId: string): HitCacheLookupDTO[]
    flushHits(visitorId: string):void
}
