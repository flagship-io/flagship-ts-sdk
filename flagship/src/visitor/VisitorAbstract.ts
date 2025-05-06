import { PREDEFINED_CONTEXT_LOADED, PROCESS_NEW_VISITOR, VISITOR_CREATED, VISITOR_ID_GENERATED, VISITOR_PROFILE_LOADED } from './../enum/FlagshipConstant';
import { IConfigManager, IFlagshipConfig } from '../config/index';
import { IHit, NewVisitor, primitive, VisitorCacheDTO, FlagDTO, IFSFlagMetadata, sdkInitialData, VisitorCacheStatus, FlagsStatus, SerializedFlagMetadata, CampaignDTO, VisitorVariations, EAIScore, VisitorProfile } from '../types';

import { IVisitor } from './IVisitor';
import { FSSdkStatus, SDK_INFO, VISITOR_ID_ERROR } from '../enum/index';
import { hexToValue, isBrowser, logDebugSprintf, logError, uuidV4 } from '../utils/utils';
import { type HitAbstract } from '../hit/HitAbstract';
import { DefaultStrategy } from './DefaultStrategy';
import { StrategyAbstract } from './StrategyAbstract';
import { EventEmitter } from '../depsNode.native';
import { NotReadyStrategy } from './NotReadyStrategy';
import { PanicStrategy } from './PanicStrategy';
import { NoConsentStrategy } from './NoConsentStrategy';
import { MurmurHash } from '../utils/MurmurHash';
import { type Troubleshooting } from '../hit/Troubleshooting';
import { FSFetchStatus } from '../enum/FSFetchStatus';
import { FSFetchReasons } from '../enum/FSFetchReasons';
import { IFSFlag } from '../flag/IFSFlag';
import { GetFlagMetadataParam, GetFlagValueParam, IVisitorProfileCache, VisitorExposedParam, VisitorVariationState } from '../type.local';
import { IFSFlagCollection } from '../flag/IFSFlagCollection';
import { IEmotionAI } from '../emotionAI/IEmotionAI';
import { IVisitorEvent } from '../emotionAI/hit/IVisitorEvent';
import { IPageView } from '../emotionAI/hit/IPageView';
import { type UsageHit } from '../hit/UsageHit';

export abstract class VisitorAbstract extends EventEmitter implements IVisitor {
  protected _visitorId!: string;
  protected _context!: Record<string, primitive>;
  protected _flags!: Map<string, FlagDTO>;
  protected _configManager!: IConfigManager;
  protected _campaigns!: CampaignDTO[];
  protected _hasConsented!: boolean;
  protected _anonymousId!: string | null;
  public deDuplicationCache!: Record<string, number>;
  protected _isCleaningDeDuplicationCache!: boolean;
  public visitorCache?: VisitorCacheDTO;
  protected _exposedVariations!: Record<string, VisitorVariations>;
  protected _sendExposedVariationTimeoutId?: NodeJS.Timeout;

  private _instanceId!: string;
  private _traffic!: number;
  protected _sdkInitialData?: sdkInitialData;
  private _consentHitTroubleshooting?: Troubleshooting;
  private _segmentHitTroubleshooting?: Troubleshooting;
  private _fetchStatus!: FlagsStatus;
  private _onFetchFlagsStatusChanged?: ({ status, reason }: FlagsStatus) => void;
  private _getCampaignsPromise?: Promise<CampaignDTO[] | null>;
  private _hasContextBeenUpdated!: boolean;
  private _emotionAi!: IEmotionAI;
  private _analyticTraffic!: number;
  private _murmurHash!: MurmurHash;
  private _visitorProfileCache?: IVisitorProfileCache;
  private _isClientSuppliedID! : boolean;
  private _visitorVariationState : VisitorVariationState;

  public get visitorVariationState() : VisitorVariationState {
    return this._visitorVariationState;
  }

  public get isClientSuppliedID() : boolean {
    return this._isClientSuppliedID;
  }

