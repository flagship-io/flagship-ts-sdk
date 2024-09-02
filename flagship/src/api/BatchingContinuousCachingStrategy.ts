import { ACTIVATE_HIT, DEFAULT_HIT_CACHE_TIME_MS, HIT_SENT_SUCCESS, MAX_ACTIVATE_HIT_PER_BATCH, TRACKING_MANAGER, TRACKING_MANAGER_ERROR } from '../enum/FlagshipConstant'
import { BatchTriggeredBy } from '../enum/BatchTriggeredBy'
import { BASE_API_URL, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, LogLevel, SDK_INFO, URL_ACTIVATE_MODIFICATION } from '../enum/index'
import { Activate } from '../hit/Activate'
import { ActivateBatch } from '../hit/ActivateBatch'
import { HitAbstract } from '../hit/index'
import { Troubleshooting } from '../hit/Troubleshooting'
import { logDebugSprintf, logErrorSprintf } from '../utils/utils'
import { BatchingCachingStrategyAbstract } from './BatchingCachingStrategyAbstract'
import { SendActivate } from './types'
import { TroubleshootingLabel } from '../types'

export class BatchingContinuousCachingStrategy extends BatchingCachingStrategyAbstract {
  async addHitInPoolQueue (hit: HitAbstract) {
    this._hitsPoolQueue.set(hit.key, hit)
    await this.cacheHit(new Map<string, HitAbstract>([[hit.key, hit]]))
  }

  protected async sendActivateHitBatch (activateBatch: ActivateBatch, batchTriggeredBy: BatchTriggeredBy, currentActivate?:Activate) {
    const headers = {
      [HEADER_X_API_KEY]: this.config.apiKey as string,
      [HEADER_X_SDK_CLIENT]: SDK_INFO.name,
      [HEADER_X_SDK_VERSION]: SDK_INFO.version,
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
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

      const hitKeysToRemove: string[] = activateBatch.hits.filter(item => item.key !== currentActivate?.key).map(item => item.key)

      activateBatch.hits.forEach(item => {
        this.onVisitorExposed(item)
      })

      if (hitKeysToRemove.length) {
        await this.flushHits(hitKeysToRemove)
      }

      this.sendHitsToFsQa(activateBatch.hits)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      activateBatch.hits.forEach(item => {
        this._activatePoolQueue.set(item.key, item)
      })

      if (currentActivate) {
        await this.cacheHit(new Map<string, Activate>([[currentActivate.key, currentActivate]]))
      }

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

  protected async sendActivate ({ activateHitsPool, currentActivate, batchTriggeredBy }:SendActivate) {
    const filteredItems = Array.from(activateHitsPool.filter(item => (Date.now() - item.createdAt) < DEFAULT_HIT_CACHE_TIME_MS))

    if (!filteredItems.length && currentActivate) {
      const batch = new ActivateBatch([currentActivate], this.config)
      await this.sendActivateHitBatch(batch, batchTriggeredBy, currentActivate)
      return
    }

    for (let i = 0; i < filteredItems.length; i += MAX_ACTIVATE_HIT_PER_BATCH) {
      const batch = new ActivateBatch(filteredItems.slice(i, i + MAX_ACTIVATE_HIT_PER_BATCH), this.config)
      if (i === 0 && currentActivate) {
        batch.hits.push(currentActivate)
      }
      this.sendActivateHitBatch(batch, batchTriggeredBy, i === 0 ? currentActivate : undefined)
    }
  }
}
