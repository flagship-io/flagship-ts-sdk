import { HitCacheDTO } from '../types.ts'
import { IHitCacheImplementation } from './IHitCacheImplementation.ts'
export const FS_HIT_KEYS = 'FS_HIT_KEYS'
export class DefaultHitCache implements IHitCacheImplementation {
  cacheHit (hits: Map<string, HitCacheDTO>): Promise<void> {
    const localDatabaseKeys = localStorage.getItem(FS_HIT_KEYS) || '[]'
    const localDatabaseKeysArray:string[] = JSON.parse(localDatabaseKeys)
    hits.forEach((hit, key) => {
      const dataJson = JSON.stringify(hit)
      if (!localDatabaseKeysArray.includes(key)) {
        localDatabaseKeysArray.push(key)
      }
      localStorage.setItem(key, dataJson)
    })
    localStorage.setItem(FS_HIT_KEYS, JSON.stringify(localDatabaseKeysArray))
    return Promise.resolve()
  }

  lookupHits (): Promise<Map<string, HitCacheDTO>> {
    const localDatabaseKeys = localStorage.getItem(FS_HIT_KEYS) || '[]'
    const localDatabaseKeysArray:string[] = JSON.parse(localDatabaseKeys)
    const data = new Map<string, HitCacheDTO>()
    localDatabaseKeysArray.forEach(localKey => {
      const hitString = localStorage.getItem(localKey)
      if (!hitString) {
        return
      }
      const hit = JSON.parse(hitString)
      data.set(localKey, hit)
    })
    return Promise.resolve(data)
  }

  flushHits (hitKeys: string[]): Promise<void> {
    const localDatabaseKeys = localStorage.getItem(FS_HIT_KEYS) || '[]'
    const localDatabaseKeysArray:string[] = JSON.parse(localDatabaseKeys)
    hitKeys.forEach(key => {
      localStorage.removeItem(key)
    })
    const newKeysArray = localDatabaseKeysArray.filter(x => !hitKeys.includes(x))
    localStorage.setItem(FS_HIT_KEYS, JSON.stringify(newKeysArray))
    return Promise.resolve()
  }
}
