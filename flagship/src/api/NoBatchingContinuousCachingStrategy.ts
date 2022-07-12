import { IFlagshipConfig } from '../config/index'
import { HEADER_X_API_KEY, HEADER_X_ENV_ID, HEADER_X_SDK_CLIENT, SDK_LANGUAGE, HEADER_X_SDK_VERSION, SDK_VERSION, HEADER_CONTENT_TYPE, HEADER_APPLICATION_JSON, HIT_EVENT_URL, HitType, BATCH_MAX_SIZE, BATCH_SENT_SUCCESS, SEND_BATCH, HIT_SENT_SUCCESS, ADD_HIT, ACTIVATE_SENT_SUCCESS, BASE_API_URL, SEND_ACTIVATE, URL_ACTIVATE_MODIFICATION } from '../enum/index'
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

      if (hit.type === 'ACTIVATE') {
        await this.sendActivateHit(hit)
        return
      }

      await this.sendHit(hit)
    }

    async sendHit (hit:HitAbstract):Promise<void> {
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

        await this.flushHits([hit.key])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error:any) {
        if (hit.type !== HitType.CONSENT) {
          this.cacheHitKeys[hit.key] = hit.key
        }
        logError(this.config, errorFormat(error.message || error, {
          url: HIT_EVENT_URL,
          headers,
          body: requestBody
        }), ADD_HIT)
      }
    }

    async sendActivateHit (activateHit:HitAbstract):Promise<void> {
      const url = `${BASE_API_URL}${URL_ACTIVATE_MODIFICATION}`

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const activateHeader = {
        [HEADER_X_API_KEY]: this.config.apiKey as string,
        [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE.name,
        [HEADER_X_SDK_VERSION]: SDK_VERSION,
        [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
      }

      const activateBody = activateHit.toApiKeys()

      try {
        await this._httpClient.postAsync(url, {
          headers: activateHeader,
          body: activateBody
        })

        logDebug(this.config, sprintf(ACTIVATE_SENT_SUCCESS, JSON.stringify(activateBody)), SEND_ACTIVATE)
        await this.flushHits([activateHit.key])

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error:any) {
        this.cacheHitKeys[activateHit.key] = activateHit.key
        logError(this.config, errorFormat(error.message || error, {
          url,
          activateHeader,
          body: activateBody
        }), SEND_ACTIVATE)
      }
    }

    async notConsent (visitorId: string): Promise<void> {
      const keys = Object.keys(this.cacheHitKeys)
      const hitsPoolQueueKeys = Array.from(this._hitsPoolQueue.keys()).filter(x => x.includes(visitorId))

      const keysToFlush:string[] = []
      hitsPoolQueueKeys.forEach(key => {
        const isConsentHit = this._hitsPoolQueue.get(key)?.type === HitType.CONSENT
        if (isConsentHit) {
          return
        }
        this._hitsPoolQueue.delete(key)
        keysToFlush.push(key)
      })

      const mergedKeys = [...keys, ...keysToFlush]

      if (!mergedKeys.length) {
        return
      }

      await this.flushHits(mergedKeys)
      this.cacheHitKeys = {}
    }

    async sendActivate (activateHits:HitAbstract[]):Promise<void> {
      const activateHitKeys:string[] = []

      const url = `${BASE_API_URL}${URL_ACTIVATE_MODIFICATION}`
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const activateHeader = {
        [HEADER_X_API_KEY]: this.config.apiKey as string,
        [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE.name,
        [HEADER_X_SDK_VERSION]: SDK_VERSION,
        [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
      }

      for (const activateHit of activateHits) {
        this._hitsPoolQueue.delete(activateHit.key)
        const activateBody = activateHit.toApiKeys()

        try {
          await this._httpClient.postAsync(url, {
            headers: activateHeader,
            body: activateBody
          })
          activateHitKeys.push(activateHit.key)
          logDebug(this.config, sprintf(ACTIVATE_SENT_SUCCESS, JSON.stringify(activateBody)), SEND_ACTIVATE)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error:any) {
          this._hitsPoolQueue.set(activateHit.key, activateHit)
          logError(this.config, errorFormat(error.message || error, {
            url: HIT_EVENT_URL,
            activateHeader,
            body: activateBody
          }), SEND_ACTIVATE)
        }
      }

      if (activateHitKeys.length) {
        await this.flushHits(activateHitKeys)
      }
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
      const activateHits:HitAbstract[] = []

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const [_, item] of this._hitsPoolQueue) {
        if (item.type === 'ACTIVATE') {
          activateHits.push(item)
          continue
        }
        count++
        batchSize = JSON.stringify(batch).length
        if (batchSize > BATCH_MAX_SIZE || (this.config.trackingMangerConfig?.batchLength && count > this.config.trackingMangerConfig.batchLength)) {
          return
        }
        batch.hits.push(item)
      }

      batch.hits.forEach(hit => {
        this._hitsPoolQueue.delete(hit.key)
      })

      await this.sendActivate(activateHits)

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
