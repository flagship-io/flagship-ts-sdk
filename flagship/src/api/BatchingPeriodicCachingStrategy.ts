import { ADD_HIT, BASE_API_URL, BATCH_MAX_SIZE, BATCH_SENT_SUCCESS, EVENT_SUFFIX, FS_CONSENT, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, HitType, HIT_ADDED_IN_QUEUE, HIT_EVENT_URL, HIT_SENT_SUCCESS, SDK_LANGUAGE, SDK_VERSION, SEND_ACTIVATE, SEND_BATCH, SEND_SEGMENT_HIT, URL_ACTIVATE_MODIFICATION } from '../enum/index'
import { Batch } from '../hit/Batch'
import { HitAbstract, Event } from '../hit/index'
import { errorFormat, logDebug, logError, sprintf, uuidV4 } from '../utils/utils'
import { BatchingCachingStrategyAbstract } from './BatchingCachingStrategyAbstract'

export class BatchingPeriodicCachingStrategy extends BatchingCachingStrategyAbstract {
  async addHit (hit: HitAbstract): Promise<void> {
    const hitKey = `${hit.visitorId}:${uuidV4()}`
    hit.key = hitKey
    this._hitsPoolQueue.set(hitKey, hit)
    if (hit.type === HitType.EVENT && (hit as Event).action === FS_CONSENT && (hit as Event).label === `${SDK_LANGUAGE.name}:false`) {
      await this.notConsent(hit.visitorId)
    }
    logDebug(this.config, sprintf(HIT_ADDED_IN_QUEUE, JSON.stringify(hit.toApiKeys())), ADD_HIT)
  }

  async notConsent (visitorId: string):Promise<void> {
    const keys = Array.from(this._hitsPoolQueue.keys()).filter(x => x.includes(visitorId))

    const keysToFlush:string[] = []
    keys.forEach(key => {
      const item = this._hitsPoolQueue.get(key)
      const isConsentHit = item?.type === HitType.EVENT && (item as Event)?.action === FS_CONSENT
      if (isConsentHit) {
        return
      }
      this._hitsPoolQueue.delete(key)
      keysToFlush.push(key)
    })
    await this.cacheHit(this._hitsPoolQueue)
  }

  async SendActivateAndSegmentHit (hits:HitAbstract[]):Promise<void> {
    const headers = {
      [HEADER_X_API_KEY]: this.config.apiKey as string,
      [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE.name,
      [HEADER_X_SDK_VERSION]: SDK_VERSION,
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    for (const hit of hits) {
      this._hitsPoolQueue.delete(hit.key)
      const requestBody = hit.toApiKeys()
      const isActivateHit = hit.type === 'ACTIVATE'
      let url = BASE_API_URL
      url += isActivateHit ? URL_ACTIVATE_MODIFICATION : `${this.config.envId}/${EVENT_SUFFIX}`
      const tag = isActivateHit ? SEND_ACTIVATE : SEND_SEGMENT_HIT
      try {
        await this._httpClient.postAsync(url, {
          headers,
          body: requestBody
        })
        logDebug(this.config, sprintf(HIT_SENT_SUCCESS, JSON.stringify(requestBody)), tag)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error:any) {
        this._hitsPoolQueue.set(hit.key, hit)
        logError(this.config, errorFormat(error.message || error, {
          url,
          headers,
          body: requestBody
        }), tag)
      }
    }
  }

  async sendBatch (): Promise<void> {
    const headers = {
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    const batch:Batch = new Batch({ hits: [] })
    batch.config = this.config

    let batchSize = 0
    let count = 0
    const otherHits:HitAbstract[] = []

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [_, item] of this._hitsPoolQueue) {
      if (item.type === 'ACTIVATE' || item.type === 'CONTEXT') {
        otherHits.push(item)
        continue
      }
      count++
      batchSize = JSON.stringify(batch).length
      if (batchSize > BATCH_MAX_SIZE || (this.config.trackingMangerConfig?.batchLength && count > this.config.trackingMangerConfig.batchLength)) {
        break
      }
      batch.hits.push(item)
    }

    await this.SendActivateAndSegmentHit(otherHits)

    if (!batch.hits.length) {
      if (otherHits.length) {
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
