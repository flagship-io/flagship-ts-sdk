import { IFlagshipConfig } from '../config/FlagshipConfig'
import { DEFAULT_HIT_CACHE_TIME_MS, HitType, HIT_CACHE_LOADED, PROCESS_CACHE, PROCESS_LOOKUP_HIT, HIT_CACHE_ERROR, BATCH_LOOP_STARTED, TRACKING_MANAGER, BATCH_LOOP_STOPPED } from '../enum/index'
import { CacheStrategy } from '../enum/BatchStrategy'
import { HitAbstract, IEvent, ITransaction, Transaction, Event, Item, IItem, Page, IPage, IScreen, Screen } from '../hit/index'
import { ISegment, Segment } from '../hit/Segment'
import { IHttpClient } from '../utils/HttpClient'
import { logDebugSprintf, logError, logErrorSprintf, logInfo, logInfoSprintf } from '../utils/utils'
import { BatchingCachingStrategyAbstract } from './BatchingCachingStrategyAbstract'
import { BatchingContinuousCachingStrategy } from './BatchingContinuousCachingStrategy'
import { BatchingPeriodicCachingStrategy } from './BatchingPeriodicCachingStrategy'
import { HitCacheDTO } from '../types'
import { NoBatchingContinuousCachingStrategy } from './NoBatchingContinuousCachingStrategy'
import { Activate, IActivate } from '../hit/Activate'
import { BatchTriggeredBy } from '../enum/BatchTriggeredBy'
import { ITrackingManager } from './ITrackingManager'

export const LOOKUP_HITS_JSON_ERROR = 'JSON DATA must be an array of object'
export const LOOKUP_HITS_JSON_OBJECT_ERROR = 'JSON DATA must fit the type HitCacheDTO'

export abstract class TrackingManagerAbstract implements ITrackingManager {
  private _httpClient: IHttpClient
  private _config: IFlagshipConfig
  private _hitsPoolQueue: Map<string, HitAbstract>
  private _activatePoolQueue: Map<string, Activate>
  protected strategy: BatchingCachingStrategyAbstract
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected _intervalID:any
  protected _isPooling = false

  constructor (httpClient: IHttpClient, config: IFlagshipConfig) {
    this._hitsPoolQueue = new Map<string, HitAbstract>()
    this._activatePoolQueue = new Map<string, Activate>()
    this._httpClient = httpClient
    this._config = config
    this.strategy = this.initStrategy()
    this.lookupHits()
  }

  protected initStrategy ():BatchingCachingStrategyAbstract {
    let strategy:BatchingCachingStrategyAbstract
    switch (this.config.trackingMangerConfig?.cacheStrategy) {
      case CacheStrategy.PERIODIC_CACHING:
        strategy = new BatchingPeriodicCachingStrategy(this.config, this.httpClient, this._hitsPoolQueue, this._activatePoolQueue)
        break
      case CacheStrategy.CONTINUOUS_CACHING:
        strategy = new BatchingContinuousCachingStrategy(this.config, this.httpClient, this._hitsPoolQueue, this._activatePoolQueue)
        break
      default:
        strategy = new NoBatchingContinuousCachingStrategy(this.config, this.httpClient, this._hitsPoolQueue, this._activatePoolQueue)
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

  public abstract activateFlag (hit: Activate): Promise<void>

  public abstract sendBatch(): Promise<void>

  public startBatchingLoop (): void {
    const timeInterval = (this.config.trackingMangerConfig?.batchIntervals) as number * 1000

    logInfoSprintf(this.config, TRACKING_MANAGER, BATCH_LOOP_STARTED, timeInterval)

    this._intervalID = setInterval(() => {
      this.batchingLoop()
    }, timeInterval)
  }

  public stopBatchingLoop (): void {
    clearInterval(this._intervalID)
    this._isPooling = false
    logInfo(this.config, BATCH_LOOP_STOPPED, TRACKING_MANAGER)
  }

  protected async batchingLoop ():Promise<void> {
    if (this._isPooling) {
      return
    }
    this._isPooling = true
    await this.strategy.sendBatch(BatchTriggeredBy.Timer)
    this._isPooling = false
  }

  protected checkLookupHitData (item:HitCacheDTO):boolean {
    if (item?.version === 1 && item?.data?.type && item?.data?.content) {
      return true
    }
    logError(this.config, LOOKUP_HITS_JSON_OBJECT_ERROR, PROCESS_LOOKUP_HIT)
    return false
  }

  async lookupHits ():Promise<void> {
    try {
      const hitCacheImplementation = this.config.hitCacheImplementation

      if (this.config.disableCache || !hitCacheImplementation || typeof hitCacheImplementation.lookupHits !== 'function') {
        return
      }

      const hitsCache = await hitCacheImplementation.lookupHits()

      logDebugSprintf(this.config, PROCESS_CACHE, HIT_CACHE_LOADED, hitsCache)

      if (!hitsCache || !Object.keys(hitsCache).length) {
        return
      }

      const checkHitTime = (time:number) => (((Date.now() - time)) <= DEFAULT_HIT_CACHE_TIME_MS)

      const wrongHitKeys:string[] = []
      Object.entries(hitsCache).forEach(([key, item]) => {
        if (!this.checkLookupHitData(item) || !checkHitTime(item.data.time)) {
          wrongHitKeys.push(key)
          return
        }
        let hit:HitAbstract
        switch (item.data.type) {
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
          case 'SEGMENT':
            hit = new Segment(item.data.content as ISegment)
            break
          case 'ACTIVATE':
            hit = new Activate(item.data.content as IActivate)
            hit.key = key
            hit.createdAt = item.data.content.createdAt
            hit.config = this.config
            this._activatePoolQueue.set(key, hit as Activate)
            return
          case HitType.TRANSACTION:
            hit = new Transaction(item.data.content as ITransaction)
            break
          default:
            return
        }
        hit.key = key
        hit.createdAt = item.data.content.createdAt
        hit.config = this.config
        this._hitsPoolQueue.set(key, hit)
      })

      if (wrongHitKeys.length) {
        await this.strategy.flushHits(wrongHitKeys)
      }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logErrorSprintf(this.config, PROCESS_CACHE, HIT_CACHE_ERROR, 'lookupHits', error.message || error)
    }
  }
}
