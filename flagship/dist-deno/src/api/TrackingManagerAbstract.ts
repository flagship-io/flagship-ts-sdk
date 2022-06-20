import { IFlagshipConfig } from '../config/FlagshipConfig.ts'
import { DEFAULT_HIT_CACHE_TIME, DEFAULT_TIME_INTERVAL, HitType } from '../enum/index.ts'
import { BatchStrategy } from '../enum/BatchStrategy.ts'
import { HitAbstract, IEvent, ITransaction, Transaction, Event, Item, IItem, Page, IPage, IScreen, Screen } from '../hit/index.ts'
import { Campaign, ICampaign } from '../hit/Campaign.ts'
import { Consent, IConsent } from '../hit/Consent.ts'
import { ISegment, Segment } from '../hit/Segment.ts'
import { IHttpClient } from '../utils/HttpClient.ts'
import { logError, logInfo } from '../utils/utils.ts'
import { BatchingCachingStrategyAbstract } from './BatchingCachingStrategyAbstract.ts'
import { BatchingContinuousCachingStrategy } from './BatchingContinuousCachingStrategy.ts'
import { BatchingPeriodicCachingStrategy } from './BatchingPeriodicCachingStrategy.ts'
import { HitCacheDTO } from '../types.ts'
import { NoBatchingContinuousCachingStrategy } from './NoBatchingContinuousCachingStrategy.ts'

export const LOOKUP_HITS_JSON_ERROR = 'JSON DATA must be an array of object'
export const LOOKUP_HITS_JSON_OBJECT_ERROR = 'JSON DATA must fit the type HitCacheDTO'

export interface ITrackingManagerCommon {
  config:IFlagshipConfig

  addHit(hit: HitAbstract): Promise<void>
}

export interface ITrackingManager extends ITrackingManagerCommon {

  startBatchingLoop():void

  stopBatchingLoop():void

}

export abstract class TrackingManagerAbstract implements ITrackingManager {
  private _httpClient: IHttpClient;
  private _config: IFlagshipConfig;
  private _hitsPoolQueue: Map<string, HitAbstract>;
  protected strategy: BatchingCachingStrategyAbstract;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected _intervalID:any;
  protected _isPooling = false

  constructor (httpClient: IHttpClient, config: IFlagshipConfig) {
    this._hitsPoolQueue = new Map<string, HitAbstract>()
    this._httpClient = httpClient
    this._config = config
    this.lookupHits()
    this.strategy = this.initStrategy()
  }

  protected initStrategy ():BatchingCachingStrategyAbstract {
    let strategy:BatchingCachingStrategyAbstract
    switch (this.config.trackingMangerConfig?.batchStrategy) {
      case BatchStrategy.BATCHING_WITH_PERIODIC_CACHING_STRATEGY:
        strategy = new BatchingPeriodicCachingStrategy(this.config, this.httpClient, this._hitsPoolQueue)
        break
      case BatchStrategy.BATCHING_WITH_CONTINUOUS_CACHING_STRATEGY:
        strategy = new BatchingContinuousCachingStrategy(this.config, this.httpClient, this._hitsPoolQueue)
        break
      default:
        strategy = new NoBatchingContinuousCachingStrategy(this.config, this.httpClient, this._hitsPoolQueue)
        break
    }
    return strategy
  }

  public get httpClient ():IHttpClient {
    return this._httpClient
  }

  public get config ():IFlagshipConfig {
    return this._config
  }

  public abstract addHit(hit: HitAbstract): Promise<void>

  public startBatchingLoop (): void {
    const timeInterval = (this.config.trackingMangerConfig?.batchIntervals ?? DEFAULT_TIME_INTERVAL) * 1000
    logInfo(this.config, 'Batching Loop have been started', 'startBatchingLoop')

    this._intervalID = setInterval(() => {
      this.batchingLoop()
    }, timeInterval)
  }

  public stopBatchingLoop (): void {
    clearInterval(this._intervalID)
    this._isPooling = false
    logInfo(this.config, 'Batching Loop have been finished', 'stopBatchingLoop')
  }

  protected async batchingLoop ():Promise<void> {
    if (this._isPooling) {
      return
    }
    this._isPooling = true
    await this.strategy.sendBatch()
    this._isPooling = false
  }

  protected checKLookupHitData (item:HitCacheDTO):boolean {
    if (item?.version === 1 && item?.data?.type && item?.data?.content) {
      return true
    }
    logError(this.config, LOOKUP_HITS_JSON_OBJECT_ERROR, 'lookupHits')
    return false
  }

  async lookupHits ():Promise<void> {
    try {
      const hitCacheImplementation = this.config.hitCacheImplementation

      if (this.config.disableCache || !hitCacheImplementation || typeof hitCacheImplementation.lookupHits !== 'function') {
        return
      }

      const hitsCache = await hitCacheImplementation.lookupHits()
      if (!hitsCache || !Object.keys(hitsCache).length) {
        return
      }

      const checkHitTime = (time:number) => (((Date.now() - time) / 1000) <= DEFAULT_HIT_CACHE_TIME)

      const wrongHitKeys:string[] = []
      Object.entries(hitsCache).forEach(([key, item]) => {
        if (!this.checKLookupHitData(item) || !checkHitTime(item.data.time)) {
          wrongHitKeys.push(key)
          return
        }
        let hit:HitAbstract
        switch (item.data.type) {
          case HitType.CAMPAIGN:
            hit = new Campaign(item.data.content as ICampaign)
            break
          case HitType.CONSENT:
            hit = new Consent(item.data.content as IConsent)
            break
          case HitType.EVENT:
            hit = new Event(item.data.content as IEvent)
            break
          case HitType.ITEM:
            hit = new Item(item.data.content as IItem)
            break
          case HitType.PAGE:
            hit = new Page(item.data.content as IPage)
            break
          case HitType.SCREEN:
            hit = new Screen(item.data.content as IScreen)
            break
          case HitType.SEGMENT:
            hit = new Segment(item.data.content as ISegment)
            break
          case HitType.TRANSACTION:
            hit = new Transaction(item.data.content as ITransaction)
            break
          default:
            return
        }
        hit.key = key
        hit.createdAt = item.data.content.createdAt
        this._hitsPoolQueue.set(key, hit)
      })

      await this.strategy.flushHits(wrongHitKeys)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logError(this.config, error.message || error, 'lookupHits')
    }
  }
}
