import { BatchTriggeredBy } from '../enum/BatchTriggeredBy'
import { HEADER_CONTENT_TYPE, HEADER_APPLICATION_JSON, HIT_EVENT_URL, HitType, HIT_SENT_SUCCESS, FS_CONSENT, SDK_INFO, BASE_API_URL, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, URL_ACTIVATE_MODIFICATION, LogLevel, ACTIVATE_HIT, DIRECT_HIT, TRACKING_MANAGER, TRACKING_MANAGER_ERROR, DEFAULT_HIT_CACHE_TIME_MS } from '../enum/index'
import { Activate } from '../hit/Activate'
import { ActivateBatch } from '../hit/ActivateBatch'
import { HitAbstract, Event } from '../hit/index'
import { Troubleshooting } from '../hit/Troubleshooting'
import { TroubleshootingLabel } from '../types'
import { logDebugSprintf, logErrorSprintf, uuidV4 } from '../utils/utils'
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
        timeout: this.config.timeout,
        nextFetchConfig: this.config.nextFetchConfig
      })

      logDebugSprintf(this.config, TRACKING_MANAGER, HIT_SENT_SUCCESS, DIRECT_HIT, {
        httpRequestBody: requestBody,
        httpRequestHeaders: headers,
        httpRequestMethod: 'POST',
        httpRequestUrl: HIT_EVENT_URL,
        duration: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy[BatchTriggeredBy.DirectHit]
      })

      this.sendHitsToFsQa([hit])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      if (hit.type !== HitType.EVENT || (hit as Event).action !== FS_CONSENT) {
        this.cacheHitKeys[hit.key] = hit.visitorId
      }
      await this.cacheHit(new Map<string, HitAbstract>().set(hit.key, hit))

      logErrorSprintf(this.config, TRACKING_MANAGER, TRACKING_MANAGER_ERROR, DIRECT_HIT, {
        httpRequestBody: requestBody,
        httpRequestHeaders: headers,
        httpRequestMethod: 'POST',
        httpRequestUrl: HIT_EVENT_URL,
        httpResponseBody: error?.message,
        httpResponseHeaders: error?.headers,
        httpResponseCode: error?.statusCode,
        duration: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy[BatchTriggeredBy.DirectHit]
      })

      const monitoringHttpResponse = new Troubleshooting({
        label: TroubleshootingLabel.SEND_HIT_ROUTE_ERROR,
        logLevel: LogLevel.ERROR,
        visitorId: `${this._flagshipInstanceId}`,
        traffic: 0,
        config: this.config,
        httpRequestBody: requestBody,
        httpRequestHeaders: headers,
        httpRequestMethod: 'POST',
        httpRequestUrl: HIT_EVENT_URL,
        httpResponseBody: error?.message,
        httpResponseHeaders: error?.headers,
        httpResponseCode: error?.statusCode,
        httpResponseTime: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy.DirectHit
      })

      await this.sendTroubleshootingHit(monitoringHttpResponse)
    }
  }

  async notConsent (visitorId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cacheHitKeysEntries = Object.entries(this.cacheHitKeys).filter(([_, value]) => value === visitorId)
    const keys:string[] = []
    for (const [key] of cacheHitKeysEntries) {
      keys.push(key)
    }
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

      const hitKeysToRemove: string[] = activateHitsPool.map(item => item.key)

      activateBatch.hits.forEach(item => {
        this.onVisitorExposed(item)
        this.onUserExposure(item)
      })

      if (hitKeysToRemove.length) {
        await this.flushHits(hitKeysToRemove)
      }

      this.sendHitsToFsQa(activateBatch.hits)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      activateBatch.hits.forEach((item) => {
        this.cacheHitKeys[item.key] = item.visitorId
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
        httpResponseMethod: 'POST',
        httpResponseUrl: url,
        httpResponseCode: error?.statusCode,
        httpResponseTime: Date.now() - now,
        batchTriggeredBy
      })

      await this.sendTroubleshootingHit(monitoringHttpResponse)
    }
  }
}
