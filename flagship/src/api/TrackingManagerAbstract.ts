import { IFlagshipConfig } from '../config/FlagshipConfig'
import { DEFAULT_TIME_INTERVAL, HitType } from '../enum'
import { BatchStrategy } from '../enum/BatchStrategy'
import { HitAbstract, IEvent, ITransaction, Transaction, Event, Item, IItem, Page, IPage, IScreen, Screen } from '../hit'
import { Campaign, ICampaign } from '../hit/Campaign'
import { Consent, IConsent } from '../hit/Consent'
import { ISegment, Segment } from '../hit/Segment'
import { IHttpClient } from '../utils/HttpClient'
import { logError, logInfo } from '../utils/utils'
import { CachingStrategyAbstract } from './CachingStrategyAbstract'
import { ContinuousCachingStrategy } from './ContinuousCachingStrategy'

export const LOOKUP_HITS_JSON_ERROR = 'JSON DATA must be an array of object'

export interface ITrackingManagerCommon {
  config:IFlagshipConfig

  addHit(hit: HitAbstract): Promise<void>

  addHits(hits: HitAbstract[]): Promise<void>
}

export interface ITrackingManager extends ITrackingManagerCommon {

  startBatchingLoop():void

  stopBatchingLoop():void

}

export abstract class TrackingManagerAbstract implements ITrackingManager {
  private _httpClient: IHttpClient;
  private _config: IFlagshipConfig;
  private _hitsPoolQueue: Map<string, HitAbstract>;
  protected strategy: CachingStrategyAbstract;
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

  initStrategy ():CachingStrategyAbstract {
    let strategy = new ContinuousCachingStrategy(this.config, this.httpClient, this._hitsPoolQueue)
    switch (this.config.trackingMangerConfig?.batchStrategy) {
      case BatchStrategy.NO_BATCHING_WITH_CONTINUOUS_CACHING_STRATEGY :
        strategy = new ContinuousCachingStrategy(this.config, this.httpClient, this._hitsPoolQueue)
        break
      case BatchStrategy.BATCHING_WITH_PERIODIC_CACHING_STRATEGY:
        strategy = new ContinuousCachingStrategy(this.config, this.httpClient, this._hitsPoolQueue)
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

  public abstract addHits(hits: HitAbstract[]): Promise<void>

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

  public async batchingLoop ():Promise<void> {
    if (this._isPooling) {
      return
    }
    this._isPooling = true
    await this.strategy.sendBatch()
    this._isPooling = false
  }

  async lookupHits ():Promise<void> {
    try {
      const hitCacheImplementation = this.config.hitCacheImplementation

      if (this.config.disableCache || !hitCacheImplementation || typeof hitCacheImplementation.lookupHits !== 'function') {
        return
      }

      const hitsCache = await hitCacheImplementation.lookupHits()
      if (!hitsCache) {
        return
      }
      if (!(hitsCache instanceof Map)) {
        throw Error(LOOKUP_HITS_JSON_ERROR)
      }

      hitsCache.forEach((item, key) => {
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
          default:
            hit = new Transaction(item.data.content as ITransaction)
            break
        }
        hit.key = key
        this._hitsPoolQueue.set(key, hit)
      })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logError(this.config, error.message || error, 'lookupHits')
    }
  }
}
