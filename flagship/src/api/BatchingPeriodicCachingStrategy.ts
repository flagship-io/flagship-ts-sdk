import { ADD_HIT, BASE_API_URL, BATCH_MAX_SIZE, BATCH_SENT_SUCCESS, FS_CONSENT, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, HitType, HIT_ADDED_IN_QUEUE, HIT_EVENT_URL, HIT_SENT_SUCCESS, SDK_INFO, SEND_ACTIVATE, SEND_BATCH, URL_ACTIVATE_MODIFICATION } from '../enum/index'
import { Activate } from '../hit/Activate'
import { ActivateBatch } from '../hit/ActivateBatch'
import { Batch } from '../hit/Batch'
import { HitAbstract, Event } from '../hit/index'
import { errorFormat, logDebug, logError, sprintf, uuidV4 } from '../utils/utils'
import { BatchingCachingStrategyAbstract } from './BatchingCachingStrategyAbstract'

export class BatchingPeriodicCachingStrategy extends BatchingCachingStrategyAbstract {
  async addHit (hit: HitAbstract): Promise<void> {
    const hitKey = `${hit.visitorId}:${uuidV4()}`
    hit.key = hitKey
    this._hitsPoolQueue.set(hitKey, hit)
    if (hit.type === HitType.EVENT && (hit as Event).action === FS_CONSENT && (hit as Event).label === `${SDK_INFO.name}:false`) {
      await this.notConsent(hit.visitorId)
    }
    logDebug(this.config, sprintf(HIT_ADDED_IN_QUEUE, JSON.stringify(hit.toApiKeys())), ADD_HIT)

    if (this.config.trackingMangerConfig?.batchLength && this._hitsPoolQueue.size >= this.config.trackingMangerConfig.batchLength) {
      this.sendBatch()
    }
  }

  async sendActivate (activateHitsPool:Activate[], currentActivate?:Activate) {
    const headers = {
      [HEADER_X_API_KEY]: this.config.apiKey as string,
      [HEADER_X_SDK_CLIENT]: SDK_INFO.name,
      [HEADER_X_SDK_VERSION]: SDK_INFO.version,
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    const activateBatch = new ActivateBatch(Array.from(activateHitsPool), this.config)

    if (currentActivate) {
      activateBatch.hits.push(currentActivate)
    }

    const requestBody = activateBatch.toApiKeys()
    const url = BASE_API_URL + URL_ACTIVATE_MODIFICATION
    try {
      await this._httpClient.postAsync(url, {
        headers,
        body: requestBody
      })

      logDebug(this.config, sprintf(HIT_SENT_SUCCESS, JSON.stringify(requestBody)), SEND_ACTIVATE)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      activateBatch.hits.forEach(item => {
        this._activatePoolQueue.set(item.key, item)
      })

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

    let activateHitsPool:Activate[] = []
    if (this._activatePoolQueue.size) {
      activateHitsPool = Array.from(this._activatePoolQueue.values())
    }

    this._activatePoolQueue.clear()

    await this.sendActivate(activateHitsPool, hit)
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
    await this.cacheHit(this._hitsPoolQueue)
  }

  async sendBatch (): Promise<void> {
    let hasActivateHit = false
    if (this._activatePoolQueue.size) {
      const activateHits = Array.from(this._activatePoolQueue.values())
      this._activatePoolQueue.clear()
      await this.sendActivate(activateHits)
      hasActivateHit = true
    }
    const headers = {
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    const batch:Batch = new Batch({ hits: [] })
    batch.config = this.config

    let batchSize = 0

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [_, item] of this._hitsPoolQueue) {
      batchSize = JSON.stringify(batch).length
      if (batchSize > BATCH_MAX_SIZE) {
        break
      }
      batch.hits.push(item)
    }

    if (!batch.hits.length) {
      if (hasActivateHit) {
        await this.cacheHit(this._activatePoolQueue)
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
    const mergedQueue = new Map<string, HitAbstract>([...this._hitsPoolQueue, ...this._activatePoolQueue])
    await this.cacheHit(mergedQueue)
  }
}
