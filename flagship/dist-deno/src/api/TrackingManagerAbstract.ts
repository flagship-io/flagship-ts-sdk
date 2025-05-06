import { type IFlagshipConfig } from '../config/IFlagshipConfig.ts';
import { BATCH_LOOP_STARTED, BATCH_LOOP_STOPPED, DEFAULT_HIT_CACHE_TIME_MS, HitType, HIT_CACHE_ERROR, HIT_CACHE_LOADED, PROCESS_CACHE, PROCESS_LOOKUP_HIT, TRACKING_MANAGER } from '../enum/index.ts';
import { CacheStrategy } from '../enum/CacheStrategy.ts';
import { IEvent, type ITransaction, type IItem, type IPage, type IScreen } from '../hit/index.ts';
import { type ISegment } from '../hit/Segment.ts';
import { type IHttpClient } from '../utils/HttpClient.ts';
import { logDebugSprintf, logError, logErrorSprintf, logInfo, logInfoSprintf } from '../utils/utils.ts';
import { BatchingCachingStrategyAbstract } from './BatchingCachingStrategyAbstract.ts';
import { BatchingContinuousCachingStrategy } from './BatchingContinuousCachingStrategy.ts';
import { BatchingPeriodicCachingStrategy } from './BatchingPeriodicCachingStrategy.ts';
import { HitCacheDTO, TroubleshootingData } from '../types.ts';
import { NoBatchingContinuousCachingStrategy } from './NoBatchingContinuousCachingStrategy.ts';
import { type Activate } from '../hit/Activate.ts';
import { BatchTriggeredBy } from '../enum/BatchTriggeredBy.ts';
import { ITrackingManager } from './ITrackingManager.ts';
import { type Troubleshooting } from '../hit/Troubleshooting.ts';
import { type UsageHit } from '../hit/UsageHit.ts';
import { ISharedActionTracking } from '../sharedFeature/ISharedActionTracking.ts';
import { ActivateConstructorParam, IActivate } from '../type.local.ts';
import { type HitAbstract } from '../hit/HitAbstract.ts';

export const LOOKUP_HITS_JSON_ERROR = 'JSON DATA must be an array of object';
export const LOOKUP_HITS_JSON_OBJECT_ERROR = 'JSON DATA must fit the type HitCacheDTO';

export abstract class TrackingManagerAbstract implements ITrackingManager {
  private _httpClient: IHttpClient;
  private _config: IFlagshipConfig;
  private _hitsPoolQueue: Map<string, HitAbstract>;
  private _activatePoolQueue: Map<string, Activate>;
  private _troubleshootingQueue: Map<string, Troubleshooting>;
  protected _analyticHitQueue: Map<string, UsageHit>;
  protected strategy: BatchingCachingStrategyAbstract;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected _intervalID:any;
  protected _isPooling = false;
  private _flagshipInstanceId?: string;
  private _initTroubleshootingHit? : Troubleshooting;
  private _sharedActionTracking?: ISharedActionTracking;

  public get initTroubleshootingHit() : Troubleshooting|undefined {
    return this._initTroubleshootingHit;
  }

  public set initTroubleshootingHit(v : Troubleshooting|undefined) {
    this._initTroubleshootingHit = v;
    this.strategy.initTroubleshootingHit = v;
  }

  public get flagshipInstanceId(): string|undefined {
    return this._flagshipInstanceId;
  }

  public get troubleshootingData() : TroubleshootingData | undefined {
    return this.strategy.troubleshootingData;
  }

  public set troubleshootingData(v : TroubleshootingData | undefined) {
    this.strategy.troubleshootingData = v;
  }

  constructor(httpClient: IHttpClient, config: IFlagshipConfig, flagshipInstanceId?:string, sharedActionTracking?: ISharedActionTracking) {
    this._flagshipInstanceId = flagshipInstanceId;
    this._hitsPoolQueue = new Map<string, HitAbstract>();
    this._activatePoolQueue = new Map<string, Activate>();
    this._troubleshootingQueue = new Map<string, Troubleshooting>();
    this._analyticHitQueue = new Map<string, UsageHit>();
    this._httpClient = httpClient;
    this._config = config;
    this._sharedActionTracking = sharedActionTracking;
    this.strategy = this.initStrategy();
    this.lookupHits();
  }

  protected initStrategy():BatchingCachingStrategyAbstract {
    let strategy:BatchingCachingStrategyAbstract;
    const argument = {
      config: this.config,
      httpClient: this.httpClient,
      hitsPoolQueue: this._hitsPoolQueue,
      activatePoolQueue: this._activatePoolQueue,
      troubleshootingQueue: this._troubleshootingQueue,
      analyticHitQueue: this._analyticHitQueue,
      flagshipInstanceId: this.flagshipInstanceId,
      initTroubleshootingHit: this.initTroubleshootingHit,
      sharedActionTracking: this._sharedActionTracking
    };
    switch (this.config.trackingManagerConfig?.cacheStrategy) {
      case CacheStrategy.PERIODIC_CACHING:
        strategy = new BatchingPeriodicCachingStrategy(argument);
        break;
      case CacheStrategy.CONTINUOUS_CACHING:
        strategy = new BatchingContinuousCachingStrategy(argument);
        break;
      default:
        strategy = new NoBatchingContinuousCachingStrategy(argument);
        break;
    }
    return strategy;
  }