  public get hasContextBeenUpdated(): boolean {
    return this._hasContextBeenUpdated;
  }

  public set hasContextBeenUpdated(v: boolean) {
    this._hasContextBeenUpdated = v;
  }

  public get getCampaignsPromise(): Promise<CampaignDTO[] | null> | undefined {
    return this._getCampaignsPromise;
  }

  public set getCampaignsPromise(v: Promise<CampaignDTO[] | null> | undefined) {
    this._getCampaignsPromise = v;
  }

  public get onFetchFlagsStatusChanged(): (({ status, reason }: FlagsStatus) => void) | undefined {
    return this._onFetchFlagsStatusChanged;
  }

  public set onFetchFlagsStatusChanged(v: (({ status, reason }: FlagsStatus) => void) | undefined) {
    this._onFetchFlagsStatusChanged = v;
  }

  public get flagsStatus(): FlagsStatus {
    return this._fetchStatus;
  }

  public set flagsStatus(v: FlagsStatus) {
    this._fetchStatus = v;
    if (this.onFetchFlagsStatusChanged) {
      this.onFetchFlagsStatusChanged(v);
    }
  }

  public get segmentHitTroubleshooting(): Troubleshooting | undefined {
    return this._segmentHitTroubleshooting;
  }

  public set segmentHitTroubleshooting(v: Troubleshooting | undefined) {
    this._segmentHitTroubleshooting = v;
  }

  public get consentHitTroubleshooting(): Troubleshooting | undefined {
    return this._consentHitTroubleshooting;
  }

  public set consentHitTroubleshooting(v: Troubleshooting | undefined) {
    this._consentHitTroubleshooting = v;
  }

  public get sdkInitialData(): sdkInitialData | undefined {
    return this._sdkInitialData;
  }

  public static SdkStatus?: FSSdkStatus;

  public getSdkStatus(): FSSdkStatus | undefined {
    return VisitorAbstract.SdkStatus;
  }

  public lastFetchFlagsTimestamp = 0;
  private _visitorCacheStatus?: VisitorCacheStatus;

  public get visitorCacheStatus(): VisitorCacheStatus | undefined {
    return this._visitorCacheStatus;
  }

  public set visitorCacheStatus(v: VisitorCacheStatus | undefined) {
    this._visitorCacheStatus = v;
  }

  public get emotionAi(): IEmotionAI {
    return this._emotionAi;
  }

  public get analyticTraffic(): number {
    return this._analyticTraffic;
  }

  private initBaseProperties(param: {
    configManager: IConfigManager,
    emotionAi: IEmotionAI,
    murmurHash?: MurmurHash,
    monitoringData?: sdkInitialData,
    visitorProfileCache?: IVisitorProfileCache,
  }): void {
    const { configManager, emotionAi, monitoringData, visitorProfileCache } = param;
    this._murmurHash = param.murmurHash || new MurmurHash();
    this._emotionAi = emotionAi;
    this._hasContextBeenUpdated = true;
    this._exposedVariations = {};
    this._sdkInitialData = monitoringData;
    this._instanceId = uuidV4();
    this._isCleaningDeDuplicationCache = false;
    this.deDuplicationCache = {};
    this._context = {};
    this._configManager = configManager;
    this.campaigns = [];
    this._visitorProfileCache = visitorProfileCache;
  }

  private hasVisitorProfileClientSuppliedId(visitorProfileCache:VisitorProfile): boolean {
    return visitorProfileCache.isClientSuppliedId === undefined ? true : visitorProfileCache.isClientSuppliedId;
  }

