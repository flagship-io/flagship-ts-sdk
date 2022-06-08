import { IFlagshipConfig } from '../config'
import { HIT_CACHE_VERSION, PROCESS_CACHE_HIT } from '../enum/index'
import { HitAbstract } from '../hit/index'
import { HitCacheDTO } from '../types'
import { IHttpClient } from '../utils/HttpClient'
import { logError } from '../utils/utils'
import { ITrackingManagerCommon } from './TrackingManagerAbstract'

export const LOOKUP_HITS_JSON_OBJECT_ERROR = 'JSON DATA must fit the type HitCacheDTO'
export const LOOKUP_VISITOR_JSON_OBJECT_ERROR = 'JSON DATA must fit the type VisitorCacheDTO'

export abstract class CachingStrategyAbstract implements ITrackingManagerCommon {
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

    abstract sendBatch(): Promise<void>

    abstract notConsent(visitorId: string): Promise<void>

    async addHits (hits: HitAbstract[]): Promise<void> {
      await Promise.all(hits.map(hit => this.addHit(hit)))
    }

    protected async cacheHit (hits:Map<string, HitAbstract>):Promise<void> {
      try {
        const hitCacheImplementation = this.config.hitCacheImplementation
        if (this.config.disableCache || !hitCacheImplementation || typeof hitCacheImplementation.cacheHit !== 'function') {
          return
        }

        const data : Record<string, HitCacheDTO> = {}

        hits.forEach((item, key) => {
          const hitData: HitCacheDTO = {
            version: HIT_CACHE_VERSION,
            data: {
              visitorId: item.visitorId,
              anonymousId: item.anonymousId,
              type: item.type,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              content: item.toObject() as any,
              time: Date.now()
            }
          }
          data[key] = hitData
        })

        await hitCacheImplementation.cacheHit(data)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error:any) {
        logError(this.config, error.message || error, PROCESS_CACHE_HIT)
      }
    }

    public async flushHits (hitKeys:string[]): Promise<void> {
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
