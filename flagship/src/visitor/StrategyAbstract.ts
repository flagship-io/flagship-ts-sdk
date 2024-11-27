import { Event, EventCategory, HitAbstract } from '../hit/index'
import { primitive, IHit, VisitorCacheDTO, IFSFlagMetadata, TroubleshootingLabel, VisitorCacheStatus, CampaignDTO, EAIScore } from '../types'
import { IVisitor } from './IVisitor'
import { VisitorAbstract } from './VisitorAbstract'
import { DecisionMode, IConfigManager, IFlagshipConfig } from '../config/index'
import { IDecisionManager } from '../decision/IDecisionManager'
import { logDebugSprintf, logError, logErrorSprintf, logInfoSprintf, sprintf } from '../utils/utils'
import { VISITOR_CACHE_ERROR, CONSENT_CHANGED, FS_CONSENT, LOOKUP_VISITOR_JSON_OBJECT_ERROR, PROCESS_CACHE, PROCESS_SET_CONSENT, SDK_APP, SDK_INFO, TRACKER_MANAGER_MISSING_ERROR, VISITOR_CACHE_VERSION, VISITOR_CACHE_FLUSHED, VISITOR_CACHE_LOADED, VISITOR_CACHE_SAVED, LogLevel, ANALYTIC_HIT_ALLOCATION } from '../enum/index'
import { BatchDTO } from '../hit/Batch'
import { ITrackingManager } from '../api/ITrackingManager'
import { Troubleshooting } from '../hit/Troubleshooting'
import { MurmurHash } from '../utils/MurmurHash'
import { UsageHit } from '../hit/UsageHit'
import { DefaultHitCache } from '../cache/DefaultHitCache'
import { DefaultVisitorCache } from '../cache/DefaultVisitorCache'
import { GetFlagMetadataParam, GetFlagValueParam, VisitorExposedParam } from '../type.local'
import { IVisitorEvent } from '../emotionAI/hit/IVisitorEvent'
import { IPageView } from '../emotionAI/hit/IPageView'
import { VisitorEvent } from '../emotionAI/hit/VisitorEvent'
import { PageView } from '../emotionAI/hit/PageView'
export const LOOKUP_HITS_JSON_ERROR = 'JSON DATA must be an array of object'
export const LOOKUP_HITS_JSON_OBJECT_ERROR = 'JSON DATA must fit the type HitCacheDTO'

export const VISITOR_ID_MISMATCH_ERROR = 'Visitor ID mismatch: {0} vs {1}'

export type StrategyAbstractConstruct = {
  visitor:VisitorAbstract,
  murmurHash: MurmurHash
}
export abstract class StrategyAbstract implements Omit<IVisitor, 'visitorId'|'anonymousId'| 'fetchStatus'|'flagsData'|'context'|'hasConsented'|'getFlagsDataArray'|'getFlag'|'getFlags'|'cleanup'> {
  protected visitor:VisitorAbstract

  protected get configManager ():IConfigManager {
    return this.visitor.configManager
  }

  protected get trackingManager ():ITrackingManager {
    return this.configManager.trackingManager
  }

  protected get decisionManager ():IDecisionManager {
    return this.configManager.decisionManager
  }

  public get config ():IFlagshipConfig {
    return this.visitor.config
  }

  protected _murmurHash: MurmurHash

  public constructor (param: StrategyAbstractConstruct) {
    const { visitor, murmurHash } = param
    this.visitor = visitor
    this._murmurHash = murmurHash
  }

  collectEAIData (currentPage?: Omit<IPageView, 'toApiKeys'>): void {
    this.visitor.emotionAi.collectEAIData(currentPage)
  }

  reportEaiVisitorEvent (event: IVisitorEvent):void {
    this.visitor.emotionAi.reportVisitorEvent(new VisitorEvent(event))
  }

  reportEaiPageView (pageView: IPageView):void {
    this.visitor.emotionAi.reportPageView(new PageView(pageView))
  }

