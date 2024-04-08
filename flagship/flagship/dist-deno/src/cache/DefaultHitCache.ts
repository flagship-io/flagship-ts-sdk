import { HitCacheDTO } from '../types.ts'
import { IHitCacheImplementation } from './IHitCacheImplementation.ts'

export const FS_HIT_PREFIX = 'FS_DEFAULT_HIT_CACHE'

export class DefaultHitCache implements IHitCacheImplementation {
  cacheHit (hits: Record<string, HitCacheDTO>): Promise<void> {
    const localDatabaseJson = localStorage.getItem(FS_HIT_PREFIX) || '{}'
    const localDatabase = JSON.parse(localDatabaseJson)

    const newLocalDatabase = {
      ...localDatabase,
      ...hits
    }

    localStorage.setItem(FS_HIT_PREFIX, JSON.stringify(newLocalDatabase))

    return Promise.resolve()
  }

  lookupHits (): Promise<Record<string, HitCacheDTO>> {
    const localDatabaseJson = localStorage.getItem(FS_HIT_PREFIX) || '{}'
    const localDatabase = JSON.parse(localDatabaseJson)
    return Promise.resolve(localDatabase)
  }

  flushHits (hitKeys: string[]): Promise<void> {
    const localDatabaseJson = localStorage.getItem(FS_HIT_PREFIX) || '{}'
    const localDatabase:Record<string, HitCacheDTO> = JSON.parse(localDatabaseJson)

    hitKeys.forEach(key => {
      delete localDatabase[key]
    })

    localStorage.setItem(FS_HIT_PREFIX, JSON.stringify(localDatabase))
    return Promise.resolve()
  }

  flushAllHits (): Promise<void> {
    localStorage.removeItem(FS_HIT_PREFIX)
    return Promise.resolve()
  }
}
