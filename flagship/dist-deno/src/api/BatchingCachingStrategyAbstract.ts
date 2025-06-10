import { DecisionMode, IFlagshipConfig } from '../config/index.ts';
import { BatchTriggeredBy } from '../enum/BatchTriggeredBy.ts';
import { ACTIVATE_ADDED_IN_QUEUE, ADD_ACTIVATE, BATCH_MAX_SIZE, DEFAULT_HIT_CACHE_TIME_MS, FS_CONSENT, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HitType, HIT_ADDED_IN_QUEUE, HIT_CACHE_VERSION, HIT_DATA_FLUSHED, HIT_EVENT_URL, LogLevel, PROCESS_CACHE_HIT, PROCESS_FLUSH_HIT, SDK_APP, SDK_INFO, SEND_BATCH, TROUBLESHOOTING_HIT_URL, TROUBLESHOOTING_HIT_ADDED_IN_QUEUE, ADD_TROUBLESHOOTING_HIT, TROUBLESHOOTING_SENT_SUCCESS, SEND_TROUBLESHOOTING, ALL_HITS_FLUSHED, HIT_CACHE_ERROR, HIT_CACHE_SAVED, PROCESS_CACHE, TRACKING_MANAGER, HIT_SENT_SUCCESS, BATCH_HIT, TRACKING_MANAGER_ERROR, USAGE_HIT_URL, ANALYTICS_HIT_SENT_SUCCESS as USAGE_HIT_SENT_SUCCESS, SEND_USAGE_HIT, ANALYTICS_HIT_ADDED_IN_QUEUE as USAGE_HIT_ADDED_IN_QUEUE, ADD_USAGE_HIT } from '../enum/index.ts';
import {  Activate } from '../hit/Activate.ts';
import { type UsageHit } from '../hit/UsageHit.ts';
import { Troubleshooting } from '../hit/Troubleshooting.ts';
import { EventCategory } from '../hit/index.ts';
import { HitCacheDTO, IExposedFlag, IExposedVisitor, TroubleshootingData, TroubleshootingLabel } from '../types.ts';
import { IHttpClient } from '../utils/HttpClient.ts';
import { errorFormat, isBrowser, logDebug, logDebugSprintf, logError, logErrorSprintf, sprintf, uuidV4 } from '../utils/utils.ts';
import { ITrackingManagerCommon } from './ITrackingManagerCommon.ts';
import type { BatchingCachingStrategyConstruct, SendActivate } from './types';
import { ISharedActionTracking } from '../sharedFeature/ISharedActionTracking.ts';
import { ActivateConstructorParam, IHitAbstract, LocalActionTracking } from '../type.local.ts';
import { type HitAbstract } from '../hit/HitAbstract.ts';
import { type Event } from '../hit/Event.ts';
import { Batch } from '../hit/Batch.ts';

export abstract class BatchingCachingStrategyAbstract implements ITrackingManagerCommon {
  protected _config : IFlagshipConfig;
  protected _hitsPoolQueue: Map<string, HitAbstract>;
  protected _activatePoolQueue: Map<string, Activate>;
  protected _httpClient: IHttpClient;
  protected _troubleshootingQueue: Map<string, Troubleshooting>;
  protected _usageHitQueue: Map<string, UsageHit>;
  protected _flagshipInstanceId?: string;
  protected _isUsageHitQueueSending: boolean;
  protected _isTroubleshootingQueueSending: boolean;
  private _HitsToFsQa:HitAbstract[];
  private _sendFsHitToQATimeoutId?:NodeJS.Timeout;
  private _troubleshootingData? : TroubleshootingData;
  private _initTroubleshootingHit?: Troubleshooting;
  private _hasInitTroubleshootingHitSent: boolean;
  protected _sharedActionTracking?: ISharedActionTracking;

  public get flagshipInstanceId(): string|undefined {
    return this._flagshipInstanceId;
  }

  public get troubleshootingData() : TroubleshootingData|undefined {
    return this._troubleshootingData;
  }

  public set troubleshootingData(v : TroubleshootingData|undefined) {
    this._troubleshootingData = v;
  }

  public get config() : IFlagshipConfig {
    return this._config;
  }

  public get initTroubleshootingHit() : Troubleshooting|undefined {
    return this._initTroubleshootingHit;
  }

