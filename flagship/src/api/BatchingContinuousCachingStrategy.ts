import { BatchTriggeredBy } from '../enum/BatchTriggeredBy'
import { ADD_HIT, BASE_API_URL, BATCH_MAX_SIZE, BATCH_SENT_SUCCESS, DEFAULT_HIT_CACHE_TIME_MS, FS_CONSENT, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, HitType, HIT_ADDED_IN_QUEUE, HIT_EVENT_URL, HIT_SENT_SUCCESS, SDK_APP, SDK_INFO, SEND_ACTIVATE, SEND_BATCH, URL_ACTIVATE_MODIFICATION } from '../enum/index'
import { Activate } from '../hit/Activate'
import { ActivateBatch } from '../hit/ActivateBatch'
import { Batch } from '../hit/Batch'
import { HitAbstract, Event } from '../hit/index'
import { errorFormat, logDebug, logError, sprintf, uuidV4 } from '../utils/utils'
import { BatchingCachingStrategyAbstract, SendActivate } from './BatchingCachingStrategyAbstract'

export class BatchingContinuousCachingStrategy extends BatchingCachingStrategyAbstract {
  async addHit (hit: HitAbstract): Promise<void> {
    const hitKey = `${hit.visitorId}:${uuidV4()}`
    hit.key = hitKey

    this._hitsPoolQueue.set(hitKey, hit)
    await this.cacheHit(new Map<string, HitAbstract>([[hitKey, hit]]))

    if (hit.type === HitType.EVENT && (hit as Event).action === FS_CONSENT && (hit as Event).label === `${SDK_INFO.name}:false`) {
      await this.notConsent(hit.visitorId)
    }

    logDebug(this.config, sprintf(HIT_ADDED_IN_QUEUE, JSON.stringify(hit.toApiKeys())), ADD_HIT)

    if (this.config.trackingMangerConfig?.poolMaxSize && this._hitsPoolQueue.size >= this.config.trackingMangerConfig.poolMaxSize) {
      this.sendBatch()
    }
  }

  protected async sendActivate ({ activateHitsPool, currentActivate, batchTriggeredBy }:SendActivate) {
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

      const hitKeysToRemove = activateHitsPool.map(item => item.key)

      if (hitKeysToRemove.length) {
        await this.flushHits(hitKeysToRemove)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      activateBatch.hits.forEach(item => {
        this._activatePoolQueue.set(item.key, item)
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

  async notConsent (visitorId: string):Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const keys = Array.from(this._hitsPoolQueue).filter(([_, item]) => {
      return (item?.type !== HitType.EVENT || (item as Event)?.action !== FS_CONSENT) && (item.visitorId === visitorId || item.anonymousId === visitorId)
    })

    const keysToFlush:string[] = []
    keys.forEach(([key]) => {
      this._hitsPoolQueue.delete(key)
      keysToFlush.push(key)
    })
    if (!keysToFlush.length) {
      return
    }
    await this.flushHits(keysToFlush)
  }

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
}
