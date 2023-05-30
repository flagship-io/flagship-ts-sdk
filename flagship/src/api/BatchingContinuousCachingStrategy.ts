import { ACTIVATE_HIT, HIT_SENT_SUCCESS, TRACKING_MANAGER, TRACKING_MANAGER_ERROR } from './../enum/FlagshipConstant'
import { BatchTriggeredBy } from '../enum/BatchTriggeredBy'
import { BASE_API_URL, FS_CONSENT, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, HitType, LogLevel, SDK_INFO, URL_ACTIVATE_MODIFICATION } from '../enum/index'
import { Activate } from '../hit/Activate'
import { ActivateBatch } from '../hit/ActivateBatch'
import { HitAbstract, Event } from '../hit/index'
import { Troubleshooting } from '../hit/Troubleshooting'
import { logDebugSprintf, logErrorSprintf, uuidV4 } from '../utils/utils'
import { BatchingCachingStrategyAbstract } from './BatchingCachingStrategyAbstract'
import { SendActivate } from './types'

export class BatchingContinuousCachingStrategy extends BatchingCachingStrategyAbstract {
  async addHitInPoolQueue (hit: HitAbstract) {
    this._hitsPoolQueue.set(hit.key, hit)
    await this.cacheHit(new Map<string, HitAbstract>([[hit.key, hit]]))
  }

  async notConsent (visitorId: string):Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const hitKeys = Array.from(this._hitsPoolQueue).filter(([_, item]) => {
      return (item?.type !== HitType.EVENT || (item as Event)?.action !== FS_CONSENT) && (item.visitorId === visitorId || item.anonymousId === visitorId)
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const activateKeys = Array.from(this._activatePoolQueue).filter(([_, item]) => {
      return item.visitorId === visitorId || item.anonymousId === visitorId
    })

    const keysToFlush:string[] = []
    hitKeys.forEach(([key]) => {
      this._hitsPoolQueue.delete(key)
      keysToFlush.push(key)
    })

    activateKeys.forEach(([key]) => {
      this._activatePoolQueue.delete(key)
      keysToFlush.push(key)
    })

    if (!keysToFlush.length) {
      return
    }
    await this.flushHits(keysToFlush)
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
    const httpInstanceId = uuidV4()

    try {
      await this._httpClient.postAsync(url, {
        headers,
        body: requestBody,
        timeout: this.config.timeout
      })

      logDebugSprintf(this.config, TRACKING_MANAGER, HIT_SENT_SUCCESS, ACTIVATE_HIT, {
        httpRequestBody: requestBody,
        httpRequestHeaders: headers,
        httpRequestMethod: 'POST',
        httpRequestUrl: url,
        duration: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy[batchTriggeredBy]
      })

      const hitKeysToRemove: string[] = activateHitsPool.map(item => item.key)

      activateBatch.hits.forEach(item => {
        this.onVisitorExposed(item)
        this.onUserExposure(item)
      })

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
}
