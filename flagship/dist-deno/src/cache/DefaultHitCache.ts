import { HitCacheDTO } from '../types.ts'
import { IHitCacheImplementation } from './IHitCacheImplementation.ts'
export const FS_HIT_PREFIX = 'FS_DEFAULT_HIT_CACHE_'
export class DefaultHitCache implements IHitCacheImplementation {
  cacheHit (visitorId: string, data: HitCacheDTO): Promise<void> {
    const localDatabase = localStorage.getItem(FS_HIT_PREFIX + visitorId)
    let dataJson = ''
    if (localDatabase) {
      const localData = localDatabase.slice(0, -1)
      dataJson = `${localData},${JSON.stringify(data)}]`
    } else {
      dataJson = `[${JSON.stringify(data)}]`
    }
    localStorage.setItem(FS_HIT_PREFIX + visitorId, dataJson)
    return Promise.resolve()
  }

  lookupHits (visitorId: string): Promise<HitCacheDTO[]> {
    const data = localStorage.getItem(FS_HIT_PREFIX + visitorId)
    localStorage.removeItem(FS_HIT_PREFIX + visitorId)
    return Promise.resolve(data ? JSON.parse(data) : null)
  }

  flushHits (visitorId: string):Promise<void> {
    localStorage.removeItem(FS_HIT_PREFIX + visitorId)
    return Promise.resolve()
  }
}
