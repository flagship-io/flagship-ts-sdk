import { IFlagshipConfig } from '../config/index'
import { HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, HEADER_CONTENT_TYPE, HEADER_APPLICATION_JSON, HIT_EVENT_URL, HitType, BATCH_MAX_SIZE, BATCH_SENT_SUCCESS, SEND_BATCH, HIT_SENT_SUCCESS, BASE_API_URL, SEND_ACTIVATE, URL_ACTIVATE_MODIFICATION, SEND_HIT, FS_CONSENT, SDK_INFO } from '../enum/index'
import { Activate } from '../hit/Activate'
import { Batch } from '../hit/Batch'
import { HitAbstract, Event } from '../hit/index'
import { IHttpClient } from '../utils/HttpClient'
import { errorFormat, logDebug, logError, sprintf, uuidV4 } from '../utils/utils'
import { BatchingCachingStrategyAbstract } from './BatchingCachingStrategyAbstract'

export class NoBatchingContinuousCachingStrategy extends BatchingCachingStrategyAbstract {
  protected cacheHitKeys:Record<string, string>

  constructor (config: IFlagshipConfig, httpClient: IHttpClient, hitsPoolQueue: Map<string, HitAbstract>, activatePoolQueue: Map<string, Activate>) {
    super(config, httpClient, hitsPoolQueue, activatePoolQueue)
    this.cacheHitKeys = {}
  }

  async sendActivate (activateHits:Activate[]) {
    const headers = {
      [HEADER_X_API_KEY]: this.config.apiKey as string,
      [HEADER_X_SDK_CLIENT]: SDK_INFO.name,
      [HEADER_X_SDK_VERSION]: SDK_INFO.version,
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    const hitKeys:string[] = []
    const requestBody = activateHits.map(item => {
      hitKeys.push(item.key)
      return item.toApiKeys()
    })

    const url = /* BASE_API_URL */ 'https://test-api.free.beeceptor.com/' + URL_ACTIVATE_MODIFICATION
    try {
      await this._httpClient.postAsync(url, {
        headers,
        body: requestBody
      })

      logDebug(this.config, sprintf(HIT_SENT_SUCCESS, JSON.stringify(requestBody)), SEND_ACTIVATE)

      await this.flushHits(hitKeys)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      const hits = new Map<string, Activate>()
      activateHits.forEach((item) => {
        this.cacheHitKeys[item.key] = item.key
        hits.set(item.key, item)
      })
      await this.cacheHit(hits)

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

    await this.sendActivate([hit])
  }

  async addHit (hit: HitAbstract): Promise<void> {
    const hitKey = `${hit.visitorId}:${uuidV4()}`
    hit.key = hitKey

    if (hit.type === HitType.EVENT && (hit as Event).action === FS_CONSENT && (hit as Event).label === `${SDK_INFO.name}:false`) {
      await this.notConsent(hit.visitorId)
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      if (hit.type !== HitType.EVENT || (hit as Event).action !== FS_CONSENT) {
        this.cacheHitKeys[hit.key] = hit.key
      }
      await this.cacheHit(new Map<string, HitAbstract>().set(hit.key, hit))
      logError(this.config, errorFormat(error.message || error, {
        url: HIT_EVENT_URL,
        headers,
        body: requestBody
      }), SEND_HIT)
    }
  }

  async notConsent (visitorId: string): Promise<void> {
    const keys = Object.keys(this.cacheHitKeys)
    const hitsPoolQueueKeys = Array.from(this._hitsPoolQueue).filter(([key, item]) => {
      return (item?.type !== HitType.EVENT || (item as Event)?.action !== FS_CONSENT) && key.includes(visitorId)
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

  async sendBatch (): Promise<void> {
    if (this._activatePoolQueue.size) {
      const activateHits = Array.from(this._activatePoolQueue.values())
      this._activatePoolQueue.clear()
      await this.sendActivate(activateHits)
    }
    const headers = {
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    const batch:Batch = new Batch({ hits: [] })
    batch.config = this.config

    let batchSize = 0
    let count = 0

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [_, item] of this._hitsPoolQueue) {
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
