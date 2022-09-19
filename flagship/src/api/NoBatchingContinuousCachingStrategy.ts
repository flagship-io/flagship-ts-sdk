import { IFlagshipConfig } from '../config/index'
import { HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, SDK_LANGUAGE, HEADER_X_SDK_VERSION, SDK_VERSION, HEADER_CONTENT_TYPE, HEADER_APPLICATION_JSON, HIT_EVENT_URL, HitType, BATCH_MAX_SIZE, BATCH_SENT_SUCCESS, SEND_BATCH, HIT_SENT_SUCCESS, BASE_API_URL, SEND_ACTIVATE, URL_ACTIVATE_MODIFICATION, SEND_HIT, FS_CONSENT, EVENT_SUFFIX, SEND_SEGMENT_HIT } from '../enum/index'
import { Batch } from '../hit/Batch'
import { HitAbstract, Event } from '../hit/index'
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

    if (hit.type === HitType.EVENT && (hit as Event).action === FS_CONSENT && (hit as Event).label === `${SDK_LANGUAGE.name}:false`) {
      await this.notConsent(hit.visitorId)
    }

    await this.cacheHit(new Map<string, HitAbstract>().set(hitKey, hit))

    if (hit.type === 'ACTIVATE' || hit.type === 'CONTEXT') {
      await this.sendOtherHit(hit)
      return
    }

    await this.sendHit(hit)
  }

  async sendHit (hit:HitAbstract):Promise<void> {
    const headers = {
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    const requestBody = hit.toApiKeys()

    try {
      await this._httpClient.postAsync(HIT_EVENT_URL, {
        headers,
        body: requestBody
      })

      logDebug(this.config, sprintf(HIT_SENT_SUCCESS, JSON.stringify(requestBody)), SEND_HIT)

      await this.flushHits([hit.key])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      if (hit.type !== HitType.EVENT && (hit as Event).action !== FS_CONSENT) {
        this.cacheHitKeys[hit.key] = hit.key
      }
      logError(this.config, errorFormat(error.message || error, {
        url: HIT_EVENT_URL,
        headers,
        body: requestBody
      }), SEND_HIT)
    }
  }

  /**
   * Other hits are ACTIVATE AND SEGMENT
   * @param hit
   */
  async sendOtherHit (hit:HitAbstract):Promise<void> {
    const headers = {
      [HEADER_X_API_KEY]: this.config.apiKey as string,
      [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE.name,
      [HEADER_X_SDK_VERSION]: SDK_VERSION,
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

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
      await this.flushHits([hit.key])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      this.cacheHitKeys[hit.key] = hit.key
      logError(this.config, errorFormat(error.message || error, {
        url,
        headers,
        body: requestBody
      }), tag)
    }
  }

  async notConsent (visitorId: string): Promise<void> {
    const keys = Object.keys(this.cacheHitKeys)
    const hitsPoolQueueKeys = Array.from(this._hitsPoolQueue).filter(([key, item]) => {
      return !(item?.type === HitType.EVENT && (item as Event)?.action === FS_CONSENT) && key.includes(visitorId)
    })

    const keysToFlush:string[] = []
    hitsPoolQueueKeys.forEach(([key]) => {
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

  async SendActivateAndSegmentHit (activateHits:HitAbstract[]):Promise<void> {
    const hitKeys:string[] = []

    const headers = {
      [HEADER_X_API_KEY]: this.config.apiKey as string,
      [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE.name,
      [HEADER_X_SDK_VERSION]: SDK_VERSION,
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    for (const hit of activateHits) {
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
        hitKeys.push(hit.key)

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

    if (hitKeys.length) {
      await this.flushHits(hitKeys)
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
    const activateHits:HitAbstract[] = []

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [_, item] of this._hitsPoolQueue) {
      if (item.type === 'ACTIVATE' || item.type === 'CONTEXT') {
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

    batch.hits.forEach(hit => {
      this._hitsPoolQueue.delete(hit.key)
    })

    await this.SendActivateAndSegmentHit(activateHits)

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
