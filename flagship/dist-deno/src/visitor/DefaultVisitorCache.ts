import { VisitorLookupCacheDTO, VisitorSaveCacheDTO } from '../types.ts'
import { IVisitorCacheImplementation } from './IVisitorCacheImplementation .ts'

export const VISITOR_PREFIX = 'FS_VISITOR_CACHE_'
export class DefaultVisitorCache implements IVisitorCacheImplementation {
  cacheVisitor (visitorId: string, data:VisitorSaveCacheDTO):void {
    localStorage.setItem(VISITOR_PREFIX + visitorId, JSON.stringify(data))
  }

  lookupVisitor (visitorId: string):VisitorLookupCacheDTO {
    const data = localStorage.getItem(VISITOR_PREFIX + visitorId)
    return data ? JSON.parse(data) : null
  }

  flushVisitor (visitorId: string):void {
    localStorage.removeItem(VISITOR_PREFIX + visitorId)
  }
}
