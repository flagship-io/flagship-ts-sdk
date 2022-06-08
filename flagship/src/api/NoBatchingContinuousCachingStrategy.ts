import { IFlagshipConfig } from '../config'
import { HEADER_X_API_KEY, HEADER_X_ENV_ID, HEADER_X_SDK_CLIENT, SDK_LANGUAGE, HEADER_X_SDK_VERSION, SDK_VERSION, HEADER_CONTENT_TYPE, HEADER_APPLICATION_JSON, HIT_EVENT_URL } from '../enum/index'
import { HitAbstract } from '../hit/index'
import { IHttpClient } from '../utils/HttpClient'
import { logError } from '../utils/utils'
import { BatchingCachingStrategyAbstract } from './BatchingCachingStrategyAbstract'

export class NoBatchingContinuousCachingStrategy extends BatchingCachingStrategyAbstract {
    protected cacheHitKeys:Record<string, string>

    constructor (config: IFlagshipConfig, httpClient: IHttpClient, hitsPoolQueue: Map<string, HitAbstract>) {
      super(config, httpClient, hitsPoolQueue)
      this.cacheHitKeys = {}
    }

    async addHit (hit: HitAbstract): Promise<void> {
      const hitKey = `${hit.visitorId}:${Date.now()}`
      hit.key = hitKey

      const headers = {
        [HEADER_X_API_KEY]: `${this.config.apiKey}`,
        [HEADER_X_ENV_ID]: `${this.config.envId}`,
        [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE.name,
        [HEADER_X_SDK_VERSION]: SDK_VERSION,
        [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
      }

      try {
        await this._httpClient.postAsync(HIT_EVENT_URL, {
          headers,
          body: hit.toApiKeys()
        })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error:any) {
        this.cacheHitKeys[hitKey] = hitKey
        await this.cacheHit(new Map<string, HitAbstract>().set(hitKey, hit))
        logError(this.config, error.message || error, 'addHit')
      }
    }

    sendBatch (): Promise<void> {
      throw new Error('Method not implemented.')
    }

    notConsent (visitorId: string): Promise<void> {
      throw new Error('Method not implemented.')
    }
}
