import { IFlagshipConfig } from '../config/index'
import { HEADER_X_API_KEY, HEADER_X_ENV_ID, HEADER_X_SDK_CLIENT, SDK_LANGUAGE, HEADER_X_SDK_VERSION, SDK_VERSION, HEADER_CONTENT_TYPE, HEADER_APPLICATION_JSON, HIT_EVENT_URL, HitType, BATCH_MAX_SIZE, BATCH_SENT_SUCCESS, SEND_BATCH, HIT_SENT_SUCCESS, ADD_HIT } from '../enum/index'
import { Batch } from '../hit/Batch'
import { HitAbstract, Consent } from '../hit/index'
import { IHttpClient } from '../utils/HttpClient'
import { errorFormat, logDebug, logError, sprintf, uuidV4 } from '../utils/utils'
import { BatchingCachingStrategyAbstract } from './BatchingCachingStrategyAbstract'

export class NoBatchingContinuousCachingStrategy extends BatchingCachingStrategyAbstract {
    protected cacheHitKeys:Record<string, string>

    constructor (config: IFlagshipConfig, httpClient: IHttpClient, hitsPoolQueue: Map<string, HitAbstract>) {
      super(config, httpClient, hitsPoolQueue)
      this.cacheHitKeys = {}
    }

    async addHit (hit: HitAbstract): Promise<void> {
      const hitKey = `${hit.visitorId}:${uuidV4()}`
      hit.key = hitKey

      if (hit.type === HitType.CONSENT && !(hit as Consent).visitorConsent) {
        await this.notConsent(hit.visitorId)
      }

      await this.cacheHit(new Map<string, HitAbstract>().set(hitKey, hit))

      const headers = {
        [HEADER_X_API_KEY]: `${this.config.apiKey}`,
        [HEADER_X_ENV_ID]: `${this.config.envId}`,
        [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE.name,
        [HEADER_X_SDK_VERSION]: SDK_VERSION,
        [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
      }

      const requestBody = hit.toApiKeys()

      try {
        await this._httpClient.postAsync(HIT_EVENT_URL, {
          headers,
          body: requestBody
        })

        logDebug(this.config, sprintf(HIT_SENT_SUCCESS, JSON.stringify(requestBody)), ADD_HIT)

        await this.flushHits([hitKey])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error:any) {
        if (hit.type !== HitType.CONSENT) {
          this.cacheHitKeys[hitKey] = hitKey
        }
        logError(this.config, errorFormat(error.message || error, {
          url: HIT_EVENT_URL,
          headers,
          body: requestBody
        }), ADD_HIT)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async notConsent (_visitorId: string): Promise<void> {
      const keys = Object.keys(this.cacheHitKeys)

      if (!keys.length) {
        return
      }

      await this.flushHits(keys)
      this.cacheHitKeys = {}
    }

    async sendBatch (): Promise<void> {
      const headers = {
        [HEADER_X_API_KEY]: `${this.config.apiKey}`,
        [HEADER_X_ENV_ID]: `${this.config.envId}`,
        [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE.name,
        [HEADER_X_SDK_VERSION]: SDK_VERSION,
        [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
      }

      const batch:Batch = new Batch({ hits: [] })
      batch.config = this.config

      let batchSize = 0
      let count = 0

      this._hitsPoolQueue.forEach((item) => {
        count++
        batchSize = JSON.stringify(batch).length
        if (batchSize > BATCH_MAX_SIZE || (this.config.trackingMangerConfig?.batchLength && count > this.config.trackingMangerConfig.batchLength)) {
          return
        }
        batch.hits.push(item)
      })

      batch.hits.forEach(hit => {
        this._hitsPoolQueue.delete(hit.key)
      })

      if (!batch.hits.length) {
        return
      }

      const requestBody = batch.toApiKeys()
      try {
        await this._httpClient.postAsync(HIT_EVENT_URL, {
          headers,
          body: requestBody
        })

        logDebug(this.config, sprintf(BATCH_SENT_SUCCESS, JSON.stringify(requestBody)), SEND_BATCH)

        await this.flushHits(batch.hits.map(item => item.key))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error:any) {
        batch.hits.forEach((hit) => {
          this._hitsPoolQueue.set(hit.key, hit)
        })
        logError(this.config, errorFormat(error.message || error, {
          url: HIT_EVENT_URL,
          headers,
          body: requestBody
        }), SEND_BATCH)
      }
    }
}