  private initVisitorId(visitorId?: string, isAuthenticated?: boolean, hasConsented?: boolean): void {

    const shouldUseCache = this.config.reuseVisitorIds && hasConsented === true;
    const visitorCache = shouldUseCache ? this._visitorProfileCache?.loadVisitorProfile() : null;

    if (visitorCache) {
      logDebugSprintf(this.config, PROCESS_NEW_VISITOR, VISITOR_PROFILE_LOADED, visitorCache);
    }

    this._isClientSuppliedID = false;

    if (visitorId) {
      this.visitorId = visitorId;
      this._isClientSuppliedID = true;
    } else if (!isAuthenticated && visitorCache?.anonymousId) {
      this.visitorId = visitorCache.anonymousId;
      this._isClientSuppliedID = this.hasVisitorProfileClientSuppliedId(visitorCache);
    } else if (visitorCache?.visitorId) {
      this.visitorId = visitorCache.visitorId;
      this._isClientSuppliedID = this.hasVisitorProfileClientSuppliedId(visitorCache);
    } else {
      this.visitorId =  this.generateVisitorId();
    }

    this._anonymousId = null;
    if (isAuthenticated) {
      this._anonymousId = visitorCache?.anonymousId || uuidV4();
    }
  }

  constructor(param: NewVisitor & {
    visitorId?: string
    configManager: IConfigManager
    context: Record<string, primitive>
    monitoringData?: sdkInitialData,
    emotionAi: IEmotionAI,
    murmurHash?: MurmurHash,
    visitorProfileCache?: IVisitorProfileCache,
    visitorVariationState?: VisitorVariationState
  }) {
    const { visitorId, context, isAuthenticated, hasConsented, initialFlagsData, initialCampaigns, onFlagsStatusChanged: onFetchFlagsStatusChanged } = param;
    super();
    this._visitorVariationState = param.visitorVariationState || {};
    this.initBaseProperties(param);


    this.initVisitorId(visitorId, isAuthenticated, hasConsented);

    this.initAnalyticTraffic();
    this.setConsent(hasConsented || false);
    this.updateContext(context);
    this.loadPredefinedContext();

    logDebugSprintf(this.config, PROCESS_NEW_VISITOR, PREDEFINED_CONTEXT_LOADED, {
      fs_client: SDK_INFO.name,
      fs_version: SDK_INFO.version,
      fs_users: this.visitorId
    });

    this.updateCache();
    this.setInitialFlags(initialFlagsData);
    this.setInitializeCampaigns(initialCampaigns, !!initialFlagsData);

    this.onFetchFlagsStatusChanged = onFetchFlagsStatusChanged;
    this.flagsStatus = {
      status: FSFetchStatus.FETCH_REQUIRED,
      reason: FSFetchReasons.FLAGS_NEVER_FETCHED
    };

    this._emotionAi.init(this);
    logDebugSprintf(this.config, PROCESS_NEW_VISITOR, VISITOR_CREATED, this.visitorId, this.context, !!isAuthenticated, !!this.hasConsented);
  }

  protected updateCache(): void {
    const visitorProfile = this.hasConsented ? {
      visitorId: this.visitorId,
      anonymousId: this.anonymousId,
      isClientSuppliedId: this.isClientSuppliedID
    } : undefined;
    this._visitorProfileCache?.saveVisitorProfile(visitorProfile);
  }

  public get traffic(): number {
    return this._traffic;
  }

  public set traffic(v: number) {
    this._traffic = v;
  }

  public get instanceId(): string {
    return this._instanceId;
  }

  public getCurrentDateTime(): Date {
    return new Date();
  }

  protected initAnalyticTraffic(): void {
    const uniqueId = this.visitorId + this.getCurrentDateTime().toDateString();
    const hash = this._murmurHash.murmurHash3Int32(uniqueId);
    this._analyticTraffic = hash % 1000;
  }

  protected generateVisitorId(): string {
    const visitorId = uuidV4();
    logDebugSprintf(this.config, PROCESS_NEW_VISITOR, VISITOR_ID_GENERATED, visitorId);
    return visitorId;
  }

