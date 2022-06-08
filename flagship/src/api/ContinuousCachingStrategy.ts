import { BATCH_MAX_SIZE, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_ENV_ID, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, HitType, HIT_EVENT_URL, SDK_LANGUAGE, SDK_VERSION } from '../enum/index'
import { Batch } from '../hit/Batch'
import { Consent } from '../hit/Consent'
import { HitAbstract } from '../hit/index'
import { logError } from '../utils/utils'
import { CachingStrategyAbstract } from './CachingStrategyAbstract'

export class ContinuousCachingStrategy extends CachingStrategyAbstract {
  async addHit (hit: HitAbstract): Promise<void> {
    const hitKey = `${hit.visitorId}:${Date.now()}`
    hit.key = hitKey
    await this.addHitWithKey(hitKey, hit)
    console.log('consent hit ', hit)

    if (hit.type === HitType.CONSENT && !(hit as Consent).visitorConsent) {
      await this.notConsent(hit.visitorId)
    }
  }

  async notConsent (visitorId: string):Promise<void> {
    const keys = Array.from(this._hitsPoolQueue.keys()).filter(x => x.includes(visitorId))
    console.log('keys', keys)
    console.log('hitPool', this._hitsPoolQueue)

    if (!keys.length) {
      return
    }
    const keysToFlush:string[] = []
    keys.forEach(key => {
      const isConsentHit = this._hitsPoolQueue.get(key)?.type === HitType.CONSENT
      if (isConsentHit) {
        return
      }
      this._hitsPoolQueue.delete(key)
      keysToFlush.push(key)
    })
    await this.flushHits(keysToFlush)
  }

  protected async addHitWithKey (hitKey:string, hit:HitAbstract):Promise<void> {
    this._hitsPoolQueue.set(hitKey, hit)
    await this.cacheHit(new Map<string, HitAbstract>().set(hitKey, hit))
  }

  async addHits (hits: HitAbstract[]): Promise<void> {
    await Promise.all(hits.map(hit => this.addHit(hit)))
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

    try {
      await this._httpClient.postAsync(HIT_EVENT_URL, {
        headers,
        body: batch.toApiKeys()
      })

      try {
        await this.flushHits(batch.hits.map(item => item.key))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error:any) {
        logError(this.config, error.message || error, 'sendBatch')
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      batch.hits.forEach((hit) => {
        this.addHitWithKey(hit.key, hit)
      })
      logError(this.config, error.message || error, 'sendBatch')
    }
  }
}
