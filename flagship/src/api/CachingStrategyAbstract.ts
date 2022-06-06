import { IFlagshipConfig } from '../config'
import { PROCESS_CACHE_HIT } from '../enum/index'
import { HitAbstract, IHitAbstract } from '../hit/index'
import { IHttpClient } from '../utils/HttpClient'
import { logError } from '../utils/utils'
import { ITrackingManager } from './TrackingManagerAbstract'

export const LOOKUP_HITS_JSON_ERROR = 'JSON DATA must be an array of object'
export const LOOKUP_HITS_JSON_OBJECT_ERROR = 'JSON DATA must fit the type HitCacheDTO'
export const LOOKUP_VISITOR_JSON_OBJECT_ERROR = 'JSON DATA must fit the type VisitorCacheDTO'

export abstract class CachingStrategyAbstract implements ITrackingManager {
    protected _config : IFlagshipConfig;
    protected _hitsPoolQueue: Map<string, HitAbstract>
    protected _httpClient: IHttpClient;

    public get config () : IFlagshipConfig {
      return this._config
    }

    constructor (config: IFlagshipConfig, httpClient: IHttpClient, hitsPoolQueue: Map<string, HitAbstract>) {
      this._config = config
      this._hitsPoolQueue = hitsPoolQueue
      this._httpClient = httpClient
    }

    abstract addHit (hit: HitAbstract): Promise<void>

    abstract addHits (hits: HitAbstract[]): Promise<void>

    abstract sendBatch(): Promise<string[]>

    async lookupHits ():Promise<Map<string, IHitAbstract>|null> {
      try {
        const hitCacheImplementation = this.config.hitCacheImplementation
        if (this.config.disableCache || !hitCacheImplementation || typeof hitCacheImplementation.lookupHits !== 'function') {
          return null
        }

        const hitsCache = await hitCacheImplementation.lookupHits()
        if (!hitsCache) {
          return null
        }
        if (!(hitsCache instanceof Map)) {
          throw Error(LOOKUP_HITS_JSON_ERROR)
        }
        return hitsCache
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error:any) {
        logError(this.config, error.message || error, 'lookupHits')
      }
      return null
    }

    protected async cacheHit (hits:Map<string, IHitAbstract>):Promise<void> {
      try {
        const hitCacheImplementation = this.config.hitCacheImplementation
        if (this.config.disableCache || !hitCacheImplementation || typeof hitCacheImplementation.cacheHit !== 'function') {
          return
        }

        await hitCacheImplementation.cacheHit(hits)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error:any) {
        logError(this.config, error.message || error, PROCESS_CACHE_HIT)
      }
    }

    protected async flushHits (hitKeys:string[]): Promise<void> {
      try {
        const hitCacheImplementation = this.config.hitCacheImplementation
        if (this.config.disableCache || !hitCacheImplementation || typeof hitCacheImplementation.flushHits !== 'function') {
          return
        }

        await hitCacheImplementation.flushHits(hitKeys)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error:any) {
        logError(this.config, error.message || error, 'flushHits')
      }
    }
}
