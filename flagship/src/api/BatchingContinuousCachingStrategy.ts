import { IExposedFlag, IExposedVisitor } from './../types'
import { BatchTriggeredBy } from '../enum/BatchTriggeredBy'
import { BASE_API_URL, FS_CONSENT, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, HitType, HIT_SENT_SUCCESS, SDK_INFO, SEND_ACTIVATE, URL_ACTIVATE_MODIFICATION } from '../enum/index'
import { Activate } from '../hit/Activate'
import { ActivateBatch } from '../hit/ActivateBatch'
import { HitAbstract, Event } from '../hit/index'
import { errorFormat, logDebug, logError, sprintf } from '../utils/utils'
import { BatchingCachingStrategyAbstract, SendActivate } from './BatchingCachingStrategyAbstract'

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

  protected onUserExposure (activate: Activate) {
    const onUserExposure = this.config.onUserExposure
    if (typeof onUserExposure !== 'function') {
      return
    }

    const flagData = {
      metadata: {
        campaignId: activate.flagMetadata.campaignId,
        campaignType: activate.flagMetadata.campaignType,
        slug: activate.flagMetadata.slug,
        isReference: activate.flagMetadata.isReference,
        variationGroupId: activate.flagMetadata.variationGroupId,
        variationId: activate.flagMetadata.variationId
      },
      key: activate.flagKey,
      value: activate.flagValue
    }

    const visitorData = {
      visitorId: activate.visitorId,
      anonymousId: activate.anonymousId as string,
      context: activate.visitorContext
    }
    onUserExposure({ flagData, visitorData })
  }

  protected onVisitorExposed (activate: Activate) {
    const onVisitorExposed = this.config.onVisitorExposed
    if (typeof onVisitorExposed !== 'function') {
      return
    }

    const fromFlag : IExposedFlag = {
      key: activate.flagKey,
      value: activate.flagValue,
      defaultValue: activate.flagDefaultValue,
      metadata: activate.flagMetadata
    }

    const exposedVisitor: IExposedVisitor = {
      id: activate.visitorId,
      anonymousId: activate.anonymousId,
      context: activate.visitorContext
    }
    onVisitorExposed({ exposedVisitor, fromFlag })
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

      const hitKeysToRemove: string[] = []

      activateHitsPool.forEach(item => {
        hitKeysToRemove.push(item.key)
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

      logError(this.config, errorFormat(error.message || error, {
        url,
        headers,
        body: requestBody,
        duration: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy[batchTriggeredBy]
      }), SEND_ACTIVATE)
    }
  }
}
