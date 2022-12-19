import { DecisionMode, IFlagshipConfig } from '../config/index'
import { BatchTriggeredBy } from '../enum/BatchTriggeredBy'
import { ACTIVATE_ADDED_IN_QUEUE, ADD_ACTIVATE, ADD_HIT, BATCH_MAX_SIZE, BATCH_SENT_SUCCESS, DEFAULT_HIT_CACHE_TIME_MS, FLUSH_ALL_HITS, FS_CONSENT, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HitType, HIT_ADDED_IN_QUEUE, HIT_CACHE_VERSION, HIT_DATA_CACHED, HIT_DATA_FLUSHED, HIT_EVENT_URL, PROCESS_CACHE_HIT, PROCESS_FLUSH_HIT, SDK_APP, SDK_INFO, SEND_BATCH } from '../enum/index'
import { Activate } from '../hit/Activate'
import { Batch } from '../hit/Batch'
import { HitAbstract, Event } from '../hit/index'
import { HitCacheDTO } from '../types'
import { IHttpClient } from '../utils/HttpClient'
import { errorFormat, logDebug, logError, sprintf, uuidV4 } from '../utils/utils'
import { ITrackingManagerCommon } from './ITrackingManagerCommon'

export type SendActivate = {
  activateHitsPool:Activate[],
 currentActivate?:Activate
 batchTriggeredBy: BatchTriggeredBy
}

export abstract class BatchingCachingStrategyAbstract implements ITrackingManagerCommon {
  protected _config : IFlagshipConfig
  protected _hitsPoolQueue: Map<string, HitAbstract>
  protected _activatePoolQueue: Map<string, Activate>
  protected _httpClient: IHttpClient

  public get config () : IFlagshipConfig {
    return this._config
  }

  constructor (config: IFlagshipConfig, httpClient: IHttpClient, hitsPoolQueue: Map<string, HitAbstract>, activatePoolQueue: Map<string, Activate>) {
    this._config = config
    this._hitsPoolQueue = hitsPoolQueue
    this._httpClient = httpClient
    this._activatePoolQueue = activatePoolQueue
  }

  async addHit (hit: HitAbstract): Promise<void> {
    const hitKey = `${hit.visitorId}:${uuidV4()}`
    hit.key = hitKey

    await this.addHitInPoolQueue(hit)

    if (hit.type === HitType.EVENT && (hit as Event).action === FS_CONSENT && (hit as Event).label === `${SDK_INFO.name}:false`) {
      await this.notConsent(hit.visitorId)
    }

    logDebug(this.config, sprintf(HIT_ADDED_IN_QUEUE, JSON.stringify(hit.toApiKeys())), ADD_HIT)

    if (this.config.trackingMangerConfig?.poolMaxSize &&
      this._hitsPoolQueue.size >= this.config.trackingMangerConfig.poolMaxSize &&
      this.config.decisionMode !== DecisionMode.EDGE
    ) {
      this.sendBatch()
    }
  }

    abstract addHitInPoolQueue (hit: HitAbstract):Promise<void>

    async activateFlag (hit: Activate):Promise<void> {
      const hitKey = `${hit.visitorId}:${uuidV4()}`
      hit.key = hitKey

      if (this.config.decisionMode === DecisionMode.EDGE) {
        await this.activateFlagEdgeMode(hit)
        logDebug(this.config, sprintf(ACTIVATE_ADDED_IN_QUEUE, JSON.stringify(hit.toApiKeys())), ADD_ACTIVATE)
        return
      }

      let activateHitsPool:Activate[] = []
      if (this._activatePoolQueue.size) {
        activateHitsPool = Array.from(this._activatePoolQueue.values())
      }
      this._activatePoolQueue.clear()

      await this.sendActivate({ activateHitsPool, currentActivate: hit, batchTriggeredBy: BatchTriggeredBy.ActivateLength })
    }

    protected async activateFlagEdgeMode (hit: Activate): Promise<void> {
      this._activatePoolQueue.set(hit.key, hit)
      await this.cacheHit(new Map<string, HitAbstract>([[hit.key, hit]]))
    }

    protected abstract sendActivate ({ activateHitsPool, currentActivate, batchTriggeredBy }:SendActivate): Promise<void>

    async sendBatch (batchTriggeredBy = BatchTriggeredBy.BatchLength): Promise<void> {
      if (this._activatePoolQueue.size) {
        const activateHits = Array.from(this._activatePoolQueue.values())
        this._activatePoolQueue.clear()
        await this.sendActivate({ activateHitsPool: activateHits, batchTriggeredBy })
      }

      const batch:Batch = new Batch({ hits: [], ds: SDK_APP })
      batch.config = this.config

      const hitKeysToRemove:string[] = []

      for (const [key, item] of this._hitsPoolQueue) {
        if ((Date.now() - item.createdAt) >= DEFAULT_HIT_CACHE_TIME_MS) {
          hitKeysToRemove.push(key)
          continue
        }
        const batchSize = JSON.stringify(batch).length
        if (batchSize > BATCH_MAX_SIZE) {
          break
        }
        batch.hits.push(item)
        hitKeysToRemove.push(key)
      }

      hitKeysToRemove.forEach(key => {
        this._hitsPoolQueue.delete(key)
      })

      if (!batch.hits.length) {
        return
      }

      const headers = {
        [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
      }

      const requestBody = batch.toApiKeys()

      const now = Date.now()
      try {
        await this._httpClient.postAsync(HIT_EVENT_URL, {
          headers,
          body: requestBody,
          timeout: this.config.timeout
        })

        logDebug(this.config, sprintf(BATCH_SENT_SUCCESS, JSON.stringify({
          ...requestBody,
          duration: Date.now() - now,
          batchTriggeredBy: BatchTriggeredBy[batchTriggeredBy]
        })), SEND_BATCH)

        await this.flushHits(hitKeysToRemove)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error:any) {
        batch.hits.forEach((hit) => {
          this._hitsPoolQueue.set(hit.key, hit)
        })

        logError(this.config, errorFormat(error.message || error, {
          url: HIT_EVENT_URL,
          headers,
          body: requestBody,
          duration: Date.now() - now,
          batchTriggeredBy: BatchTriggeredBy[batchTriggeredBy]
        }), SEND_BATCH)
      }
    }

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

    public async flushAllHits (): Promise<void> {
      try {
        const hitCacheImplementation = this.config.hitCacheImplementation
        if (this.config.disableCache || !hitCacheImplementation || typeof hitCacheImplementation.flushAllHits !== 'function') {
          return
        }
        await hitCacheImplementation.flushAllHits()
        logDebug(this.config, FLUSH_ALL_HITS, PROCESS_FLUSH_HIT)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error:any) {
        logError(this.config, error.message || error, PROCESS_FLUSH_HIT)
      }
    }
}