  public get httpClient():IHttpClient {
    return this._httpClient;
  }

  public get config():IFlagshipConfig {
    return this._config;
  }

  public abstract addHit(hit: HitAbstract): Promise<void>

  public abstract activateFlag (hit: ActivateConstructorParam): Promise<void>

  public abstract sendBatch(): Promise<void>

  public async sendTroubleshootingHit(hit: Troubleshooting) :Promise<void> {
    await this.strategy.sendTroubleshootingHit(hit);
  }

  public startBatchingLoop(): void {
    const timeInterval = (this.config.trackingManagerConfig?.batchIntervals) as number * 1000;

    logInfoSprintf(this.config, TRACKING_MANAGER, BATCH_LOOP_STARTED, timeInterval);

    this._intervalID = setInterval(() => {
      this.batchingLoop();
    }, timeInterval);
  }

  public stopBatchingLoop(): void {
    clearInterval(this._intervalID);
    this._isPooling = false;
    logInfo(this.config, BATCH_LOOP_STOPPED, TRACKING_MANAGER);
  }

  protected async batchingLoop():Promise<void> {
    if (this._isPooling) {
      return;
    }
    this._isPooling = true;
    await this.strategy.sendBatch(BatchTriggeredBy.Timer);
    await this.strategy.sendTroubleshootingQueue();
    await this.strategy.sendUsageHitQueue();
    this._isPooling = false;
  }

  protected checkLookupHitData(item:HitCacheDTO):boolean {
    if (item?.version === 1 && item?.data?.type && item?.data?.content) {
      return true;
    }
    logError(this.config, LOOKUP_HITS_JSON_OBJECT_ERROR, PROCESS_LOOKUP_HIT);
    return false;
  }

  protected async extractHitData(key: string, item:HitCacheDTO):Promise<HitAbstract|undefined> {
    let hit:HitAbstract|undefined;
    switch (item.data.type) {
      case HitType.EVENT:{
        const { Event } = await import('../hit/Event.ts');
        hit = new Event(item.data.content as IEvent);
        break; }
      case HitType.ITEM:{
        const { Item } = await import('../hit/Item.ts');
        hit = new Item(item.data.content as IItem);
        break; }
      case HitType.PAGE:{
        const { Page } = await import('../hit/Page.ts');
        hit = new Page(item.data.content as IPage);
        break; }
      case HitType.SCREEN:{
        const { Screen } = await import('../hit/Screen.ts');
        hit = new Screen(item.data.content as IScreen);
        break; }
      case 'SEGMENT':{
        const { Segment } = await import('../hit/Segment.ts');
        hit = new Segment(item.data.content as ISegment);
        break; }
      case HitType.TRANSACTION:{
        const { Transaction } = await import('../hit/Transaction.ts');
        hit = new Transaction(item.data.content as ITransaction);
        break; }
      default:
    }
    return hit;
  }

  protected async processCachedHits(hitsCache:Record<string, HitCacheDTO>):Promise<void> {
    const checkHitTime = (time:number):boolean => (((Date.now() - time)) <= DEFAULT_HIT_CACHE_TIME_MS);

    const wrongHitKeys:string[] = [];
    const entries = Object.entries(hitsCache);

    for (const [key, item] of entries) {
      if (!this.checkLookupHitData(item) || !checkHitTime(item.data.time)) {
        wrongHitKeys.push(key);
        continue;
      }

      if (item.data.type === 'ACTIVATE') {
        const { Activate } = await import('../hit/Activate.ts');
        const hit = new Activate(item.data.content as IActivate);
        hit.key = key;
        hit.createdAt = item.data.content.createdAt;
        hit.config = this.config;
        this._activatePoolQueue.set(key, hit as Activate);
        continue;
      }

      const hit = await this.extractHitData(key, item);
      if (!hit) {
        wrongHitKeys.push(key);
        continue;
      }
      hit.key = key;
      hit.createdAt = item.data.content.createdAt;
      hit.config = this.config;
      this._hitsPoolQueue.set(key, hit);
    }

    if (wrongHitKeys.length) {
      await this.strategy.flushHits(wrongHitKeys);
    }
  }

  async lookupHits():Promise<void> {
    try {
      const hitCacheImplementation = this.config.hitCacheImplementation;

      if (this.config.disableCache || !hitCacheImplementation || typeof hitCacheImplementation.lookupHits !== 'function') {
        return;
      }

      const hitsCache = await hitCacheImplementation.lookupHits();

      logDebugSprintf(this.config, PROCESS_CACHE, HIT_CACHE_LOADED, hitsCache);

      if (!hitsCache || !Object.keys(hitsCache).length) {
        return;
      }

      await this.processCachedHits(hitsCache);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logErrorSprintf(this.config, PROCESS_CACHE, HIT_CACHE_ERROR, 'lookupHits', error.message || error);
    }
  }

  async sendUsageHit(hit: UsageHit): Promise<void> {
    await this.strategy.sendUsageHit(hit);
  }

  async addTroubleshootingHit(hit: Troubleshooting): Promise<void> {
    await this.strategy.addTroubleshootingHit(hit);
  }
}
