import { VisitorLookupCacheDTO, VisitorSaveCacheDTO } from '../models/visitorDTO'

export interface IVisitorCache {
    cacheVisitor:(visitorId: string, Data: VisitorSaveCacheDTO)=>void
    lookupVisitor(visitorId: string): VisitorLookupCacheDTO
    flushVisitor(visitorId: string):void
}