  public set initTroubleshootingHit(v : Troubleshooting|undefined) {
    this._initTroubleshootingHit = v;
  }

  constructor(param: BatchingCachingStrategyConstruct) {
    const {
      config, hitsPoolQueue, httpClient, activatePoolQueue, troubleshootingQueue, flagshipInstanceId,
      analyticHitQueue, initTroubleshootingHit: initTroubleshootingHi, sharedActionTracking
    } = param;
    this._HitsToFsQa = [];
    this._hasInitTroubleshootingHitSent = false;
    this._config = config;
    this._hitsPoolQueue = hitsPoolQueue;
    this._httpClient = httpClient;
    this._activatePoolQueue = activatePoolQueue;
    this._troubleshootingQueue = troubleshootingQueue;
    this._flagshipInstanceId = flagshipInstanceId;
    this._usageHitQueue = analyticHitQueue;
    this._isUsageHitQueueSending = false;
    this._isTroubleshootingQueueSending = false;
    this._initTroubleshootingHit = initTroubleshootingHi;
    this._sharedActionTracking = sharedActionTracking;
  }

  protected dispatchHitsToTag(hits: HitAbstract[]): void {
    if (__fsWebpackIsBrowser__) {
      if (!isBrowser()) {
        return;
      }
      const actionTrackingHits:LocalActionTracking[] = [];

      for (const hit of hits) {
        if (hit.type === HitType.EVENT &&
        (hit as Event).category === EventCategory.ACTION_TRACKING &&
        !(hit as Event).isActionTrackingHit) {
          const eventHit = hit as Event;
          actionTrackingHits.push({
            visitorId: eventHit.visitorId,
            createdAt: eventHit.createdAt,
            anonymousId: eventHit.anonymousId,
            data: {
              ec: eventHit.category as EventCategory.ACTION_TRACKING,
              ea: eventHit.action,
              el: eventHit.label,
              ev: eventHit.value
            }
          });
        }
      }
      if (actionTrackingHits.length) {
        this._sharedActionTracking?.dispatchEventHits(actionTrackingHits);
      }
    }
  }

  public sendHitsToFsQa(hits: HitAbstract[]):void {
    if (__fsWebpackIsBrowser__) {
      if (!isBrowser() || !this.config.isQAModeEnabled) {
        return;
      }
      import('../qaAssistant/messages/index.ts').then((message) => {

        this._HitsToFsQa.push(...hits);
        const BATCH_SIZE = 10;
        const DELAY = 3000;

        if (this._HitsToFsQa.length >= BATCH_SIZE) {
          message.sendFsHitToQA(this._HitsToFsQa.map(item => item.toApiKeys()));
          this._HitsToFsQa = [];
        }

        if (this._sendFsHitToQATimeoutId) {
          clearTimeout(this._sendFsHitToQATimeoutId);
        }

        if (!this._HitsToFsQa.length) {
          return;
        }

        this._sendFsHitToQATimeoutId = setTimeout(() => {
          message.sendFsHitToQA(this._HitsToFsQa.map(item => item.toApiKeys()));
          this._HitsToFsQa = [];
        }, DELAY);
      });
    }
  }

  public abstract addHitInPoolQueue (hit: HitAbstract):Promise<void>

  protected abstract sendActivate ({ activateHitsPool, currentActivate, batchTriggeredBy }:SendActivate): Promise<void>

  public async addHit(hit: HitAbstract): Promise<void> {
    const hitKey = `${hit.visitorId}:${uuidV4()}`;
    hit.key = hitKey;

    await this.addHitInPoolQueue(hit);

    if (hit.type === HitType.EVENT && (hit as Event).action === FS_CONSENT && (hit as Event).label === `${SDK_INFO.name}:false`) {
      await this.notConsent(hit.visitorId);
    }

    logDebugSprintf(this.config, TRACKING_MANAGER, HIT_ADDED_IN_QUEUE, hit.toApiKeys());

    if (this.config.trackingManagerConfig?.poolMaxSize &&
      this._hitsPoolQueue.size >= this.config.trackingManagerConfig.poolMaxSize &&
      this.config.decisionMode !== DecisionMode.BUCKETING_EDGE
    ) {
      this.sendBatch();
    }
  }