  public clearDeDuplicationCache(deDuplicationTime: number): void {
    if (this._isCleaningDeDuplicationCache) {
      return;
    }
    this._isCleaningDeDuplicationCache = true;
    const entries = Object.entries(this.deDuplicationCache);

    for (const [key, value] of entries) {
      if ((Date.now() - value) > (deDuplicationTime * 1000)) {
        delete this.deDuplicationCache[key];
      }
    }
    this._isCleaningDeDuplicationCache = false;
  }

  protected setInitialFlags(flags?: SerializedFlagMetadata[]): void {
    this._flags = new Map<string, FlagDTO>();
    if (!Array.isArray(flags)) {
      return;
    }
    flags.forEach((item: SerializedFlagMetadata) => {
      this._flags.set(item.key, {
        key: item.key,
        campaignId: item.campaignId,
        campaignName: item.campaignName,
        variationGroupId: item.variationGroupId,
        variationGroupName: item.variationGroupName,
        variationId: item.variationId,
        variationName: item.variationName,
        isReference: item.isReference,
        value: hexToValue(item.hex, this.config)?.v,
        slug: item.slug,
        campaignType: item.campaignType
      });
    });
  }

  protected setInitializeCampaigns(campaigns?: CampaignDTO[], hasInitialFlags?: boolean): void {
    if (campaigns && Array.isArray(campaigns) && !hasInitialFlags) {
      this.getStrategy().updateCampaigns(campaigns);
    }
  }

  public loadPredefinedContext(): void {
    this.context.fs_client = SDK_INFO.name;
    this.context.fs_version = SDK_INFO.version;
    this.context.fs_users = this.visitorId;
  }

  public get visitorId(): string {
    return this._visitorId;
  }

  public set visitorId(v: string) {
    if (!v || typeof v !== 'string') {
      logError(this.config, VISITOR_ID_ERROR, 'VISITOR ID');
      return;
    }
    this._visitorId = v;
    this.loadPredefinedContext();
    this.visitorCache = undefined;
  }

  public get hasConsented(): boolean {
    return this._hasConsented;
  }

  public set hasConsented(v: boolean) {
    this._hasConsented = v;
  }

  public setConsent(hasConsented: boolean): void {
    this.hasConsented = hasConsented;
    this.getStrategy().setConsent(hasConsented);
  }

  public get context(): Record<string, primitive> {
    return this._context;
  }

  public set context(v: Record<string, primitive>) {
    this._context = {};
    this.updateContext(v);
  }

  public get flagsData(): Map<string, FlagDTO> {
    return this._flags;
  }

  public set flagsData(v: Map<string, FlagDTO>) {
    this._flags = v;
  }

  get configManager(): IConfigManager {
    return this._configManager;
  }

  public get config(): IFlagshipConfig {
    return this.configManager.config;
  }

  public get campaigns(): CampaignDTO[] {
    return this._campaigns;
  }

  public set campaigns(v: CampaignDTO[]) {
    this._campaigns = v;
  }

  public get anonymousId(): string | null {
    return this._anonymousId;
  }

  public set anonymousId(v: string | null) {
    this._anonymousId = v;
  }

  protected getStrategy(): StrategyAbstract {
    let strategy: StrategyAbstract;
    const params = {
      visitor: this,
      murmurHash: new MurmurHash()
    };
    const status = this.getSdkStatus();
    if (status === undefined || status === FSSdkStatus.SDK_NOT_INITIALIZED) {
      strategy = new NotReadyStrategy(params);
    } else if (status === FSSdkStatus.SDK_PANIC) {
      strategy = new PanicStrategy(params);
    } else if (!this.hasConsented) {
      strategy = new NoConsentStrategy(params);
    } else {
      strategy = new DefaultStrategy(params);
    }

    return strategy;
  }

