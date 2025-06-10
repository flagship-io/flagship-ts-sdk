import { EventCategory } from '../hit/index.ts';
import { primitive, IHit, VisitorCacheDTO, IFSFlagMetadata, TroubleshootingLabel, VisitorCacheStatus, CampaignDTO, EAIScore } from '../types.ts';
import { IVisitor } from './IVisitor.ts';
import { VisitorAbstract } from './VisitorAbstract.ts';
import { DecisionMode, IConfigManager, IFlagshipConfig } from '../config/index.ts';
import { IDecisionManager } from '../decision/IDecisionManager.ts';
import { logDebugSprintf, logError, logErrorSprintf, logInfoSprintf, sprintf } from '../utils/utils.ts';
import { VISITOR_CACHE_ERROR, CONSENT_CHANGED, FS_CONSENT, LOOKUP_VISITOR_JSON_OBJECT_ERROR, PROCESS_CACHE, PROCESS_SET_CONSENT, SDK_APP, SDK_INFO, TRACKER_MANAGER_MISSING_ERROR, VISITOR_CACHE_VERSION, VISITOR_CACHE_FLUSHED, VISITOR_CACHE_LOADED, VISITOR_CACHE_SAVED, LogLevel, ANALYTIC_HIT_ALLOCATION } from '../enum/index.ts';
import { BatchDTO } from '../hit/Batch.ts';
import { ITrackingManager } from '../api/ITrackingManager.ts';
import { Troubleshooting } from '../hit/Troubleshooting.ts';
import { MurmurHash } from '../utils/MurmurHash.ts';
import { UsageHit } from '../hit/UsageHit.ts';
import { GetFlagMetadataParam, GetFlagValueParam, VisitorExposedParam } from '../type.local.ts';
import { IVisitorEvent } from '../emotionAI/hit/IVisitorEvent.ts';
import { IPageView } from '../emotionAI/hit/IPageView.ts';
import { type HitAbstract } from '../hit/HitAbstract.ts';
import { DefaultHitCache } from '../cache/DefaultHitCache.ts';
import { DefaultVisitorCache } from '../cache/DefaultVisitorCache.ts';
import { IVisitorCacheImplementation } from '../cache/IVisitorCacheImplementation.ts';
import { Event } from '../hit/Event.ts';
export const LOOKUP_HITS_JSON_ERROR = 'JSON DATA must be an array of object';
export const LOOKUP_HITS_JSON_OBJECT_ERROR = 'JSON DATA must fit the type HitCacheDTO';

export const VISITOR_ID_MISMATCH_ERROR = 'Visitor ID mismatch: {0} vs {1}';

export type StrategyAbstractConstruct = {
  visitor:VisitorAbstract,
  murmurHash: MurmurHash
}
export abstract class StrategyAbstract implements Omit<IVisitor, 'visitorId'|'anonymousId'| 'flagsStatus'|'flagsData'|'context'|'hasConsented'|'getFlagsDataArray'|'getFlag'|'getFlags'|'cleanup'> {
  protected visitor:VisitorAbstract;

  protected get configManager():IConfigManager {
    return this.visitor.configManager;
  }

  protected get trackingManager():ITrackingManager {
    return this.configManager.trackingManager;
  }

  protected get decisionManager():IDecisionManager {
    return this.configManager.decisionManager;
  }

  public get config():IFlagshipConfig {
    return this.visitor.config;
  }

  protected _murmurHash: MurmurHash;

  public constructor(param: StrategyAbstractConstruct) {
    const { visitor, murmurHash } = param;
    this.visitor = visitor;
    this._murmurHash = murmurHash;
  }

  collectEAIEventsAsync(currentPage?: Omit<IPageView, 'toApiKeys'>): Promise<void> {
    return this.visitor.emotionAi.collectEAIEventsAsync(currentPage);
  }

  reportEaiVisitorEvent(event: IVisitorEvent):void {
    if (__fsWebpackIsBrowser__ || __fsWebpackIsReactNative__) {
      import('../emotionAI/hit/VisitorEvent.ts').then(({ VisitorEvent }) => {
        this.visitor.emotionAi.reportVisitorEvent(new VisitorEvent(event));
      });
    }
  }