  async activateFlag(paramHit: ActivateConstructorParam):Promise<void> {
    const hit = new Activate(paramHit);
    hit.config = this.config;
    const hitKey = `${hit.visitorId}:${uuidV4()}`;
    hit.key = hitKey;

    if (this.config.decisionMode === DecisionMode.BUCKETING_EDGE) {
      await this.activateFlagEdgeMode(hit);
      logDebug(this.config, sprintf(ACTIVATE_ADDED_IN_QUEUE, JSON.stringify(hit.toApiKeys())), ADD_ACTIVATE);
      return;
    }

    let activateHitsPool:Activate[] = [];
    if (this._activatePoolQueue.size) {
      activateHitsPool = Array.from(this._activatePoolQueue.values());
    }
    this._activatePoolQueue.clear();

    await this.sendActivate({
      activateHitsPool,
      currentActivate: hit,
      batchTriggeredBy: BatchTriggeredBy.ActivateLength
    });
  }

  protected async activateFlagEdgeMode(hit: Activate): Promise<void> {
    this._activatePoolQueue.set(hit.key, hit);
    await this.cacheHit(new Map<string, HitAbstract>([[hit.key, hit]]));
  }

  protected onVisitorExposed(activate: Activate):void {
    const onVisitorExposed = this.config.onVisitorExposed;
    if (typeof onVisitorExposed !== 'function') {
      return;
    }

    const fromFlag : IExposedFlag = {
      key: activate.flagKey,
      value: activate.flagValue,
      defaultValue: activate.flagDefaultValue,
      metadata: activate.flagMetadata
    };

    const exposedVisitor: IExposedVisitor = {
      id: activate.visitorId,
      anonymousId: activate.anonymousId,
      context: activate.visitorContext
    };
    onVisitorExposed({
      exposedVisitor,
      fromFlag
    });
  }

