import { ACTIVATE_HIT, DEFAULT_HIT_CACHE_TIME_MS, HIT_SENT_SUCCESS, TRACKING_MANAGER, TRACKING_MANAGER_ERROR } from './../enum/FlagshipConstant'
import { BatchTriggeredBy } from '../enum/BatchTriggeredBy'
import { BASE_API_URL, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, SDK_INFO, URL_ACTIVATE_MODIFICATION } from '../enum/index'
import { Activate } from '../hit/Activate'
import { ActivateBatch } from '../hit/ActivateBatch'
import { HitAbstract } from '../hit/index'
import { logDebugSprintf, logErrorSprintf } from '../utils/utils'
import { BatchingCachingStrategyAbstract, SendActivate } from './BatchingCachingStrategyAbstract'

export class BatchingContinuousCachingStrategy extends BatchingCachingStrategyAbstract {
  async addHitInPoolQueue (hit: HitAbstract) {
    this._hitsPoolQueue.set(hit.key, hit)
    await this.cacheHit(new Map<string, HitAbstract>([[hit.key, hit]]))
  }

  protected async sendActivate ({ activateHitsPool, currentActivate, batchTriggeredBy }:SendActivate) {
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
        timeout: this.config.timeout
      })

      logDebugSprintf(this.config, TRACKING_MANAGER, HIT_SENT_SUCCESS, ACTIVATE_HIT, {
        url,
        headers,
        body: requestBody,
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
        message: error.message || error,
        url,
        headers,
        body: requestBody,
        duration: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy[batchTriggeredBy]
      })
    }
  }
}