  reportEaiPageView(pageView: IPageView):void {
    if (__fsWebpackIsBrowser__ || __fsWebpackIsReactNative__) {
      import('../emotionAI/hit/PageView.ts').then(({ PageView }) => {
        this.visitor.emotionAi.reportPageView(new PageView(pageView));
      });
    }
  }

  onEAICollectStatusChange(callback: (status: boolean) => void):void {
    this.visitor.emotionAi.onEAICollectStatusChange(callback);
  }

  cleanup():void {
    this.visitor.emotionAi.cleanup();
  }

  public updateCampaigns(campaigns:CampaignDTO[]):void {
    try {
      this.visitor.campaigns = campaigns;
      this.visitor.flagsData = this.decisionManager.getModifications(campaigns);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logError(this.config, error.message || error, 'updateCampaigns');
    }
  }

  protected hasTrackingManager(process: string): boolean {
    const check = this.trackingManager;
    if (!check) {
      logError(this.config, sprintf(TRACKER_MANAGER_MISSING_ERROR), process);
    }
    return !!check;
  }

  setConsent(hasConsented: boolean): void {
    const method = 'setConsent';
    this.visitor.hasConsented = hasConsented;
    if (!hasConsented) {
      this.flushVisitor();
    }
    if (!this.hasTrackingManager(method)) {
      return;
    }


    const consentHit = new Event({
      visitorId: this.visitor.visitorId,
      anonymousId: this.visitor.anonymousId,
      label: `${SDK_INFO.name}:${this.visitor.hasConsented}`,
      action: FS_CONSENT,
      category: EventCategory.USER_ENGAGEMENT
    });

    consentHit.qaMode = this.config.isQAModeEnabled;

    consentHit.ds = SDK_APP;
    consentHit.config = this.config;
    this.trackingManager.addHit(consentHit);


    const hitTroubleshooting = new Troubleshooting({

      label: TroubleshootingLabel.VISITOR_SEND_HIT,
      logLevel: LogLevel.INFO,
      traffic: this.visitor.traffic || 0,
      visitorId: this.visitor.visitorId,
      visitorSessionId: this.visitor.instanceId,
      flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
      anonymousId: this.visitor.anonymousId,
      config: this.config,
      hitContent: consentHit.toApiKeys()
    });

    if (this.decisionManager.troubleshooting) {
      this.trackingManager.sendTroubleshootingHit(hitTroubleshooting);
      return;
    }

    this.visitor.consentHitTroubleshooting = hitTroubleshooting;



    logDebugSprintf(this.config, PROCESS_SET_CONSENT, CONSENT_CHANGED, this.visitor.visitorId, hasConsented);
  }

  protected checKLookupVisitorDataV1(item:VisitorCacheDTO):boolean {
    if (!item || !item.data || !item.data.visitorId) {
      return false;
    }
    const campaigns = item.data.campaigns;
    if (!campaigns) {
      return true;
    }
    if (!Array.isArray(campaigns)) {
      return false;
    }
    if ((this.visitor.visitorCacheStatus === VisitorCacheStatus.VISITOR_ID_CACHE || this.visitor.visitorCacheStatus === VisitorCacheStatus.VISITOR_ID_CACHE_WITH_ANONYMOUS_ID_CACHE) && item.data.visitorId !== this.visitor.visitorId) {
      logInfoSprintf(this.config, PROCESS_CACHE, VISITOR_ID_MISMATCH_ERROR, item.data.visitorId, this.visitor.visitorId);
      return false;
    }
    if (this.visitor.visitorCacheStatus === VisitorCacheStatus.ANONYMOUS_ID_CACHE && item.data.visitorId !== this.visitor.anonymousId) {
      logInfoSprintf(this.config, PROCESS_CACHE, VISITOR_ID_MISMATCH_ERROR, item.data.visitorId, this.visitor.anonymousId);
      return false;
    }
    return campaigns.every(x => x.campaignId && x.type && x.variationGroupId && x.variationId);
  }

  protected checKLookupVisitorData(item:VisitorCacheDTO):boolean {
    if (item.version === 1) {
      return this.checKLookupVisitorDataV1(item);
    }
    return false;
  }

