import { BatchTriggeredBy } from '../enum/BatchTriggeredBy'
import { BASE_API_URL, BATCH_MAX_SIZE, BATCH_SENT_SUCCESS, DEFAULT_HIT_CACHE_TIME_MS, FS_CONSENT, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, HitType, HIT_EVENT_URL, HIT_SENT_SUCCESS, LogLevel, SDK_INFO, SEND_ACTIVATE, SEND_BATCH, URL_ACTIVATE_MODIFICATION } from '../enum/index'
import { ActivateBatch } from '../hit/ActivateBatch'
import { Batch } from '../hit/Batch'
import { HitAbstract, Event } from '../hit/index'
import { Troubleshooting } from '../hit/Troubleshooting'
import { errorFormat, logDebug, logError, sprintf, uuidV4 } from '../utils/utils'
import { BatchingCachingStrategyAbstract } from './BatchingCachingStrategyAbstract'
import { SendActivate } from './types'

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
    const httpInstanceId = uuidV4()
    try {
      await this._httpClient.postAsync(url, {
        headers,
        body: requestBody,
        timeout: this.config.timeout
      })

      activateBatch.hits.forEach(item => {
        this.onVisitorExposed(item)
        this.onUserExposure(item)
      })

      logDebug(this.config, sprintf(HIT_SENT_SUCCESS, JSON.stringify({
        ...requestBody,
        duration: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy[batchTriggeredBy]
      })), SEND_ACTIVATE)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      activateBatch.hits.forEach(item => {
        this._activatePoolQueue.set(item.key, item)
      })

      logError(this.config, errorFormat(error.message || error, {
        url,
        headers,
        body: requestBody,
        duration: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy[batchTriggeredBy]
      }), SEND_ACTIVATE)

      const monitoringHttpResponse = new Troubleshooting({
        type: 'TROUBLESHOOTING',
        subComponent: 'SEND-ACTIVATE-HIT-ROUTE-ERROR',
        logLevel: LogLevel.ERROR,
        message: 'SEND-ACTIVATE-HIT-ROUTE-ERROR',
        visitorId: `${this._flagshipInstanceId}`,
        traffic: 0,
        config: this.config,
        httpInstanceId,
        httpRequestBody: requestBody,
        httpRequestHeaders: headers,
        httpRequestMethod: 'POST',
        httpRequestUrl: url,
        httpResponseBody: error?.message,
        httpResponseHeaders: error?.headers,
        httpResponseCode: error?.statusCode,
        httpResponseTime: Date.now() - now,
        batchTriggeredBy
      })

      await this.sendTroubleshootingHit(monitoringHttpResponse)
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
    const httpInstanceId = uuidV4()
    try {
      const monitoringHttpRequest = new Troubleshooting({
        type: 'TROUBLESHOOTING',
        subComponent: 'SEND-BATCH-HIT-ROUTE-REQUEST',
        logLevel: LogLevel.INFO,
        message: 'SEND-BATCH-HIT-ROUTE-REQUEST',
        visitorId: `${this._flagshipInstanceId}`,
        traffic: 0,
        config: this.config,
        httpInstanceId,
        httpRequestBody: requestBody,
        httpRequestHeaders: headers,
        httpRequestMethod: 'POST',
        httpRequestUrl: HIT_EVENT_URL
      })

      this.addTroubleshootingHit(monitoringHttpRequest)

      const response = await this._httpClient.postAsync(HIT_EVENT_URL, {
        headers,
        body: requestBody,
        timeout: this.config.timeout
      })

      logDebug(this.config, sprintf(BATCH_SENT_SUCCESS, JSON.stringify({
        ...requestBody,
        duration: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy[batchTriggeredBy]
      })), SEND_BATCH)

      const monitoringHttpResponse = new Troubleshooting({
        type: 'TROUBLESHOOTING',
        subComponent: 'SEND-BATCH-HIT-ROUTE-RESPONSE',
        logLevel: LogLevel.INFO,
        message: 'SEND-BATCH-HIT-ROUTE-RESPONSE',
        visitorId: `${this._flagshipInstanceId}`,
        traffic: 0,
        config: this.config,
        httpInstanceId,
        httpResponseBody: response?.body,
        httpResponseHeaders: response?.headers,
        httpResponseMethod: 'POST',
        httpResponseUrl: HIT_EVENT_URL,
        httpResponseCode: response?.status,
        httpResponseTime: Date.now() - now
      })

      this.addTroubleshootingHit(monitoringHttpResponse)

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

      const monitoringHttpResponse = new Troubleshooting({
        type: 'TROUBLESHOOTING',
        subComponent: 'SEND-BATCH-HIT-ROUTE-RESPONSE-ERROR',
        logLevel: LogLevel.ERROR,
        message: 'SEND-BATCH-HIT-ROUTE-RESPONSE-ERROR',
        visitorId: `${this._flagshipInstanceId}`,
        traffic: 0,
        config: this.config,
        httpInstanceId,
        httpRequestBody: requestBody,
        httpRequestHeaders: headers,
        httpResponseBody: error?.message,
        httpResponseHeaders: error?.headers,
        httpResponseMethod: 'POST',
        httpResponseUrl: HIT_EVENT_URL,
        httpResponseCode: error?.statusCode,
        httpResponseTime: Date.now() - now
      })

      this.addTroubleshootingHit(monitoringHttpResponse)
    }
    const mergedQueue = new Map<string, HitAbstract>([...this._hitsPoolQueue, ...this._activatePoolQueue])
    await this.flushAllHits()
    await this.cacheHit(mergedQueue)
  }
}
