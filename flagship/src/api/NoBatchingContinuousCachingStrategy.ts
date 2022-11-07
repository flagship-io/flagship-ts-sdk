import { IFlagshipConfig } from '../config/index'
import { BatchTriggeredBy } from '../enum/BatchTriggeredBy'
import { HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, HEADER_CONTENT_TYPE, HEADER_APPLICATION_JSON, HIT_EVENT_URL, HitType, BATCH_MAX_SIZE, BATCH_SENT_SUCCESS, SEND_BATCH, HIT_SENT_SUCCESS, BASE_API_URL, SEND_ACTIVATE, URL_ACTIVATE_MODIFICATION, SEND_HIT, FS_CONSENT, SDK_INFO, DEFAULT_HIT_CACHE_TIME_MS } from '../enum/index'
import { Activate } from '../hit/Activate'
import { ActivateBatch } from '../hit/ActivateBatch'
import { Batch } from '../hit/Batch'
import { HitAbstract, Event } from '../hit/index'
import { IHttpClient } from '../utils/HttpClient'
import { errorFormat, logDebug, logError, sprintf, uuidV4 } from '../utils/utils'
import { BatchingCachingStrategyAbstract, SendActivate } from './BatchingCachingStrategyAbstract'

export class NoBatchingContinuousCachingStrategy extends BatchingCachingStrategyAbstract {
  protected cacheHitKeys:Record<string, string>

  constructor (config: IFlagshipConfig, httpClient: IHttpClient, hitsPoolQueue: Map<string, HitAbstract>, activatePoolQueue: Map<string, Activate>) {
    super(config, httpClient, hitsPoolQueue, activatePoolQueue)
    this.cacheHitKeys = {}
  }

  async sendActivate ({ activateHitsPool, currentActivate, batchTriggeredBy }:SendActivate) {
    const headers = {
      [HEADER_X_API_KEY]: this.config.apiKey as string,
      [HEADER_X_SDK_CLIENT]: SDK_INFO.name,
      [HEADER_X_SDK_VERSION]: SDK_INFO.version,
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    const activateBatch = new ActivateBatch(Array.from(activateHitsPool), this.config)

    if (currentActivate) {
      activateBatch.hits.push(currentActivate)
    }

    const requestBody = activateBatch.toApiKeys()

    const url = BASE_API_URL + URL_ACTIVATE_MODIFICATION
    const now = Date.now()
    try {
      await this._httpClient.postAsync(url, {
        headers,
        body: requestBody,
        timeout: this.config.timeout
      })

      logDebug(this.config, sprintf(HIT_SENT_SUCCESS, JSON.stringify({
        ...requestBody,
        duration: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy[batchTriggeredBy]
      })), SEND_ACTIVATE)

      const hitKeysToRemove:string[] = activateHitsPool.map(item => item.key)

      if (hitKeysToRemove.length) {
        await this.flushHits(hitKeysToRemove)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      activateBatch.hits.forEach((item) => {
        this.cacheHitKeys[item.key] = item.key
      })

      if (currentActivate) {
        await this.cacheHit(new Map<string, Activate>([[currentActivate.key, currentActivate]]))
      }

      logError(this.config, errorFormat(error.message || error, {
        url,
        headers,
        body: requestBody,
        duration: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy[batchTriggeredBy]
      }), SEND_ACTIVATE)
    }
  }

  async activateFlag (hit: Activate): Promise<void> {
    const hitKey = `${hit.visitorId}:${uuidV4()}`
    hit.key = hitKey

    await this.sendActivate({ activateHitsPool: [], currentActivate: hit, batchTriggeredBy: BatchTriggeredBy.ActivateLength })
  }

  async addHit (hit: HitAbstract): Promise<void> {
    const hitKey = `${hit.visitorId}:${uuidV4()}`
    hit.key = hitKey

    if (hit.type === HitType.EVENT && (hit as Event).action === FS_CONSENT && (hit as Event).label === `${SDK_INFO.name}:false`) {
      await this.notConsent(hit.visitorId)
    }

    await this.sendHit(hit)
  }

  async sendHit (hit:HitAbstract):Promise<void> {
    const headers = {
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    const requestBody = hit.toApiKeys()

    const now = Date.now()
    try {
      await this._httpClient.postAsync(HIT_EVENT_URL, {
        headers,
        body: requestBody,
        timeout: this.config.timeout
      })

      logDebug(this.config, sprintf(HIT_SENT_SUCCESS, JSON.stringify({
        ...requestBody,
        duration: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy[BatchTriggeredBy.DirectHit]
      })), SEND_HIT)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      if (hit.type !== HitType.EVENT || (hit as Event).action !== FS_CONSENT) {
        this.cacheHitKeys[hit.key] = hit.key
      }
      await this.cacheHit(new Map<string, HitAbstract>().set(hit.key, hit))
      logError(this.config, errorFormat(error.message || error, {
        url: HIT_EVENT_URL,
        headers,
        body: requestBody,
        duration: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy[BatchTriggeredBy.DirectHit]
      }), SEND_HIT)
    }
  }

  async notConsent (visitorId: string): Promise<void> {
    const keys = Object.keys(this.cacheHitKeys)
    const hitsPoolQueueKeys = Array.from(this._hitsPoolQueue).filter(([key, item]) => {
      return (item?.type !== HitType.EVENT || (item as Event)?.action !== FS_CONSENT) && key.includes(visitorId)
    })

    const keysToFlush:string[] = []
    hitsPoolQueueKeys.forEach(([key]) => {
      this._hitsPoolQueue.delete(key)
      keysToFlush.push(key)
    })

    const mergedKeys = [...keys, ...keysToFlush]

    if (!mergedKeys.length) {
      return
    }

    await this.flushHits(mergedKeys)
    this.cacheHitKeys = {}
  }

  async sendBatch (batchTriggeredBy = BatchTriggeredBy.BatchLength): Promise<void> {
    if (this._activatePoolQueue.size) {
      const activateHits = Array.from(this._activatePoolQueue.values())
      this._activatePoolQueue.clear()
      await this.sendActivate({ activateHitsPool: activateHits, batchTriggeredBy })
    }
    const headers = {
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    const batch:Batch = new Batch({ hits: [] })
    batch.config = this.config

    let batchSize = 0
    const hitKeysToRemove:string[] = []

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [key, item] of this._hitsPoolQueue) {
      if ((Date.now() - item.createdAt) >= DEFAULT_HIT_CACHE_TIME_MS) {
        hitKeysToRemove.push(key)
        continue
      }
      batchSize = JSON.stringify(batch).length
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
        batchTriggeredBy: BatchTriggeredBy[BatchTriggeredBy.DirectHit]
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
        batchTriggeredBy: BatchTriggeredBy[BatchTriggeredBy.DirectHit]
      }), SEND_BATCH)
    }
  }
}
