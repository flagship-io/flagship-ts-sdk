import { ADD_HIT, BASE_API_URL, BATCH_MAX_SIZE, BATCH_SENT_SUCCESS, FS_CONSENT, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, HitType, HIT_ADDED_IN_QUEUE, HIT_EVENT_URL, HIT_SENT_SUCCESS, SDK_APP, SDK_INFO, SEND_ACTIVATE, SEND_BATCH, URL_ACTIVATE_MODIFICATION } from '../enum/index'
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
    await this.cacheHit(new Map<string, HitAbstract>([[hitKey, hit]]))

    if (hit.type === HitType.EVENT && (hit as Event).action === FS_CONSENT && (hit as Event).label === `${SDK_INFO.name}:false`) {
      await this.notConsent(hit.visitorId)
    }

    logDebug(this.config, sprintf(HIT_ADDED_IN_QUEUE, JSON.stringify(hit.toApiKeys())), ADD_HIT)
  }

  protected async sendActivate (activateHitsPool:Activate[], currentActivate?:Activate) {
    const headers = {
      [HEADER_X_API_KEY]: this.config.apiKey as string,
      [HEADER_X_SDK_CLIENT]: SDK_INFO.name,
      [HEADER_X_SDK_VERSION]: SDK_INFO.version,
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    const activateBatch:Record<string, unknown>[] = []
    const hitKeysToRemove:string[] = []

    activateHitsPool.forEach(item => {
      hitKeysToRemove.push(item.key)
      activateBatch.push(item.toApiKeys())
    })

    if (currentActivate) {
      activateBatch.push(currentActivate.toApiKeys())
    }

    const requestBody = {
      batch: activateBatch
    }

    const url = BASE_API_URL + URL_ACTIVATE_MODIFICATION
    try {
      await this._httpClient.postAsync(url, {
        headers,
        body: requestBody
      })

      logDebug(this.config, sprintf(HIT_SENT_SUCCESS, JSON.stringify(requestBody)), SEND_ACTIVATE)

      if (hitKeysToRemove.length) {
        await this.flushHits(hitKeysToRemove)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      activateHitsPool.forEach(item => {
        this._activatePoolQueue.set(item.key, item)
      })

      if (currentActivate) {
        this._activatePoolQueue.set(currentActivate.key, currentActivate)
        await this.cacheHit(new Map<string, Activate>([[currentActivate.key, currentActivate]]))
      }

      logError(this.config, errorFormat(error.message || error, {
        url,
        headers,
        body: requestBody
      }), SEND_ACTIVATE)
    }
  }

  async activateFlag (hit: Activate): Promise<void> {
    const hitKey = `${hit.visitorId}:${uuidV4()}`
    hit.key = hitKey

    let activateHitPool:Activate[] = []
    if (this._activatePoolQueue.size) {
      activateHitPool = Array.from(this._activatePoolQueue.values())
    }

    this._activatePoolQueue.clear()

    await this.sendActivate(activateHitPool, hit)
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

  async sendBatch (): Promise<void> {
    if (this._activatePoolQueue.size) {
      const activateHits = Array.from(this._activatePoolQueue.values())
      this._activatePoolQueue.clear()
      await this.sendActivate(activateHits)
    }

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
