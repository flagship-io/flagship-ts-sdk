import { BASE_API_URL, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_ENV_ID, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, SDK_LANGUAGE, SDK_VERSION, URL_ACTIVATE_MODIFICATION } from '../enum'
import { Batch } from '../hit/Batch'
import { HitAbstract, IHitAbstract } from '../hit/index'
import { CachingStrategyAbstract } from './CachingStrategyAbstract'

export class ContinuousCachingStrategy extends CachingStrategyAbstract {
  async addHit (hit: HitAbstract): Promise<void> {
    const hitKey = `${hit.visitorId}:${Date.now()}`
    this._hitsPoolQueue.set(hitKey, hit)
    await this.cacheHit(new Map<string, HitAbstract>().set(hitKey, hit))
  }

  async addHits (hits: HitAbstract[]): Promise<void> {
    await Promise.all(hits.map(hit => this.addHit(hit)))
  }

  sendBatch (): Promise<string[]> {
    const headers = {
      [HEADER_X_API_KEY]: `${this.config.apiKey}`,
      [HEADER_X_ENV_ID]: `${this.config.envId}`,
      //   [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE.name,
      [HEADER_X_SDK_VERSION]: SDK_VERSION,
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    const hits = Array.from(this._hitsPoolQueue.values())

    const batch:Batch = new Batch({ hits })
    batch.config = this.config
  }
}
