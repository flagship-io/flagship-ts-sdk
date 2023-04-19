import { BatchTriggeredBy } from '../enum/BatchTriggeredBy'
import { BASE_API_URL, FS_CONSENT, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, HitType, HIT_SENT_SUCCESS, LogLevel, SDK_INFO, SEND_ACTIVATE, URL_ACTIVATE_MODIFICATION, MONITORING_HIT_ADDED_IN_QUEUE, ADD_MONITORING_HIT } from '../enum/index'
import { Activate } from '../hit/Activate'
import { ActivateBatch } from '../hit/ActivateBatch'
import { HitAbstract, Event } from '../hit/index'
import { Monitoring } from '../hit/Monitoring'
import { errorFormat, logDebug, logError, sprintf, uuidV4 } from '../utils/utils'
import { BatchingCachingStrategyAbstract } from './BatchingCachingStrategyAbstract'
import { SendActivate } from './types'

export class BatchingContinuousCachingStrategy extends BatchingCachingStrategyAbstract {
  async addHitInPoolQueue (hit: HitAbstract) {
    this._hitsPoolQueue.set(hit.key, hit)
    await this.cacheHit(new Map<string, HitAbstract>([[hit.key, hit]]))
  }

  public async addMonitoringHit (hit: Monitoring): Promise<void> {
    if (!hit.key) {
      const hitKey = `${hit.visitorId}:${uuidV4()}`
      hit.key = hitKey
    }
    this._monitoringPoolQueue.set(hit.key, hit)
    logDebug(this.config, sprintf(MONITORING_HIT_ADDED_IN_QUEUE, JSON.stringify(hit.toApiKeys())), ADD_MONITORING_HIT)
    await this.cacheHit(new Map<string, Monitoring>().set(hit.key, hit))
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
      const response = await this._httpClient.postAsync(url, {
        headers,
        body: requestBody,
        timeout: this.config.timeout
      })

      logDebug(this.config, sprintf(HIT_SENT_SUCCESS, JSON.stringify({
        ...requestBody,
        duration: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy[batchTriggeredBy]
      })), SEND_ACTIVATE)

      const hitKeysToRemove: string[] = activateHitsPool.map(item => item.key)

      activateBatch.hits.forEach(item => {
        this.onVisitorExposed(item)
        this.onUserExposure(item)
      })

      if (hitKeysToRemove.length) {
        await this.flushHits(hitKeysToRemove)
      }
      const monitoringHttpResponse = new Monitoring({
        type: 'TROUBLESHOOTING',
        subComponent: 'SEND-ACTIVATE-HIT-ROUTE-RESPONSE',
        logLevel: LogLevel.INFO,
        message: 'SEND-ACTIVATE-HIT-ROUTE-RESPONSE',
        visitorId: `${this._flagshipInstanceId}`,
        flagshipInstanceId: this._flagshipInstanceId,
        traffic: 0,
        config: this.config,
        httpRequestBody: requestBody,
        httpRequestHeaders: headers,
        httpRequestMethod: 'POST',
        httpRequestUrl: url,
        httpResponseBody: response?.body,
        httpResponseHeaders: response?.headers,
        httpResponseCode: response?.status,
        httpResponseTime: Date.now() - now,
        batchTriggeredBy
      })

      await this.sendMonitoringHit(monitoringHttpResponse)
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

      const monitoringHttpResponse = new Monitoring({
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

      await this.sendMonitoringHit(monitoringHttpResponse)
    }
  }
}