  public async sendExposedVariation(flag?: FlagDTO): Promise<void> {
    if (__fsWebpackIsBrowser__) {
      if (!flag || !isBrowser()) {
        return;
      }
      this._exposedVariations[flag.campaignId] = {
        campaignId: flag.campaignId,
        variationGroupId: flag.variationGroupId,
        variationId: flag.variationId
      };

      this._visitorVariationState.exposedVariations = this._exposedVariations;

      if (!this.config.isQAModeEnabled) {
        return;
      }

      const BATCH_SIZE = 10;
      const DELAY = 100;

      const { sendVisitorExposedVariations } = await import('../qaAssistant/messages/index.ts');

      if (Object.keys(this._exposedVariations).length >= BATCH_SIZE) {
        sendVisitorExposedVariations(this._visitorVariationState);
        this._exposedVariations = {};
      }

      if (this._sendExposedVariationTimeoutId) {
        clearTimeout(this._sendExposedVariationTimeoutId);
      }

      if (Object.keys(this._exposedVariations).length === 0) {
        return;
      }

      this._sendExposedVariationTimeoutId = setTimeout(() => {
        sendVisitorExposedVariations(this._visitorVariationState);
        this._exposedVariations = {};
      }, DELAY);
    }
  }

  public collectEAIEventsAsync(currentPage?: Omit<IPageView, 'toApiKeys'>): Promise<void> {
    return this.getStrategy().collectEAIEventsAsync(currentPage);
  }

  sendEaiVisitorEvent(event: IVisitorEvent): void {
    this.getStrategy().reportEaiVisitorEvent(event);
  }

  sendEaiPageView(pageView: IPageView): void {
    this.getStrategy().reportEaiPageView(pageView);
  }

  public onEAICollectStatusChange(callback: (status: boolean) => void): void {
    this.getStrategy().onEAICollectStatusChange(callback);
  }

  public cleanup(): void {
    this.getStrategy().cleanup();
  }

  public async getCachedEAIScore(): Promise<EAIScore | undefined> {
    if (!this.visitorCache) {
      await this.getStrategy().lookupVisitor();
    }
    return this.visitorCache?.data?.eAIScore;
  }

  public async isEAIDataCollected(): Promise<boolean> {
    if (!this.visitorCache) {
      await this.getStrategy().lookupVisitor();
    }
    return this.visitorCache?.data?.isEAIDataCollected || false;
  }

  public async setCachedEAIScore(eAIScore: EAIScore): Promise<void> {
    this.getStrategy().cacheVisitor(eAIScore);
  }

  public async setIsEAIDataCollected(isEAIDataCollected: boolean): Promise<void> {
    this.getStrategy().cacheVisitor(undefined, isEAIDataCollected);
  }

  public sendTroubleshooting(hit: Troubleshooting): Promise<void> {
    return this.getStrategy().sendTroubleshootingHit(hit);
  }

  public sendUsageHit(hit: UsageHit): Promise<void> {
    return this.getStrategy().sendUsageHit(hit);
  }

  public addInTrackingManager(hit: HitAbstract): Promise<void> {
    return this.getStrategy().addInTrackingManager(hit);
  }

  abstract updateContext(key: string, value: primitive): void
  abstract updateContext(context: Record<string, primitive>): void
  abstract updateContext(context: Record<string, primitive> | string, value?: primitive): void
  abstract clearContext(): void

  abstract getFlag(key: string): IFSFlag
  abstract getFlags(): IFSFlagCollection

  abstract sendHit(hit: HitAbstract): Promise<void>;
  abstract sendHit(hit: IHit): Promise<void>;
  abstract sendHit(hit: IHit | HitAbstract): Promise<void>;

  abstract sendHits(hit: HitAbstract[]): Promise<void>;
  abstract sendHits(hit: IHit[]): Promise<void>;
  abstract sendHits(hit: HitAbstract[] | IHit[]): Promise<void>

  abstract authenticate(visitorId: string): void
  abstract unauthenticate(): void

  abstract visitorExposed(param: VisitorExposedParam): Promise<void>
  abstract getFlagValue<T>(param: GetFlagValueParam<T>): T extends null ? unknown : T
  abstract fetchFlags(): Promise<void>
  abstract getFlagMetadata(param: GetFlagMetadataParam): IFSFlagMetadata
}
