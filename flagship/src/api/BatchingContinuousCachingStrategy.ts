import { ADD_HIT, BASE_API_URL, BATCH_MAX_SIZE, BATCH_SENT_SUCCESS, EVENT_SUFFIX, FS_CONSENT, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, HitType, HIT_ADDED_IN_QUEUE, HIT_EVENT_URL, HIT_SENT_SUCCESS, SDK_APP, SDK_LANGUAGE, SDK_VERSION, SEND_ACTIVATE, SEND_BATCH, SEND_SEGMENT_HIT, URL_ACTIVATE_MODIFICATION } from '../enum/index'
import { Activate } from '../hit/Activate'
import { Batch } from '../hit/Batch'
import { HitAbstract, Event } from '../hit/index'
import { errorFormat, logDebug, logError, sprintf, uuidV4 } from '../utils/utils'
import { BatchingCachingStrategyAbstract } from './BatchingCachingStrategyAbstract'

export class BatchingContinuousCachingStrategy extends BatchingCachingStrategyAbstract {
  async addHit (hit: HitAbstract): Promise<void> {
    const hitKey = `${hit.visitorId}:${uuidV4()}`
    hit.key = hitKey

    this._hitsPoolQueue.set(hitKey, hit)
    await this.cacheHit(new Map<string, HitAbstract>().set(hitKey, hit))

    if (hit.type === HitType.EVENT && (hit as Event).action === FS_CONSENT && (hit as Event).label === `${SDK_LANGUAGE.name}:false`) {
      await this.notConsent(hit.visitorId)
    }

    logDebug(this.config, sprintf(HIT_ADDED_IN_QUEUE, JSON.stringify(hit.toApiKeys())), ADD_HIT)
  }

  async activate (hit: Activate): Promise<void> {
    const hitKey = `${hit.visitorId}:${uuidV4()}`
    hit.key = hitKey

    await this.cacheHit(new Map<string, HitAbstract>().set(hitKey, hit))

    let activateHits:Activate[] = [hit]
    if (this._activatePoolQueue.size) {
      activateHits = [...activateHits, ...Array.from(this._activatePoolQueue.values())]
    }

    this._activatePoolQueue.clear()

    const headers = {
      [HEADER_X_API_KEY]: this.config.apiKey as string,
      [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE.name,
      [HEADER_X_SDK_VERSION]: SDK_VERSION,
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    const requestBody = activateHits.map(item => item.toApiKeys())

    const url = BASE_API_URL + URL_ACTIVATE_MODIFICATION
    try {
      await this._httpClient.postAsync(url, {
        headers,
        body: requestBody
      })

      logDebug(this.config, sprintf(HIT_SENT_SUCCESS, JSON.stringify(requestBody)), SEND_ACTIVATE)

      await this.flushHits(activateHits.map(item => item.key))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      activateHits.forEach(item => {
        this._activatePoolQueue.set(item.key, item)
      })
      logError(this.config, errorFormat(error.message || error, {
        url,
        headers,
        body: requestBody
      }), SEND_ACTIVATE)
    }
  }

  async notConsent (visitorId: string):Promise<void> {
    const keys = Array.from(this._hitsPoolQueue).filter(([key, item]) => {
      return (item?.type !== HitType.EVENT || (item as Event)?.action !== FS_CONSENT) && key.includes(visitorId)
    })

    const keysToFlush:string[] = []
    keys.forEach(([key]) => {
      this._hitsPoolQueue.delete(key)
      keysToFlush.push(key)
    })
    if (!keysToFlush.length) {
      return
    }
    await this.flushHits(keysToFlush)
  }

  protected async addHitWithKey (hitKey:string, hit:HitAbstract):Promise<void> {
    this._hitsPoolQueue.set(hitKey, hit)
    await this.cacheHit(new Map<string, HitAbstract>().set(hitKey, hit))
  }

  async sendBatch (): Promise<void> {
    const batch:Batch = new Batch({ hits: [], ds: SDK_APP })
    batch.config = this.config

    let count = 0

    const hitKeysToRemove:string[] = []

    for (const [key, item] of this._hitsPoolQueue) {
      count++
      const batchSize = JSON.stringify(batch).length
      if (batchSize > BATCH_MAX_SIZE || (this.config.trackingMangerConfig?.batchLength && count > this.config.trackingMangerConfig.batchLength)) {
        break
      }
      batch.hits.push(item)
      hitKeysToRemove.push(key)
    }

    if (!batch.hits.length) {
      return
    }

    hitKeysToRemove.forEach(key => {
      this._hitsPoolQueue.delete(key)
    })

    const headers = {
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    const requestBody = batch.toApiKeys()

    try {
      await this._httpClient.postAsync(HIT_EVENT_URL, {
        headers,
        body: requestBody
      })

      logDebug(this.config, sprintf(BATCH_SENT_SUCCESS, JSON.stringify(requestBody)), SEND_BATCH)

      await this.flushHits(hitKeysToRemove)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      const hits = new Map<string, HitAbstract>()
      batch.hits.forEach((hit) => {
        this._hitsPoolQueue.set(hit.key, hit)
        hits.set(hit.key, hit)
      })

      await this.cacheHit(hits)

      logError(this.config, errorFormat(error.message || error, {
        url: HIT_EVENT_URL,
        headers,
        body: requestBody
      }), SEND_BATCH)
    }
  }
}
