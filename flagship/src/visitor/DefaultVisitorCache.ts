import { IVisitorCache } from './IVisitorCache'

export const VISITOR_PREFIX = 'FS_VISITOR_CACHE_'
export class DefaultVisitorCache implements IVisitorCache {
  cacheVisitor (visitorId: string, data: string):void {
    localStorage.setItem(VISITOR_PREFIX + visitorId, data)
  }

  lookupVisitor (visitorId: string):string {
    const data = localStorage.getItem(VISITOR_PREFIX + visitorId)
    localStorage.removeItem(VISITOR_PREFIX + visitorId)
    return data || ''
  }

  flushVisitor (visitorId: string):void {
    localStorage.removeItem(VISITOR_PREFIX + visitorId)
  }
}
