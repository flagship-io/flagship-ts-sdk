import { BatchTriggeredBy } from '../enum/BatchTriggeredBy'
import { BASE_API_URL, BATCH_MAX_SIZE, DEFAULT_HIT_CACHE_TIME_MS, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, HIT_EVENT_URL, HIT_SENT_SUCCESS, LogLevel, SDK_INFO, URL_ACTIVATE_MODIFICATION, BATCH_HIT, TRACKING_MANAGER, TRACKING_MANAGER_ERROR, ACTIVATE_HIT } from '../enum/index'
import { ActivateBatch } from '../hit/ActivateBatch'
import { Batch } from '../hit/Batch'
import { HitAbstract } from '../hit/index'
import { Troubleshooting } from '../hit/Troubleshooting'
import { TroubleshootingLabel } from '../types'
import { logDebugSprintf, logErrorSprintf } from '../utils/utils'
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

    const activateBatch = new ActivateBatch(Array.from(activateHitsPool.filter(item => (Date.now() - item.createdAt) < DEFAULT_HIT_CACHE_TIME_MS)), this.config)

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
        timeout: this.config.timeout,
        nextFetchConfig: this.config.nextFetchConfig
      })

      logDebugSprintf(this.config, TRACKING_MANAGER, HIT_SENT_SUCCESS, ACTIVATE_HIT, {
        httpRequestBody: requestBody,
        httpRequestHeaders: headers,
        httpRequestMethod: 'POST',
        httpRequestUrl: url,
        duration: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy[batchTriggeredBy]
      })

      activateBatch.hits.forEach(item => {
        this.onVisitorExposed(item)
      })

      this.sendHitsToFsQa(activateBatch.hits)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      activateBatch.hits.forEach(item => {
        this._activatePoolQueue.set(item.key, item)
      })

      logErrorSprintf(this.config, TRACKING_MANAGER, TRACKING_MANAGER_ERROR, ACTIVATE_HIT, {
        httpRequestBody: requestBody,
        httpRequestHeaders: headers,
        httpRequestMethod: 'POST',
        httpRequestUrl: url,
        httpResponseBody: error?.message,
        httpResponseHeaders: error?.headers,
        httpResponseCode: error?.statusCode,
        duration: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy[batchTriggeredBy]
      })

      const monitoringHttpResponse = new Troubleshooting({
        label: TroubleshootingLabel.SEND_ACTIVATE_HIT_ROUTE_ERROR,
        logLevel: LogLevel.ERROR,
        visitorId: `${this._flagshipInstanceId}`,
        traffic: 0,
        config: this.config,
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
        timeout: this.config.timeout,
        nextFetchConfig: this.config.nextFetchConfig
      })

      logDebugSprintf(this.config, TRACKING_MANAGER, HIT_SENT_SUCCESS, BATCH_HIT, {
        httpRequestBody: requestBody,
        httpRequestHeaders: headers,
        httpRequestMethod: 'POST',
        httpRequestUrl: HIT_EVENT_URL,
        duration: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy[batchTriggeredBy]
      })

      this.sendHitsToFsQa(batch.hits)

      this.dispatchHitsToTag(batch.hits)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      batch.hits.forEach((hit) => {
        this._hitsPoolQueue.set(hit.key, hit)
      })
      logErrorSprintf(this.config, TRACKING_MANAGER, TRACKING_MANAGER_ERROR, BATCH_HIT, {
        httpRequestBody: requestBody,
        httpRequestHeaders: headers,
        httpRequestMethod: 'POST',
        httpRequestUrl: HIT_EVENT_URL,
        httpResponseBody: error?.message,
        httpResponseHeaders: error?.headers,
        httpResponseCode: error?.statusCode,
        duration: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy[batchTriggeredBy]
      })

      const monitoringHttpResponse = new Troubleshooting({
        label: TroubleshootingLabel.SEND_BATCH_HIT_ROUTE_RESPONSE_ERROR,
        logLevel: LogLevel.ERROR,
        visitorId: `${this._flagshipInstanceId}`,
        traffic: 0,
        config: this.config,
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
