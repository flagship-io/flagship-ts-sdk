import { ACTIVATE_SENT_SUCCESS, ADD_HIT, BASE_API_URL, BATCH_MAX_SIZE, BATCH_SENT_SUCCESS, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_ENV_ID, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, HitType, HIT_ADDED_IN_QUEUE, HIT_EVENT_URL, SDK_LANGUAGE, SDK_VERSION, SEND_ACTIVATE, SEND_BATCH, URL_ACTIVATE_MODIFICATION } from '../enum/index'
import { Batch } from '../hit/Batch'
import { HitAbstract, Consent } from '../hit/index'
import { errorFormat, logDebug, logError, sprintf, uuidV4 } from '../utils/utils'
import { BatchingCachingStrategyAbstract } from './BatchingCachingStrategyAbstract'

export class BatchingPeriodicCachingStrategy extends BatchingCachingStrategyAbstract {
  async addHit (hit: HitAbstract): Promise<void> {
    const hitKey = `${hit.visitorId}:${uuidV4()}`
    hit.key = hitKey
    this._hitsPoolQueue.set(hitKey, hit)
    if (hit.type === HitType.CONSENT && !(hit as Consent).visitorConsent) {
      await this.notConsent(hit.visitorId)
    }
    logDebug(this.config, sprintf(HIT_ADDED_IN_QUEUE, JSON.stringify(hit.toApiKeys())), ADD_HIT)
  }

  async notConsent (visitorId: string):Promise<void> {
    const keys = Array.from(this._hitsPoolQueue.keys()).filter(x => x.includes(visitorId))

    const keysToFlush:string[] = []
    keys.forEach(key => {
      const isConsentHit = this._hitsPoolQueue.get(key)?.type === HitType.CONSENT
      if (isConsentHit) {
        return
      }
      this._hitsPoolQueue.delete(key)
      keysToFlush.push(key)
    })
    await this.cacheHit(this._hitsPoolQueue)
  }

  async sendActivate (activateHits:HitAbstract[]):Promise<void> {
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
        break
      }
      batch.hits.push(item)
    }

    await this.sendActivate(activateHits)

    if (!batch.hits.length) {
      if (activateHits.length) {
        await this.cacheHit(this._hitsPoolQueue)
      }
      return
    }

    batch.hits.forEach(hit => {
      this._hitsPoolQueue.delete(hit.key)
    })

    const requestBody = batch.toApiKeys()
    try {
      await this._httpClient.postAsync(HIT_EVENT_URL, {
        headers,
        body: requestBody
      })
      logDebug(this.config, sprintf(BATCH_SENT_SUCCESS, JSON.stringify(requestBody)), SEND_BATCH)
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
    await this.cacheHit(this._hitsPoolQueue)
  }
}
