import { IFlagshipConfig } from '../config/index.ts'
import { HIT_CACHE_VERSION, HIT_DATA_CACHED, HIT_DATA_FLUSHED, PROCESS_CACHE_HIT, PROCESS_FLUSH_HIT } from '../enum/index.ts'
import { HitAbstract } from '../hit/index.ts'
import { HitCacheDTO } from '../types.ts'
import { IHttpClient } from '../utils/HttpClient.ts'
import { logDebug, logError, sprintf } from '../utils/utils.ts'
import { ITrackingManagerCommon } from './TrackingManagerAbstract.ts'

export const LOOKUP_HITS_JSON_OBJECT_ERROR = 'JSON DATA must fit the type HitCacheDTO'
export const LOOKUP_VISITOR_JSON_OBJECT_ERROR = 'JSON DATA must fit the type VisitorCacheDTO'

export abstract class BatchingCachingStrategyAbstract implements ITrackingManagerCommon {
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
        logDebug(this.config, sprintf(HIT_DATA_CACHED, JSON.stringify(data)), PROCESS_CACHE_HIT)
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
        logDebug(this.config, sprintf(HIT_DATA_FLUSHED, JSON.stringify(hitKeys)), PROCESS_FLUSH_HIT)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error:any) {
        logError(this.config, error.message || error, PROCESS_FLUSH_HIT)
      }
    }
}