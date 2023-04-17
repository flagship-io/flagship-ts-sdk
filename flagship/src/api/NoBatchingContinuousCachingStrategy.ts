import { BatchTriggeredBy } from '../enum/BatchTriggeredBy'
import { HEADER_CONTENT_TYPE, HEADER_APPLICATION_JSON, HIT_EVENT_URL, HitType, HIT_SENT_SUCCESS, SEND_HIT, FS_CONSENT, SDK_INFO, SEND_ACTIVATE, BASE_API_URL, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, URL_ACTIVATE_MODIFICATION, LogLevel, ADD_MONITORING_HIT, MONITORING_HIT_ADDED_IN_QUEUE } from '../enum/index'
import { Activate } from '../hit/Activate'
import { ActivateBatch } from '../hit/ActivateBatch'
import { HitAbstract, Event } from '../hit/index'
import { Monitoring } from '../hit/Monitoring'
import { errorFormat, logDebug, logError, sprintf, uuidV4 } from '../utils/utils'
import { BatchingCachingStrategyAbstract } from './BatchingCachingStrategyAbstract'
import { BatchingCachingStrategyConstruct, SendActivate } from './types'

export class NoBatchingContinuousCachingStrategy extends BatchingCachingStrategyAbstract {
  protected cacheHitKeys:Record<string, string>

  constructor (param: BatchingCachingStrategyConstruct) {
    super(param)
    this.cacheHitKeys = {}
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addHitInPoolQueue (_hit: HitAbstract): Promise<void> {
    return Promise.resolve()
  }

  public async addMonitoringHit (hit: Monitoring): Promise<void> {
    await this.cacheHit(new Map<string, Monitoring>().set(hit.key, hit))
    logDebug(this.config, sprintf(MONITORING_HIT_ADDED_IN_QUEUE, JSON.stringify(hit.toApiKeys())), ADD_MONITORING_HIT)
  }

  async sendHit (hit:HitAbstract):Promise<void> {
    const headers = {
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    const requestBody = hit.toApiKeys()

    const now = Date.now()
    const httpInstanceId = uuidV4()
    try {
      const monitoringHttpRequest = new Monitoring({
        type: 'TROUBLESHOOTING',
        subComponent: 'SEND-HIT-ROUTE-REQUEST',
        logLevel: LogLevel.INFO,
        message: 'SEND-HIT-ROUTE-REQUEST',
        visitorId: `${this._flagshipInstanceId}`,
        traffic: 0,
        config: this.config,
        httpInstanceId,
        httpRequestBody: requestBody,
        httpRequestHeaders: headers,
        httpRequestMethod: 'POST',
        httpRequestUrl: HIT_EVENT_URL
      })

      this.sendMonitoringHit(monitoringHttpRequest)

      const response = await this._httpClient.postAsync(HIT_EVENT_URL, {
        headers,
        body: requestBody,
        timeout: this.config.timeout
      })

      logDebug(this.config, sprintf(HIT_SENT_SUCCESS, JSON.stringify({
        ...requestBody,
        duration: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy[BatchTriggeredBy.DirectHit]
      })), SEND_HIT)

      const monitoringHttpResponse = new Monitoring({
        type: 'TROUBLESHOOTING',
        subComponent: 'SEND-HIT-ROUTE-RESPONSE',
        logLevel: LogLevel.INFO,
        message: 'SEND-HIT-ROUTE-RESPONSE',
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

      await this.sendMonitoringHit(monitoringHttpResponse)

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

      const monitoringHttpResponse = new Monitoring({
        type: 'TROUBLESHOOTING',
        subComponent: 'SEND-HIT-ROUTE-ERROR',
        logLevel: LogLevel.ERROR,
        message: 'SEND-HIT-ROUTE-ERROR',
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

      this.sendMonitoringHit(monitoringHttpResponse)
    }
  }

  async notConsent (visitorId: string): Promise<void> {
    const keys = Object.keys(this.cacheHitKeys)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const hitsKeys = Array.from(this._hitsPoolQueue).filter(([_, item]) => {
      return (item?.type !== HitType.EVENT || (item as Event)?.action !== FS_CONSENT) && (item.visitorId === visitorId || item.anonymousId === visitorId)
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const activateKeys = Array.from(this._activatePoolQueue).filter(([_, item]) => {
      return item.visitorId === visitorId || item.anonymousId === visitorId
    })

    const keysToFlush:string[] = []
    hitsKeys.forEach(([key]) => {
      this._hitsPoolQueue.delete(key)
      keysToFlush.push(key)
    })

    activateKeys.forEach(([key]) => {
      this._activatePoolQueue.delete(key)
      keysToFlush.push(key)
    })

    const mergedKeys = [...keys, ...keysToFlush]

    if (!mergedKeys.length) {
      return
    }

    await this.flushHits(mergedKeys)
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
    const httpInstanceId = uuidV4()
    try {
      const monitoringHttpRequest = new Monitoring({
        type: 'TROUBLESHOOTING',
        subComponent: 'SEND-ACTIVATE-HIT-ROUTE-REQUEST',
        logLevel: LogLevel.INFO,
        message: 'SEND-ACTIVATE-HIT-ROUTE-REQUEST',
        visitorId: `${this._flagshipInstanceId}`,
        traffic: 0,
        config: this.config,
        httpInstanceId,
        httpRequestBody: requestBody,
        httpRequestHeaders: headers,
        httpRequestMethod: 'POST',
        httpRequestUrl: url
      })

      this.sendMonitoringHit(monitoringHttpRequest)

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
        traffic: 0,
        config: this.config,
        httpInstanceId,
        httpResponseBody: response?.body,
        httpResponseHeaders: response?.headers,
        httpResponseMethod: 'POST',
        httpResponseUrl: url,
        httpResponseCode: response?.status,
        httpResponseTime: Date.now() - now
      })

      this.sendMonitoringHit(monitoringHttpResponse)

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
        httpResponseBody: error?.message,
        httpResponseHeaders: error?.headers,
        httpResponseMethod: 'POST',
        httpResponseUrl: url,
        httpResponseCode: error?.statusCode,
        httpResponseTime: Date.now() - now
      })

      this.sendMonitoringHit(monitoringHttpResponse)
    }
  }
}
