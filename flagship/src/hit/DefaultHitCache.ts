import { IHitCacheImplementation } from './IHitCacheImplementation'
export const FS_HIT_PREFIX = 'FS_DEFAULT_HIT_CACHE_'
export class DefaultHitCache implements IHitCacheImplementation {
  cacheHit (visitorId: string, data: string):void {
    const localDatabase = localStorage.getItem(FS_HIT_PREFIX + visitorId)
    let dataJson = ''
    if (localDatabase) {
      const localData = localDatabase.slice(0, -1)
      dataJson = `${localData},${data}]`
    } else {
      dataJson = `[${data}]`
    }
    localStorage.setItem(FS_HIT_PREFIX + visitorId, dataJson)
  }

  lookupHits (visitorId: string):string {
    const data = localStorage.getItem(FS_HIT_PREFIX + visitorId)
    localStorage.removeItem(FS_HIT_PREFIX + visitorId)
    return data || ''
  }

  flushHits (visitorId: string):void {
    localStorage.removeItem(FS_HIT_PREFIX + visitorId)
  }
}