  async sendBatch(batchTriggeredBy = BatchTriggeredBy.BatchLength): Promise<void> {
    if (this._activatePoolQueue.size) {
      const activateHits = Array.from(this._activatePoolQueue.values());
      this._activatePoolQueue.clear();
      await this.sendActivate({
        activateHitsPool: activateHits,
        batchTriggeredBy
      });
    }

    const batch = new Batch({
      hits: [],
      ds: SDK_APP
    });
    batch.config = this.config;

    const hitKeysToRemove:string[] = [];

    for (const [key, item] of this._hitsPoolQueue) {
      if ((Date.now() - item.createdAt) >= DEFAULT_HIT_CACHE_TIME_MS) {
        hitKeysToRemove.push(key);
        continue;
      }
      const batchSize = JSON.stringify(batch).length;
      if (batchSize > BATCH_MAX_SIZE) {
        break;
      }
      batch.hits.push(item);
      hitKeysToRemove.push(key);
    }

    hitKeysToRemove.forEach(key => {
      this._hitsPoolQueue.delete(key);
    });

    if (!batch.hits.length) {
      return;
    }

    const headers = { [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON };

    const requestBody = batch.toApiKeys();

    const now = Date.now();
    try {
      await this._httpClient.postAsync(HIT_EVENT_URL, {
        headers,
        body: requestBody,
        timeout: this.config.timeout,
        nextFetchConfig: this.config.nextFetchConfig
      });

      logDebugSprintf(this.config, TRACKING_MANAGER, HIT_SENT_SUCCESS, BATCH_HIT, {
        url: HIT_EVENT_URL,
        body: requestBody,
        headers,
        nextFetchConfig: this.config.nextFetchConfig,
        duration: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy[batchTriggeredBy]
      });

      await this.flushHits(hitKeysToRemove);

      this.sendHitsToFsQa(batch.hits);

      this.dispatchHitsToTag(batch.hits);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      batch.hits.forEach((hit) => {
        this._hitsPoolQueue.set(hit.key, hit);
      });

      logErrorSprintf(this.config, TRACKING_MANAGER, TRACKING_MANAGER_ERROR, BATCH_HIT, {
        httpRequestBody: requestBody,
        httpRequestHeaders: headers,
        httpRequestMethod: 'POST',
        httpRequestUrl: HIT_EVENT_URL,
        httpResponseBody: error?.message,
        httpResponseHeaders: error?.headers,
        httpResponseCode: error?.statusCode,
        duration: Date.now() - now,
        batchTriggeredBy: BatchTriggeredBy[batchTriggeredBy]
      });


      const monitoringHttpResponse = new Troubleshooting({
        label: TroubleshootingLabel.SEND_BATCH_HIT_ROUTE_RESPONSE_ERROR,
        logLevel: LogLevel.ERROR,
        visitorId: `${this._flagshipInstanceId}`,
        flagshipInstanceId: this._flagshipInstanceId,
        traffic: 0,
        config: this.config,
        httpRequestBody: batch.hits,
        httpRequestHeaders: headers,
        httpResponseBody: error?.message,
        httpResponseHeaders: error?.headers,
        httpResponseMethod: 'POST',
        httpResponseUrl: HIT_EVENT_URL,
        httpResponseCode: error?.statusCode,
        httpResponseTime: Date.now() - now,
        batchTriggeredBy
      });

      this.sendTroubleshootingHit(monitoringHttpResponse);

    }
  }

  async notConsent(visitorId: string):Promise<void> {
    const hitKeys = Array.from(this._hitsPoolQueue).filter(([, item]) => {
      return (item?.type !== HitType.EVENT || (item as Event)?.action !== FS_CONSENT) && (item.visitorId === visitorId || item.anonymousId === visitorId);
    });


    const activateKeys = Array.from(this._activatePoolQueue).filter(([, item]) => {
      return item.visitorId === visitorId || item.anonymousId === visitorId;
    });

    const keysToFlush:string[] = [];
    hitKeys.forEach(([key]) => {
      this._hitsPoolQueue.delete(key);
      keysToFlush.push(key);
    });

    activateKeys.forEach(([key]) => {
      this._activatePoolQueue.delete(key);
      keysToFlush.push(key);
    });

    if (!keysToFlush.length) {
      return;
    }
    await this.flushHits(keysToFlush);
  }

  protected async cacheHit(hits:Map<string, HitAbstract>):Promise<void> {
    try {
      const hitCacheImplementation = this.config.hitCacheImplementation;
      if (this.config.disableCache || !hitCacheImplementation || typeof hitCacheImplementation.cacheHit !== 'function') {
        return;
      }

      const data : Record<string, HitCacheDTO> = {};

      hits.forEach((item, key) => {
        const hitData: HitCacheDTO = {
          version: HIT_CACHE_VERSION,
          data: {
            visitorId: item.visitorId,
            anonymousId: item.anonymousId,
            type: item.type,
            content: item.toObject() as unknown as IHitAbstract,
            time: Date.now()
          }
        };
        data[key] = hitData;
      });

      await hitCacheImplementation.cacheHit(data);
      logDebugSprintf(this.config, PROCESS_CACHE_HIT, HIT_CACHE_SAVED, data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logErrorSprintf(this.config, PROCESS_CACHE, HIT_CACHE_ERROR, 'cacheHit', error.message || error);
    }
  }

  public async flushHits(hitKeys:string[]): Promise<void> {
    try {
      const hitCacheImplementation = this.config.hitCacheImplementation;
      if (this.config.disableCache || !hitCacheImplementation || typeof hitCacheImplementation.flushHits !== 'function') {
        return;
      }

      await hitCacheImplementation.flushHits(hitKeys);
      logDebugSprintf(this.config, PROCESS_CACHE, HIT_DATA_FLUSHED, hitKeys);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logErrorSprintf(this.config, PROCESS_CACHE, HIT_CACHE_ERROR, 'flushHits', error.message || error);
    }
  }

  public async flushAllHits(): Promise<void> {
    try {
      const hitCacheImplementation = this.config.hitCacheImplementation;
      if (this.config.disableCache || !hitCacheImplementation || typeof hitCacheImplementation.flushAllHits !== 'function') {
        return;
      }
      await hitCacheImplementation.flushAllHits();
      logDebug(this.config, ALL_HITS_FLUSHED, PROCESS_FLUSH_HIT);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logErrorSprintf(this.config, PROCESS_CACHE, HIT_CACHE_ERROR, 'flushAllHits', error.message || error);
    }
  }

  // #region Troubleshooting

  protected isTroubleshootingActivated():boolean {
    if (!this.troubleshootingData) {
      return false;
    }

    const now = new Date();

    const isStarted = now >= this.troubleshootingData.startDate;
    if (!isStarted) {
      return false;
    }

    const isFinished = now > this.troubleshootingData.endDate;
    if (isFinished) {
      this._hasInitTroubleshootingHitSent = false;
      return false;
    }
    return true;
  }

  public async addTroubleshootingHit(hit: Troubleshooting): Promise<void> {
    if (!hit.key) {
      const hitKey = `${hit.visitorId}:${uuidV4()}`;
      hit.key = hitKey;
    }
    this._troubleshootingQueue.set(hit.key, hit);
    logDebug(this.config, sprintf(TROUBLESHOOTING_HIT_ADDED_IN_QUEUE, JSON.stringify(hit.toApiKeys())), ADD_TROUBLESHOOTING_HIT);
  }

  public async sendTroubleshootingHit(hit: Troubleshooting): Promise<void> {
    if (!this.isTroubleshootingActivated() || hit.traffic === undefined || (this.troubleshootingData as TroubleshootingData).traffic < hit.traffic) {
      return;
    }
    const requestBody = hit.toApiKeys();
    const now = Date.now();
    try {
      await this._httpClient.postAsync(TROUBLESHOOTING_HIT_URL, { body: requestBody });
      logDebug(this.config, sprintf(TROUBLESHOOTING_SENT_SUCCESS, JSON.stringify({
        ...requestBody,
        duration: Date.now() - now
      })), SEND_TROUBLESHOOTING);

      if (hit.key) {
        this._troubleshootingQueue.delete(hit.key);
        await this.flushHits([hit.key]);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      if (this.isTroubleshootingActivated()) {
        await this.addTroubleshootingHit(hit);
      }
      logError(this.config, errorFormat(error.message || error, {
        url: TROUBLESHOOTING_HIT_URL,
        headers: {},
        body: requestBody,
        duration: Date.now() - now
      }), SEND_BATCH);
    }
  }

  protected async sendInitTroubleshootingHit(): Promise<void> {
    if (!this.isTroubleshootingActivated() || !this._initTroubleshootingHit || this._hasInitTroubleshootingHitSent) {
      return;
    }

    await this.sendTroubleshootingHit(this._initTroubleshootingHit);
    this._hasInitTroubleshootingHitSent = true;
  }

  public async sendTroubleshootingQueue(): Promise<void> {
    await this.sendInitTroubleshootingHit();

    if (!this.isTroubleshootingActivated() || this._isTroubleshootingQueueSending || this._troubleshootingQueue.size === 0) {
      return;
    }

    this._isTroubleshootingQueueSending = true;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [_, item] of Array.from(this._troubleshootingQueue)) {
      await this.sendTroubleshootingHit(item);
    }
    this._isTroubleshootingQueueSending = false;
  }

  // #endregion

  // #region Analytic hit
  protected async addUsageHit(hit: UsageHit): Promise<void> {
    if (!hit.key) {
      const hitKey = `${hit.visitorId}:${uuidV4()}`;
      hit.key = hitKey;
    }
    this._usageHitQueue.set(hit.key, hit);
    logDebug(this.config, sprintf(USAGE_HIT_ADDED_IN_QUEUE, JSON.stringify(hit.toApiKeys())), ADD_USAGE_HIT);
  }

  public async sendUsageHit(hit: UsageHit): Promise<void> {
    const requestBody = hit.toApiKeys();
    const now = Date.now();
    try {
      await this._httpClient.postAsync(USAGE_HIT_URL, { body: requestBody });
      logDebug(this.config, sprintf(USAGE_HIT_SENT_SUCCESS, JSON.stringify({
        ...requestBody,
        duration: Date.now() - now
      })), SEND_USAGE_HIT);

      if (hit.key) {
        this._usageHitQueue.delete(hit.key);
        await this.flushHits([hit.key]);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      await this.addUsageHit(hit);
      logError(this.config, errorFormat(error.message || error, {
        url: USAGE_HIT_URL,
        headers: {},
        body: requestBody,
        duration: Date.now() - now
      }), SEND_BATCH);
    }
  }

  public async sendUsageHitQueue(): Promise<void> {
    if (this._isUsageHitQueueSending || this._usageHitQueue.size === 0) {
      return;
    }

    this._isUsageHitQueueSending = true;
    for (const [, item] of Array.from(this._usageHitQueue)) {
      await this.sendUsageHit(item);
    }
    this._isUsageHitQueueSending = false;
  }

  // #endregion
}