  private async tryLookupCache(id: string): Promise<VisitorCacheDTO | null> {
    const visitorCacheInstance = this.config.visitorCacheImplementation;
    if (!visitorCacheInstance || typeof visitorCacheInstance.lookupVisitor !== 'function') {
      return null;
    }
    return await visitorCacheInstance.lookupVisitor(id);
  }

  private processValidCache(visitorCache: VisitorCacheDTO): boolean {
    if (!this.checKLookupVisitorData(visitorCache)) {
      logErrorSprintf(this.config, PROCESS_CACHE, LOOKUP_VISITOR_JSON_OBJECT_ERROR, VISITOR_CACHE_VERSION, this.visitor.visitorId);
      return false;
    }

    this.visitor.visitorCache = visitorCache;
    return true;
  }

  public async lookupVisitor(): Promise<void> {
    try {
      if (this.config.disableCache || this.visitor.visitorCache) {
        return;
      }

      this.visitor.visitorCacheStatus = VisitorCacheStatus.NONE;
      let visitorCache = await this.tryLookupCache(this.visitor.visitorId);

      if (visitorCache) {
        this.visitor.visitorCacheStatus = VisitorCacheStatus.VISITOR_ID_CACHE;
      } else if (this.visitor.anonymousId) {
        visitorCache = await this.tryLookupCache(this.visitor.anonymousId);
        if (visitorCache) {
          this.visitor.visitorCacheStatus = VisitorCacheStatus.ANONYMOUS_ID_CACHE;
        }
      }

      logDebugSprintf(this.config, PROCESS_CACHE, VISITOR_CACHE_LOADED, this.visitor.visitorId, visitorCache);

      if (!visitorCache || !this.processValidCache(visitorCache)) {
        return;
      }

      if (this.visitor.visitorCacheStatus === VisitorCacheStatus.VISITOR_ID_CACHE && this.visitor.anonymousId) {
        const anonymousVisitorCache = await this.tryLookupCache(this.visitor.anonymousId);
        if (anonymousVisitorCache) {
          this.visitor.visitorCacheStatus = VisitorCacheStatus.VISITOR_ID_CACHE_WITH_ANONYMOUS_ID_CACHE;
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logErrorSprintf(this.config, PROCESS_CACHE, VISITOR_CACHE_ERROR, this.visitor.visitorId, 'lookupVisitor', error.message || error);
    }
  }

  protected createVisitorCacheDTO(eAIScore?: EAIScore, isEAIDataCollected?: boolean): VisitorCacheDTO {
    const assignmentsHistory: Record<string, string> = {};
    const visitorCacheDTO: VisitorCacheDTO = {
      version: VISITOR_CACHE_VERSION,
      data: {
        visitorId: this.visitor.visitorId,
        anonymousId: this.visitor.anonymousId,
        consent: this.visitor.hasConsented,
        context: this.visitor.context,
        eAIScore: this.visitor.visitorCache?.data?.eAIScore || eAIScore,
        isEAIDataCollected: this.visitor.visitorCache?.data?.isEAIDataCollected || isEAIDataCollected,
        campaigns: this.visitor.campaigns.map(campaign => {
          assignmentsHistory[campaign.variationGroupId] = campaign.variation.id;
          return {
            campaignId: campaign.id,
            slug: campaign.slug,
            variationGroupId: campaign.variationGroupId,
            variationId: campaign.variation.id,
            isReference: campaign.variation.reference,
            type: campaign.variation.modifications.type,
            activated: false,
            flags: campaign.variation.modifications.value
          };
        })
      }
    };

    visitorCacheDTO.data.assignmentsHistory = {
      ...this.visitor.visitorCache?.data?.assignmentsHistory,
      ...assignmentsHistory
    };
    return visitorCacheDTO;
  }

  protected async cacheAnonymousVisitor(visitorCacheInstance: IVisitorCacheImplementation, visitorCacheDTO: VisitorCacheDTO): Promise<void> {
    const visitorCacheStatus = this.visitor.visitorCacheStatus;
    if (this.visitor.anonymousId && (visitorCacheStatus === VisitorCacheStatus.NONE || visitorCacheStatus === VisitorCacheStatus.VISITOR_ID_CACHE)) {
      const anonymousVisitorCacheDTO: VisitorCacheDTO = {
        ...visitorCacheDTO,
        data: {
          ...visitorCacheDTO.data,
          visitorId: this.visitor.anonymousId,
          anonymousId: null
        }
      };
      await visitorCacheInstance.cacheVisitor(this.visitor.anonymousId, anonymousVisitorCacheDTO);
    }
  }

  public async cacheVisitor(eAIScore?: EAIScore, isEAIDataCollected?: boolean): Promise<void> {
    try {
      const visitorCacheInstance = this.config.visitorCacheImplementation;

      if (this.config.disableCache || !visitorCacheInstance || typeof visitorCacheInstance.cacheVisitor !== 'function') {
        return;
      }

      const visitorCacheDTO = this.createVisitorCacheDTO(eAIScore, isEAIDataCollected);
      await visitorCacheInstance.cacheVisitor(this.visitor.visitorId, visitorCacheDTO);
      await this.cacheAnonymousVisitor(visitorCacheInstance, visitorCacheDTO);

      logDebugSprintf(this.config, PROCESS_CACHE, VISITOR_CACHE_SAVED, this.visitor.visitorId, visitorCacheDTO);
      this.visitor.visitorCache = visitorCacheDTO;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logErrorSprintf(this.config, PROCESS_CACHE, VISITOR_CACHE_ERROR, this.visitor.visitorId, 'cacheVisitor', error.message || error);
    }
  }

  protected async flushVisitor():Promise<void> {
    try {
      const visitorCacheInstance = this.config.visitorCacheImplementation;
      if (this.config.disableCache || !visitorCacheInstance || typeof visitorCacheInstance.flushVisitor !== 'function') {
        return;
      }
      await visitorCacheInstance.flushVisitor(this.visitor.visitorId);

      logDebugSprintf(this.config, PROCESS_CACHE, VISITOR_CACHE_FLUSHED, this.visitor.visitorId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logErrorSprintf(this.config, PROCESS_CACHE, VISITOR_CACHE_ERROR, this.visitor.visitorId, 'flushVisitor', error.message || error);
    }
  }

  public addInTrackingManager(hit: HitAbstract): Promise<void> {
    return this.trackingManager.addHit(hit);
  }

    abstract updateContext(key: string, value: primitive):void
    abstract updateContext(context: Record<string, primitive>): void
    abstract updateContext (context: Record<string, primitive> | string, value?:primitive): void
    abstract clearContext (): void

    abstract sendHit(hit: HitAbstract): Promise<void>;
    abstract sendHit(hit: IHit): Promise<void>;
    abstract sendHit(hit: IHit | HitAbstract |BatchDTO): Promise<void>;

    abstract sendHits(hit: HitAbstract[]): Promise<void>;
    abstract sendHits(hit: IHit[]): Promise<void>;
    abstract sendHits (hits: HitAbstract[] | IHit[]|BatchDTO[]): Promise<void>

    abstract authenticate(visitorId: string): void
    abstract unauthenticate(): void

    abstract fetchFlags(): Promise<void>
    abstract visitorExposed (param:VisitorExposedParam): Promise<void>
    abstract getFlagValue<T>(param:GetFlagValueParam<T>):T extends null ? unknown : T
    abstract getFlagMetadata(param:GetFlagMetadataParam):IFSFlagMetadata

    public async sendTroubleshootingHit(hit: Troubleshooting):Promise<void> {
      await this.trackingManager.sendTroubleshootingHit(hit);
    }

    public async sendUsageHit(hit: UsageHit): Promise<void> {
      if (this.config.disableDeveloperUsageTracking) {
        return;
      }
      const traffic = this.visitor.analyticTraffic;

      if (traffic > ANALYTIC_HIT_ALLOCATION) {
        return;
      }

      return this.trackingManager.sendUsageHit(hit);
    }

    public getCurrentDateTime(): Date {
      return new Date();
    }

    protected getSdkConfigDecisionMode():DecisionMode.BUCKETING | DecisionMode.BUCKETING_EDGE | 'DECISION_API' | undefined {
      return this.config.decisionMode === DecisionMode.DECISION_API ? 'DECISION_API' : this.config.decisionMode;
    }

    public async sendSdkConfigAnalyticHit():Promise<void> {
      if (this.config.disableDeveloperUsageTracking) {
        return;
      }

      const hitCacheImplementation = this.config.hitCacheImplementation;
      const visitorCacheImplementation = this.config.visitorCacheImplementation;
      let sdkConfigUsingCustomHitCache = false;
      let sdkConfigUsingCustomVisitorCache = false;

      if (__fsWebpackIsBrowser__) {
        sdkConfigUsingCustomHitCache = !!hitCacheImplementation && !(hitCacheImplementation instanceof DefaultHitCache);
        sdkConfigUsingCustomVisitorCache = !!visitorCacheImplementation && !(visitorCacheImplementation instanceof DefaultVisitorCache);
      }


      const analyticData = new UsageHit({
        label: TroubleshootingLabel.SDK_CONFIG,
        logLevel: LogLevel.INFO,
        visitorId: this.visitor.sdkInitialData?.instanceId as string,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        config: this.config,
        sdkStatus: this.visitor.getSdkStatus(),
        lastBucketingTimestamp: this.configManager.decisionManager.lastBucketingTimestamp,
        lastInitializationTimestamp: this.visitor.sdkInitialData?.lastInitializationTimestamp,
        sdkConfigMode: this.getSdkConfigDecisionMode(),
        sdkConfigLogLevel: this.config.logLevel,
        sdkConfigTimeout: this.config.timeout,
        sdkConfigPollingInterval: this.config.pollingInterval,
        sdkConfigTrackingManagerStrategy: this.config.trackingManagerConfig?.cacheStrategy,
        sdkConfigTrackingManagerBatchIntervals: this.config.trackingManagerConfig?.batchIntervals,
        sdkConfigTrackingManagerPoolMaxSize: this.config.trackingManagerConfig?.poolMaxSize,
        sdkConfigFetchNow: this.config.fetchNow,
        sdkConfigReuseVisitorIds: this.config.reuseVisitorIds,
        sdkConfigInitialBucketing: this.config.initialBucketing,
        sdkConfigDecisionApiUrl: this.config.decisionApiUrl,
        sdkConfigHitDeduplicationTime: this.config.hitDeduplicationTime,
        sdkConfigUsingOnVisitorExposed: !!this.config.onVisitorExposed,
        sdkConfigUsingCustomHitCache: !!sdkConfigUsingCustomHitCache,
        sdkConfigUsingCustomVisitorCache: !!sdkConfigUsingCustomVisitorCache,
        sdkConfigFetchThirdPartyData: this.config.fetchThirdPartyData,
        sdkConfigFetchFlagsBufferingTime: this.config.fetchFlagsBufferingTime,
        sdkConfigDisableDeveloperUsageTracking: this.config.disableDeveloperUsageTracking,
        sdkConfigNextFetchConfig: this.config.nextFetchConfig,
        sdkConfigDisableCache: this.config.disableCache
      });
      this.sendUsageHit(analyticData);

    }

    async sendFetchFlagsTroubleshooting({ isFromCache, campaigns, now }:{isFromCache: boolean, campaigns:CampaignDTO[], now: number }):Promise<void> {
      const assignmentHistory: Record<string, string> = {};

      this.visitor.flagsData.forEach(item => {
        assignmentHistory[item.variationGroupId] = item.variationId;
      });

      const uniqueId = this.visitor.visitorId + this.decisionManager.troubleshooting?.endDate.toUTCString();
      const hash = this._murmurHash.murmurHash3Int32(uniqueId);
      const traffic = hash % 100;

      this.visitor.traffic = traffic;

      const hitCacheImplementation = this.config.hitCacheImplementation;
      const visitorCacheImplementation = this.config.visitorCacheImplementation;
      let sdkConfigUsingCustomHitCache = false;
      let sdkConfigUsingCustomVisitorCache = false;

      if (__fsWebpackIsBrowser__) {
        sdkConfigUsingCustomHitCache = !!hitCacheImplementation && !(hitCacheImplementation instanceof DefaultHitCache);
        sdkConfigUsingCustomVisitorCache = !!visitorCacheImplementation && !(visitorCacheImplementation instanceof DefaultVisitorCache);
      }


      const fetchFlagTroubleshooting = new Troubleshooting({
        label: TroubleshootingLabel.VISITOR_FETCH_CAMPAIGNS,
        logLevel: LogLevel.INFO,
        visitorId: this.visitor.visitorId,
        anonymousId: this.visitor.anonymousId,
        visitorSessionId: this.visitor.instanceId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        traffic,
        config: this.config,
        sdkStatus: this.visitor.getSdkStatus(),
        visitorContext: this.visitor.context,
        visitorCampaigns: campaigns,
        visitorCampaignFromCache: isFromCache ? campaigns : undefined,
        visitorConsent: this.visitor.hasConsented,
        visitorIsAuthenticated: !!this.visitor.anonymousId,
        visitorFlags: this.visitor.flagsData,
        visitorAssignmentHistory: assignmentHistory,
        visitorInitialCampaigns: this.visitor.sdkInitialData?.initialCampaigns,
        visitorInitialFlagsData: this.visitor.sdkInitialData?.initialFlagsData,
        lastBucketingTimestamp: this.configManager.decisionManager.lastBucketingTimestamp,
        lastInitializationTimestamp: this.visitor.sdkInitialData?.lastInitializationTimestamp,
        httpResponseTime: Date.now() - now,
        sdkConfigLogLevel: this.config.logLevel,
        sdkConfigMode: this.getSdkConfigDecisionMode(),
        sdkConfigTimeout: this.config.timeout,
        sdkConfigPollingInterval: this.config.pollingInterval,
        sdkConfigTrackingManagerStrategy: this.config.trackingManagerConfig?.cacheStrategy,
        sdkConfigTrackingManagerBatchIntervals: this.config.trackingManagerConfig?.batchIntervals,
        sdkConfigTrackingManagerPoolMaxSize: this.config.trackingManagerConfig?.poolMaxSize,
        sdkConfigFetchNow: this.config.fetchNow,
        sdkConfigReuseVisitorIds: this.config.reuseVisitorIds,
        sdkConfigInitialBucketing: this.config.initialBucketing,
        sdkConfigDecisionApiUrl: this.config.decisionApiUrl,
        sdkConfigHitDeduplicationTime: this.config.hitDeduplicationTime,
        sdkConfigUsingOnVisitorExposed: !!this.config.onVisitorExposed,
        sdkConfigUsingCustomHitCache: !!sdkConfigUsingCustomHitCache,
        sdkConfigUsingCustomVisitorCache: !!sdkConfigUsingCustomVisitorCache,
        sdkConfigFetchThirdPartyData: this.config.fetchThirdPartyData,
        sdkConfigFetchFlagsBufferingTime: this.config.fetchFlagsBufferingTime,
        sdkConfigDisableDeveloperUsageTracking: this.config.disableDeveloperUsageTracking,
        sdkConfigNextFetchConfig: this.config.nextFetchConfig,
        sdkConfigDisableCache: this.config.disableCache
      });

      await this.sendTroubleshootingHit(fetchFlagTroubleshooting);
    }

    sendConsentHitTroubleshooting():void {
      const consentHitTroubleshooting = this.visitor.consentHitTroubleshooting;
      if (!consentHitTroubleshooting) {
        return;
      }
      consentHitTroubleshooting.traffic = this.visitor.traffic;
      this.trackingManager.sendTroubleshootingHit(consentHitTroubleshooting);
      this.visitor.consentHitTroubleshooting = undefined;
    }

    sendSegmentHitTroubleshooting():void {
      const segmentHitTroubleshooting = this.visitor.segmentHitTroubleshooting;
      if (!segmentHitTroubleshooting) {
        return;
      }
      segmentHitTroubleshooting.traffic = this.visitor.traffic;
      this.trackingManager.sendTroubleshootingHit(segmentHitTroubleshooting);
      this.visitor.segmentHitTroubleshooting = undefined;
    }
}
