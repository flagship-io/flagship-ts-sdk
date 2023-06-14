import { BatchTriggeredBy } from '../enum/BatchTriggeredBy.ts'
import { BASE_API_URL, BATCH_HIT, BATCH_MAX_SIZE, DEFAULT_HIT_CACHE_TIME_MS, FS_CONSENT, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, HitType, HIT_EVENT_URL, HIT_SENT_SUCCESS, SDK_INFO, TRACKING_MANAGER, TRACKING_MANAGER_ERROR, URL_ACTIVATE_MODIFICATION, ACTIVATE_HIT } from '../enum/index.ts'
import { ActivateBatch } from '../hit/ActivateBatch.ts'
import { Batch } from '../hit/Batch.ts'
import { HitAbstract, Event } from '../hit/index.ts'
import { logDebugSprintf, logErrorSprintf } from '../utils/utils.ts'
import { BatchingCachingStrategyAbstract, SendActivate } from './BatchingCachingStrategyAbstract.ts'

export class BatchingPeriodicCachingStrategy extends BatchingCachingStrategyAbstract {
  async addHitInPoolQueue (hit: HitAbstract) {
    this._hitsPoolQueue.set(hit.key, hit)
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

      logDebugSprintf(this.config, TRACKING_MANAGER, HIT_SENT_SUCCESS, ACTIVATE_HIT, {
        url,
        headers,
        body: requestBody,
        duration: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy[batchTriggeredBy]
      })

      activateBatch.hits.forEach(item => {
        this.onVisitorExposed(item)
        this.onUserExposure(item)
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      activateBatch.hits.forEach(item => {
        this._activatePoolQueue.set(item.key, item)
      })

      logErrorSprintf(this.config, TRACKING_MANAGER, TRACKING_MANAGER_ERROR, ACTIVATE_HIT, {
        message: error.message || error,
        url,
        headers,
        body: requestBody,
        duration: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy[batchTriggeredBy]
      })
    }
  }

  async notConsent (visitorId: string):Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const HitKeys = Array.from(this._hitsPoolQueue).filter(([_, item]) => {
      return (item.type !== HitType.EVENT || (item as Event)?.action !== FS_CONSENT) && (item.visitorId === visitorId || item.anonymousId === visitorId)
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const activateKeys = Array.from(this._activatePoolQueue).filter(([_, item]) => {
      return item.visitorId === visitorId || item.anonymousId === visitorId
    })

    HitKeys.forEach(([key]) => {
      this._hitsPoolQueue.delete(key)
    })

    activateKeys.forEach(([key]) => {
      this._activatePoolQueue.delete(key)
    })

    const mergedQueue = new Map<string, HitAbstract>([...this._hitsPoolQueue, ...this._activatePoolQueue])
    await this.flushAllHits()
    await this.cacheHit(mergedQueue)
  }

  async sendBatch (batchTriggeredBy = BatchTriggeredBy.BatchLength): Promise<void> {
    let hasActivateHit = false
    if (this._activatePoolQueue.size) {
      const activateHits = Array.from(this._activatePoolQueue.values())
      this._activatePoolQueue.clear()
      await this.sendActivate({ activateHitsPool: activateHits, batchTriggeredBy })
      hasActivateHit = true
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
      if (hasActivateHit) {
        await this.cacheHit(this._activatePoolQueue)
      }
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

      logDebugSprintf(this.config, TRACKING_MANAGER, HIT_SENT_SUCCESS, BATCH_HIT, {
        url: HIT_EVENT_URL,
        body: requestBody,
        headers,
        duration: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy[batchTriggeredBy]
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      batch.hits.forEach((hit) => {
        this._hitsPoolQueue.set(hit.key, hit)
      })
      logErrorSprintf(this.config, TRACKING_MANAGER, TRACKING_MANAGER_ERROR, BATCH_HIT, {
        message: error.message || error,
        url: HIT_EVENT_URL,
        headers,
        body: requestBody,
        duration: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy[batchTriggeredBy]
      })
    }
    const mergedQueue = new Map<string, HitAbstract>([...this._hitsPoolQueue, ...this._activatePoolQueue])
    await this.flushAllHits()
    await this.cacheHit(mergedQueue)
  }
}