  onEAICollectStatusChange (callback: (status: boolean) => void):void {
    this.visitor.emotionAi.onEAICollectStatusChange(callback)
  }

  public updateCampaigns (campaigns:CampaignDTO[]):void {
    try {
      this.visitor.campaigns = campaigns
      this.visitor.flagsData = this.decisionManager.getModifications(campaigns)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logError(this.config, error.message || error, 'updateCampaigns')
    }
  }

  protected hasTrackingManager (process: string): boolean {
    const check = this.trackingManager
    if (!check) {
      logError(this.config, sprintf(TRACKER_MANAGER_MISSING_ERROR), process)
    }
    return !!check
  }

  setConsent (hasConsented: boolean): void {
    const method = 'setConsent'
    this.visitor.hasConsented = hasConsented
    if (!hasConsented) {
      this.flushVisitor()
    }
    if (!this.hasTrackingManager(method)) {
      return
    }

    const consentHit = new Event({
      visitorId: this.visitor.visitorId,
      anonymousId: this.visitor.anonymousId,
      label: `${SDK_INFO.name}:${this.visitor.hasConsented}`,
      action: FS_CONSENT,
      category: EventCategory.USER_ENGAGEMENT
    })

    consentHit.qaMode = this.config.isQAModeEnabled

    consentHit.ds = SDK_APP
    consentHit.config = this.config

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
    })
    this.trackingManager.addHit(consentHit)

    logDebugSprintf(this.config, PROCESS_SET_CONSENT, CONSENT_CHANGED, this.visitor.visitorId, hasConsented)

    if (this.decisionManager.troubleshooting) {
      this.trackingManager.sendTroubleshootingHit(hitTroubleshooting)
      return
    }

    this.visitor.consentHitTroubleshooting = hitTroubleshooting
  }

  protected checKLookupVisitorDataV1 (item:VisitorCacheDTO):boolean {
    if (!item || !item.data || !item.data.visitorId) {
      return false
    }
    const campaigns = item.data.campaigns
    if (!campaigns) {
      return true
    }
    if (!Array.isArray(campaigns)) {
      return false
    }
    if ((this.visitor.visitorCacheStatus === VisitorCacheStatus.VISITOR_ID_CACHE || this.visitor.visitorCacheStatus === VisitorCacheStatus.VISITOR_ID_CACHE_WITH_ANONYMOUS_ID_CACHE) && item.data.visitorId !== this.visitor.visitorId) {
      logInfoSprintf(this.config, PROCESS_CACHE, VISITOR_ID_MISMATCH_ERROR, item.data.visitorId, this.visitor.visitorId)
      return false
    }
    if (this.visitor.visitorCacheStatus === VisitorCacheStatus.ANONYMOUS_ID_CACHE && item.data.visitorId !== this.visitor.anonymousId) {
      logInfoSprintf(this.config, PROCESS_CACHE, VISITOR_ID_MISMATCH_ERROR, item.data.visitorId, this.visitor.anonymousId)
      return false
    }
    return campaigns.every(x => x.campaignId && x.type && x.variationGroupId && x.variationId)
  }

  protected checKLookupVisitorData (item:VisitorCacheDTO):boolean {
    if (item.version === 1) {
      return this.checKLookupVisitorDataV1(item)
    }
    return false
  }

  public async lookupVisitor ():Promise<void> {
    try {
      const visitorCacheInstance = this.config.visitorCacheImplementation
      if (this.config.disableCache || typeof visitorCacheInstance?.lookupVisitor !== 'function' || this.visitor.visitorCache) {
        return
      }
      this.visitor.visitorCacheStatus = VisitorCacheStatus.NONE
      let visitorCache = await visitorCacheInstance.lookupVisitor(this.visitor.visitorId)
      if (visitorCache) {
        this.visitor.visitorCacheStatus = VisitorCacheStatus.VISITOR_ID_CACHE
      }
      if (this.visitor.anonymousId && !visitorCache) {
        const anonymousVisitorCache = await visitorCacheInstance.lookupVisitor(this.visitor.anonymousId)
        if (anonymousVisitorCache) {
          visitorCache = anonymousVisitorCache
          this.visitor.visitorCacheStatus = VisitorCacheStatus.ANONYMOUS_ID_CACHE
        }
      }

      logDebugSprintf(this.config, PROCESS_CACHE, VISITOR_CACHE_LOADED, this.visitor.visitorId, visitorCache)

      if (!visitorCache) {
        return
      }
      if (!this.checKLookupVisitorData(visitorCache)) {
        logErrorSprintf(this.config, PROCESS_CACHE, LOOKUP_VISITOR_JSON_OBJECT_ERROR, VISITOR_CACHE_VERSION, this.visitor.visitorId)
        return
      }

      this.visitor.visitorCache = visitorCache

      if (this.visitor.visitorCacheStatus === VisitorCacheStatus.VISITOR_ID_CACHE && this.visitor.anonymousId) {
        const anonymousVisitorCache = await visitorCacheInstance.lookupVisitor(this.visitor.anonymousId)
        if (anonymousVisitorCache) {
          this.visitor.visitorCacheStatus = VisitorCacheStatus.VISITOR_ID_CACHE_WITH_ANONYMOUS_ID_CACHE
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logErrorSprintf(this.config, PROCESS_CACHE, VISITOR_CACHE_ERROR, this.visitor.visitorId, 'lookupVisitor', error.message || error)
    }
  }

  public async cacheVisitor (eAIScore?: EAIScore):Promise<void> {
    try {
      const visitorCacheInstance = this.config.visitorCacheImplementation

      if (this.config.disableCache || !visitorCacheInstance || typeof visitorCacheInstance.cacheVisitor !== 'function') {
        return
      }

      const assignmentsHistory:Record<string, string> = {}
      const visitorCacheDTO: VisitorCacheDTO = {
        version: VISITOR_CACHE_VERSION,
        data: {
          visitorId: this.visitor.visitorId,
          anonymousId: this.visitor.anonymousId,
          consent: this.visitor.hasConsented,
          context: this.visitor.context,
          eAIScore: this.visitor.visitorCache?.data?.eAIScore || eAIScore,
          campaigns: this.visitor.campaigns.map(campaign => {
            assignmentsHistory[campaign.variationGroupId] = campaign.variation.id
            return {
              campaignId: campaign.id,
              slug: campaign.slug,
              variationGroupId: campaign.variationGroupId,
              variationId: campaign.variation.id,
              isReference: campaign.variation.reference,
              type: campaign.variation.modifications.type,
              activated: false,
              flags: campaign.variation.modifications.value
            }
          })
        }
      }

      visitorCacheDTO.data.assignmentsHistory = { ...this.visitor.visitorCache?.data?.assignmentsHistory, ...assignmentsHistory }

      await visitorCacheInstance.cacheVisitor(this.visitor.visitorId, visitorCacheDTO)

      const visitorCacheStatus = this.visitor.visitorCacheStatus

      if (this.visitor.anonymousId && (visitorCacheStatus === VisitorCacheStatus.NONE || visitorCacheStatus === VisitorCacheStatus.VISITOR_ID_CACHE)) {
        const anonymousVisitorCacheDTO:VisitorCacheDTO = {
          ...visitorCacheDTO,
          data: {
            ...visitorCacheDTO.data,
            visitorId: this.visitor.anonymousId,
            anonymousId: null
          }
        }
        await visitorCacheInstance.cacheVisitor(this.visitor.anonymousId, anonymousVisitorCacheDTO)
      }

      logDebugSprintf(this.config, PROCESS_CACHE, VISITOR_CACHE_SAVED, this.visitor.visitorId, visitorCacheDTO)

      this.visitor.visitorCache = visitorCacheDTO
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logErrorSprintf(this.config, PROCESS_CACHE, VISITOR_CACHE_ERROR, this.visitor.visitorId, 'cacheVisitor', error.message || error)
    }
  }

  protected async flushVisitor ():Promise<void> {
    try {
      const visitorCacheInstance = this.config.visitorCacheImplementation
      if (this.config.disableCache || !visitorCacheInstance || typeof visitorCacheInstance.flushVisitor !== 'function') {
        return
      }
      await visitorCacheInstance.flushVisitor(this.visitor.visitorId)

      logDebugSprintf(this.config, PROCESS_CACHE, VISITOR_CACHE_FLUSHED, this.visitor.visitorId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logErrorSprintf(this.config, PROCESS_CACHE, VISITOR_CACHE_ERROR, this.visitor.visitorId, 'flushVisitor', error.message || error)
    }
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

    public async sendTroubleshootingHit (hit: Troubleshooting) {
      await this.trackingManager.sendTroubleshootingHit(hit)
    }

    public getCurrentDateTime () {
      return new Date()
    }

    protected getSdkConfigDecisionMode () {
      return this.config.decisionMode === DecisionMode.DECISION_API ? 'DECISION_API' : this.config.decisionMode
    }

    public async sendSdkConfigAnalyticHit () {
      if (this.config.disableDeveloperUsageTracking) {
        return
      }
      const uniqueId = this.visitor.visitorId + this.getCurrentDateTime().toDateString()
      const hash = this._murmurHash.murmurHash3Int32(uniqueId)
      const traffic = hash % 1000

      if (traffic > ANALYTIC_HIT_ALLOCATION) {
        return
      }
      const hitCacheImplementation = this.config.hitCacheImplementation
      const visitorCacheImplementation = this.config.visitorCacheImplementation
      const sdkConfigUsingCustomHitCache = hitCacheImplementation && !(hitCacheImplementation instanceof DefaultHitCache)
      const sdkConfigUsingCustomVisitorCache = visitorCacheImplementation && !(visitorCacheImplementation instanceof DefaultVisitorCache)

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
      })
      await this.trackingManager.sendUsageHit(analyticData)
    }

    sendFetchFlagsTroubleshooting ({ isFromCache, campaigns, now }:{isFromCache: boolean, campaigns:CampaignDTO[], now: number }) {
      const assignmentHistory: Record<string, string> = {}

      this.visitor.flagsData.forEach(item => {
        assignmentHistory[item.variationGroupId] = item.variationId
      })

      const uniqueId = this.visitor.visitorId + this.decisionManager.troubleshooting?.endDate.toUTCString()
      const hash = this._murmurHash.murmurHash3Int32(uniqueId)
      const traffic = hash % 100

      this.visitor.traffic = traffic

      const hitCacheImplementation = this.config.hitCacheImplementation
      const visitorCacheImplementation = this.config.visitorCacheImplementation
      const sdkConfigUsingCustomHitCache = hitCacheImplementation && !(hitCacheImplementation instanceof DefaultHitCache)
      const sdkConfigUsingCustomVisitorCache = visitorCacheImplementation && !(visitorCacheImplementation instanceof DefaultVisitorCache)

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
      })

      this.sendTroubleshootingHit(fetchFlagTroubleshooting)
    }

    sendConsentHitTroubleshooting () {
      const consentHitTroubleshooting = this.visitor.consentHitTroubleshooting
      if (!consentHitTroubleshooting) {
        return
      }
      consentHitTroubleshooting.traffic = this.visitor.traffic
      this.trackingManager.sendTroubleshootingHit(consentHitTroubleshooting)
      this.visitor.consentHitTroubleshooting = undefined
    }

    sendSegmentHitTroubleshooting () {
      const segmentHitTroubleshooting = this.visitor.segmentHitTroubleshooting
      if (!segmentHitTroubleshooting) {
        return
      }
      segmentHitTroubleshooting.traffic = this.visitor.traffic
      this.trackingManager.sendTroubleshootingHit(segmentHitTroubleshooting)
      this.visitor.segmentHitTroubleshooting = undefined
    }
}
