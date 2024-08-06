import { Event, EventCategory, HitAbstract } from '../hit/index'
import { primitive, IHit, VisitorCacheDTO, IFSFlagMetadata, TroubleshootingLabel, VisitorCacheStatus, CampaignDTO, SdkMethod, FlagDTO } from '../types'
import { IVisitor } from './IVisitor'
import { VisitorAbstract } from './VisitorAbstract'
import { DecisionMode, IConfigManager, IFlagshipConfig } from '../config/index'
import { IDecisionManager } from '../decision/IDecisionManager'
import { logDebugSprintf, logError, logErrorSprintf, logInfoSprintf, sprintf } from '../utils/utils'
import { VISITOR_CACHE_ERROR, CONSENT_CHANGED, FS_CONSENT, LOOKUP_VISITOR_JSON_OBJECT_ERROR, PROCESS_CACHE, PROCESS_SET_CONSENT, SDK_APP, SDK_INFO, TRACKER_MANAGER_MISSING_ERROR, VISITOR_CACHE_VERSION, VISITOR_CACHE_FLUSHED, VISITOR_CACHE_LOADED, VISITOR_CACHE_SAVED, LogLevel, ANALYTIC_HIT_ALLOCATION, FSFlagStatus } from '../enum/index'
import { BatchDTO } from '../hit/Batch'
import { ITrackingManager } from '../api/ITrackingManager'
import { Troubleshooting } from '../hit/Troubleshooting'
import { MurmurHash } from '../utils/MurmurHash'
import { UsageHit } from '../hit/UsageHit'
import { DefaultHitCache } from '../cache/DefaultHitCache'
import { DefaultVisitorCache } from '../cache/DefaultVisitorCache'
import { GetFlagMetadataParam, GetFlagValueParam, SdkMethodBehavior, VisitorExposedParam } from '../type.local'
export const LOOKUP_HITS_JSON_ERROR = 'JSON DATA must be an array of object'
export const LOOKUP_HITS_JSON_OBJECT_ERROR = 'JSON DATA must fit the type HitCacheDTO'

export const VISITOR_ID_MISMATCH_ERROR = 'Visitor ID mismatch: {0} vs {1}'

export type StrategyAbstractConstruct = {
  visitor:VisitorAbstract,
  murmurHash: MurmurHash
}
export abstract class StrategyAbstract implements Omit<IVisitor, 'visitorId'|'anonymousId'| 'fetchStatus'|'flagsData'|'context'|'hasConsented'|'getFlagsDataArray'|'getFlag'|'getFlags'> {
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

  setConsent (hasConsented: boolean, isInitializing?: boolean): void {
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

    this.trackingManager.addHit(consentHit)

    if (!isInitializing) {
      this.sendDiagnosticHitConsent(consentHit)
      logDebugSprintf(this.config, PROCESS_SET_CONSENT, CONSENT_CHANGED, this.visitor.visitorId, hasConsented)
    }
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
    if ((this.visitor.visitorCacheStatus === VisitorCacheStatus.VISITOR_ID_CACHE || this.visitor.visitorCacheStatus === VisitorCacheStatus.VISITOR_ID_CACHE_NOT_ANONYMOUS_ID_CACHE) && item.data.visitorId !== this.visitor.visitorId) {
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
      if (this.config.disableCache || !visitorCacheInstance || !visitorCacheInstance.lookupVisitor || typeof visitorCacheInstance.lookupVisitor !== 'function') {
        return
      }
      this.visitor.visitorCacheStatus = VisitorCacheStatus.NONE
      let visitorCache = await visitorCacheInstance.lookupVisitor(this.visitor.visitorId)
      if (visitorCache) {
        this.visitor.visitorCacheStatus = VisitorCacheStatus.VISITOR_ID_CACHE
      }
      if (this.visitor.anonymousId) {
        const anonymousVisitorCache = await visitorCacheInstance.lookupVisitor(this.visitor.anonymousId)
        if (anonymousVisitorCache && !visitorCache) {
          visitorCache = anonymousVisitorCache
          this.visitor.visitorCacheStatus = VisitorCacheStatus.ANONYMOUS_ID_CACHE
        } else if (!anonymousVisitorCache && visitorCache) {
          this.visitor.visitorCacheStatus = VisitorCacheStatus.VISITOR_ID_CACHE_NOT_ANONYMOUS_ID_CACHE
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logErrorSprintf(this.config, PROCESS_CACHE, VISITOR_CACHE_ERROR, this.visitor.visitorId, 'lookupVisitor', error.message || error)
    }
  }

  public async cacheVisitor ():Promise<void> {
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

      if (!visitorCacheStatus || visitorCacheStatus === VisitorCacheStatus.NONE || visitorCacheStatus === VisitorCacheStatus.VISITOR_ID_CACHE_NOT_ANONYMOUS_ID_CACHE) {
        if (this.visitor.anonymousId) {
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

    abstract updateContextCollection(context: Record<string, primitive>, isInitializing?: boolean): void
    abstract updateContext(key: string, value: primitive):void
    abstract updateContext(context: Record<string, primitive>): void
    abstract updateContext (context: Record<string, primitive> | string, value?:primitive): void
    abstract clearContext (): void

    abstract sendHit(hit: IHit): Promise<void>;
    abstract sendHit(hit: IHit |BatchDTO): Promise<void>;

    abstract sendHits(hit: IHit[]): Promise<void>;
    abstract sendHits (hits: IHit[]|BatchDTO[]): Promise<void>

    abstract authenticate(visitorId: string): void
    abstract unauthenticate(): void

    abstract fetchFlags(): Promise<void>
    abstract visitorExposed (param:VisitorExposedParam): Promise<void>
    abstract getFlagValue<T>(param:GetFlagValueParam<T>):T extends null ? unknown : T
    abstract getFlagMetadata(param:GetFlagMetadataParam):IFSFlagMetadata

    getVisitorAnalyticsTraffic ():number {
      const uniqueId = this.visitor.visitorId + this.getCurrentDateTime().toDateString()
      const hash = this._murmurHash.murmurHash3Int32(uniqueId)
      return hash % 1000
    }

    public async sendTroubleshootingHit (hit: Troubleshooting) {
      await this.trackingManager.sendTroubleshootingHit(hit)
    }

    public async sendUsageHit (hit: UsageHit): Promise<void> {
      if (this.config.disableDeveloperUsageTracking) {
        return
      }
      const traffic = this.visitor.analyticTraffic

      if (traffic > ANALYTIC_HIT_ALLOCATION) {
        return
      }
      return this.trackingManager.sendUsageHit(hit)
    }

    public getCurrentDateTime () {
      return new Date()
    }

    protected getSdkConfigDecisionMode () {
      return this.config.decisionMode === DecisionMode.DECISION_API ? 'DECISION_API' : this.config.decisionMode
    }

    protected async processTroubleshootingHit (hit: Troubleshooting) {
      if (this.decisionManager.troubleshooting) {
        this.sendTroubleshootingHit(hit)
        return
      }

      this.visitor.troubleshootingHits.push(hit)
    }

    public async sendDiagnosticHitNewVisitor () {
      const troubleshooting = new Troubleshooting({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.FS_NEW_VISITOR,
        visitorId: this.visitor.visitorId,
        anonymousId: this.visitor.anonymousId,
        visitorSessionId: this.visitor.instanceId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        config: this.config,
        visitorConsent: this.visitor.hasConsented,
        visitorIsAuthenticated: !!this.visitor.anonymousId,
        visitorContext: this.visitor.context,
        visitorInitialCampaigns: this.visitor.sdkInitialData?.initialCampaigns,
        visitorInitialFlagsData: this.visitor.sdkInitialData?.initialFlagsData,
        visitorHasOnFetchFlagsStatusChanged: this.visitor.sdkInitialData?.hasOnFetchFlagsStatusChanged,
        traffic: this.visitor.traffic || 0
      })

      const analytic = new UsageHit({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.FS_NEW_VISITOR,
        visitorId: this.visitor.sdkInitialData?.instanceId as string,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        visitorSessionId: this.visitor.instanceId,
        config: this.config
      })

      this.sendUsageHit(analytic)

      this.processTroubleshootingHit(troubleshooting)
    }

    public sendDiagnosticHitConsent (consentHit: Event) {
      const troubleshooting = new Troubleshooting({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.VISITOR_SET_CONSENT,
        traffic: this.visitor.traffic || 0,
        visitorId: this.visitor.visitorId,
        visitorSessionId: this.visitor.instanceId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        anonymousId: this.visitor.anonymousId,
        config: this.config,
        hitContent: consentHit.toApiKeys()
      })

      const analytic = new UsageHit({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.VISITOR_SET_CONSENT,
        visitorId: this.visitor.sdkInitialData?.instanceId as string,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        config: this.config
      })

      this.sendUsageHit(analytic)

      this.processTroubleshootingHit(troubleshooting)
    }

    public async sendDiagnosticHitUpdateContext (oldContext: Record<string, primitive>, newContext: Record<string, primitive>) {
      const troubleshooting = new Troubleshooting({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.VISITOR_UPDATE_CONTEXT,
        visitorId: this.visitor.visitorId,
        anonymousId: this.visitor.anonymousId,
        visitorSessionId: this.visitor.instanceId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        config: this.config,
        visitorOldContext: oldContext,
        visitorNewContext: newContext,
        traffic: this.visitor.traffic || 0
      })

      const analytic = new UsageHit({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.VISITOR_UPDATE_CONTEXT,
        visitorId: this.visitor.sdkInitialData?.instanceId as string,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        visitorSessionId: this.visitor.instanceId,
        config: this.config
      })

      this.sendUsageHit(analytic)

      this.processTroubleshootingHit(troubleshooting)
    }

    public async sendDiagnosticHitClearContext () {
      const troubleshooting = new Troubleshooting({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.VISITOR_CLEAR_CONTEXT,
        visitorId: this.visitor.visitorId,
        anonymousId: this.visitor.anonymousId,
        visitorSessionId: this.visitor.instanceId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        config: this.config,
        visitorContext: this.visitor.context,
        traffic: this.visitor.traffic || 0
      })

      const analytic = new UsageHit({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.VISITOR_CLEAR_CONTEXT,
        visitorId: this.visitor.sdkInitialData?.instanceId as string,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        visitorSessionId: this.visitor.instanceId,
        config: this.config
      })

      this.sendUsageHit(analytic)

      this.processTroubleshootingHit(troubleshooting)
    }

    public async sendDiagnosticHitFetchFlags ({ isFromCache, campaigns, now }:{isFromCache: boolean, campaigns:CampaignDTO[], now: number }) {
      const assignmentHistory: Record<string, string> = {}

      this.visitor.flagsData.forEach(item => {
        assignmentHistory[item.variationGroupId] = item.variationId
      })

      const troubleshooting = new Troubleshooting({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.VISITOR_FETCH_FLAGS,
        visitorId: this.visitor.visitorId,
        anonymousId: this.visitor.anonymousId,
        visitorSessionId: this.visitor.instanceId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        config: this.config,
        traffic: this.visitor.traffic || 0,
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
        httpResponseTime: Date.now() - now
      })

      const analytic = new UsageHit({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.VISITOR_FETCH_FLAGS,
        visitorId: this.visitor.sdkInitialData?.instanceId as string,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        visitorSessionId: this.visitor.sdkInitialData?.instanceId as string,
        config: this.config
      })

      this.sendUsageHit(analytic)

      this.processTroubleshootingHit(troubleshooting)
    }

    public async sendDiagnosticHitGetFlag (flagKey: string) {
      const troubleshooting = new Troubleshooting({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.VISITOR_GET_FLAG,
        visitorId: this.visitor.visitorId,
        anonymousId: this.visitor.anonymousId,
        visitorSessionId: this.visitor.instanceId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        config: this.config,
        flagKey,
        traffic: this.visitor.traffic || 0
      })

      const analytic = new UsageHit({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.VISITOR_GET_FLAG,
        visitorId: this.visitor.sdkInitialData?.instanceId as string,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        visitorSessionId: this.visitor.instanceId,
        config: this.config
      })

      this.sendUsageHit(analytic)

      this.processTroubleshootingHit(troubleshooting)
    }

    public async sendDiagnosticHitGetFlags () {
      const troubleshooting = new Troubleshooting({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.VISITOR_GET_FLAGS,
        visitorId: this.visitor.visitorId,
        anonymousId: this.visitor.anonymousId,
        visitorSessionId: this.visitor.instanceId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        config: this.config,
        traffic: this.visitor.traffic || 0
      })

      const analytic = new UsageHit({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.VISITOR_GET_FLAGS,
        visitorId: this.visitor.sdkInitialData?.instanceId as string,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        visitorSessionId: this.visitor.instanceId,
        config: this.config
      })

      this.sendUsageHit(analytic)

      this.processTroubleshootingHit(troubleshooting)
    }

    public async sendDiagnosticHitSendHit (hit?: HitAbstract) {
      const troubleshooting = new Troubleshooting({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.VISITOR_SEND_HIT,
        visitorId: this.visitor.visitorId,
        anonymousId: this.visitor.anonymousId,
        visitorSessionId: this.visitor.instanceId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        config: this.config,
        hitContent: hit?.toApiKeys(),
        traffic: this.visitor.traffic || 0
      })

      const analytic = new UsageHit({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.VISITOR_SEND_HIT,
        visitorId: this.visitor.sdkInitialData?.instanceId as string,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        visitorSessionId: this.visitor.instanceId,
        config: this.config
      })

      this.sendUsageHit(analytic)

      this.processTroubleshootingHit(troubleshooting)
    }

    public async sendDiagnosticHitAuthenticate (sdkMethodBehavior: SdkMethodBehavior, visitorId?:string, anonymousId?:string|null) {
      const troubleshooting = new Troubleshooting({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.VISITOR_AUTHENTICATE,
        visitorId,
        anonymousId,
        sdkMethodBehavior,
        visitorSessionId: this.visitor.instanceId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        config: this.config,
        traffic: this.visitor.traffic || 0
      })

      const analytic = new UsageHit({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.VISITOR_AUTHENTICATE,
        sdkMethodBehavior,
        visitorId: this.visitor.sdkInitialData?.instanceId as string,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        visitorSessionId: this.visitor.instanceId,
        config: this.config
      })

      this.sendUsageHit(analytic)

      this.processTroubleshootingHit(troubleshooting)
    }

    public async sendDiagnosticHitUnauthenticate (sdkMethodBehavior: SdkMethodBehavior, visitorId?:string, anonymousId?:string|null) {
      const troubleshooting = new Troubleshooting({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.VISITOR_UNAUTHENTICATE,
        visitorId,
        anonymousId,
        sdkMethodBehavior,
        visitorSessionId: this.visitor.instanceId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        config: this.config,
        traffic: this.visitor.traffic || 0
      })

      const analytic = new UsageHit({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.VISITOR_UNAUTHENTICATE,
        sdkMethodBehavior,
        visitorId: this.visitor.sdkInitialData?.instanceId as string,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        visitorSessionId: this.visitor.instanceId,
        config: this.config
      })

      this.sendUsageHit(analytic)

      this.processTroubleshootingHit(troubleshooting)
    }

    public async sendDiagnosticHitFlagGetValue (defaultValue: unknown, visitorExposed: boolean, flag?: FlagDTO) {
      const troubleshooting = new Troubleshooting({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.FLAG_GET_VALUE,
        visitorId: this.visitor.visitorId,
        anonymousId: this.visitor.anonymousId,
        visitorSessionId: this.visitor.instanceId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        config: this.config,
        traffic: this.visitor.traffic || 0,
        flagKey: flag?.key,
        flagValue: flag?.value,
        flagDefault: defaultValue,
        flagMetadataCampaignId: flag?.campaignId,
        flagMetadataVariationGroupId: flag?.variationGroupId,
        flagMetadataVariationId: flag?.variationId,
        flagMetadataCampaignIsReference: flag?.isReference,
        flagMetadataCampaignType: flag?.campaignType,
        flagMetadataVariationGroupName: flag?.variationGroupName,
        flagMetadataVariationName: flag?.variationName,
        flagMetadataCampaignName: flag?.campaignName,
        flagMetadataCampaignSlug: flag?.slug,
        visitorExposed
      })

      const analytic = new UsageHit({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.FLAG_GET_VALUE,
        visitorId: this.visitor.sdkInitialData?.instanceId as string,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        visitorSessionId: this.visitor.instanceId,
        config: this.config
      })

      this.sendUsageHit(analytic)

      this.processTroubleshootingHit(troubleshooting)
    }

    public async sendDiagnosticHitFlagGetMetadata (flag?: FlagDTO) {
      const troubleshooting = new Troubleshooting({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.FLAG_GET_METADATA,
        visitorId: this.visitor.visitorId,
        anonymousId: this.visitor.anonymousId,
        visitorSessionId: this.visitor.instanceId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        config: this.config,
        traffic: this.visitor.traffic || 0,
        flagKey: flag?.key,
        flagValue: flag?.value,
        flagMetadataCampaignId: flag?.campaignId,
        flagMetadataVariationGroupId: flag?.variationGroupId,
        flagMetadataVariationId: flag?.variationId,
        flagMetadataCampaignIsReference: flag?.isReference,
        flagMetadataCampaignType: flag?.campaignType,
        flagMetadataVariationGroupName: flag?.variationGroupName,
        flagMetadataVariationName: flag?.variationName,
        flagMetadataCampaignName: flag?.campaignName,
        flagMetadataCampaignSlug: flag?.slug
      })

      const analytic = new UsageHit({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.FLAG_GET_METADATA,
        visitorId: this.visitor.sdkInitialData?.instanceId as string,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        visitorSessionId: this.visitor.instanceId,
        config: this.config
      })

      this.sendUsageHit(analytic)

      this.processTroubleshootingHit(troubleshooting)
    }

    public async sendDiagnosticHitFlagExists (flag: FlagDTO, defaultValue: unknown, flagExists: boolean) {
      const troubleshooting = new Troubleshooting({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.FLAG_EXISTS,
        visitorId: this.visitor.visitorId,
        anonymousId: this.visitor.anonymousId,
        visitorSessionId: this.visitor.instanceId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        config: this.config,
        traffic: this.visitor.traffic || 0,
        flagKey: flag.key,
        flagValue: flag.value,
        flagDefault: defaultValue,
        flagMetadataCampaignId: flag.campaignId,
        flagMetadataVariationGroupId: flag.variationGroupId,
        flagMetadataVariationId: flag.variationId,
        flagMetadataCampaignIsReference: flag.isReference,
        flagMetadataCampaignType: flag.campaignType,
        flagMetadataVariationGroupName: flag.variationGroupName,
        flagMetadataVariationName: flag.variationName,
        flagMetadataCampaignName: flag.campaignName,
        flagMetadataCampaignSlug: flag.slug,
        flagExists
      })

      const analytic = new UsageHit({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.FLAG_EXISTS,
        visitorId: this.visitor.sdkInitialData?.instanceId as string,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        visitorSessionId: this.visitor.instanceId,
        config: this.config
      })

      this.sendUsageHit(analytic)

      this.processTroubleshootingHit(troubleshooting)
    }

    public async sendDiagnosticHitFlagStatus (flag: FlagDTO, defaultValue: unknown, flagStatus: FSFlagStatus) {
      const troubleshooting = new Troubleshooting({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.FLAG_STATUS,
        visitorId: this.visitor.visitorId,
        anonymousId: this.visitor.anonymousId,
        visitorSessionId: this.visitor.instanceId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        config: this.config,
        traffic: this.visitor.traffic || 0,
        flagKey: flag.key,
        flagValue: flag.value,
        flagDefault: defaultValue,
        flagMetadataCampaignId: flag.campaignId,
        flagMetadataVariationGroupId: flag.variationGroupId,
        flagMetadataVariationId: flag.variationId,
        flagMetadataCampaignIsReference: flag.isReference,
        flagMetadataCampaignType: flag.campaignType,
        flagMetadataVariationGroupName: flag.variationGroupName,
        flagMetadataVariationName: flag.variationName,
        flagMetadataCampaignName: flag.campaignName,
        flagMetadataCampaignSlug: flag.slug,
        flagStatus
      })

      const analytic = new UsageHit({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.FLAG_STATUS,
        visitorId: this.visitor.sdkInitialData?.instanceId as string,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        visitorSessionId: this.visitor.instanceId,
        config: this.config
      })

      this.sendUsageHit(analytic)

      this.processTroubleshootingHit(troubleshooting)
    }

    public async sendDiagnosticHitFlagVisitorExposed (defaultValue: unknown, flag?: FlagDTO) {
      const troubleshooting = new Troubleshooting({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.FLAG_VISITOR_EXPOSED,
        visitorId: this.visitor.visitorId,
        anonymousId: this.visitor.anonymousId,
        visitorSessionId: this.visitor.instanceId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        config: this.config,
        traffic: this.visitor.traffic || 0,
        flagKey: flag?.key,
        flagValue: flag?.value,
        flagDefault: defaultValue,
        flagMetadataCampaignId: flag?.campaignId,
        flagMetadataVariationGroupId: flag?.variationGroupId,
        flagMetadataVariationId: flag?.variationId,
        flagMetadataCampaignIsReference: flag?.isReference,
        flagMetadataCampaignType: flag?.campaignType,
        flagMetadataVariationGroupName: flag?.variationGroupName,
        flagMetadataVariationName: flag?.variationName,
        flagMetadataCampaignName: flag?.campaignName,
        flagMetadataCampaignSlug: flag?.slug
      })

      const analytic = new UsageHit({
        label: TroubleshootingLabel.VISITOR_JOURNEY,
        logLevel: LogLevel.INFO,
        sdkMethod: SdkMethod.FLAG_VISITOR_EXPOSED,
        visitorId: this.visitor.sdkInitialData?.instanceId as string,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        visitorSessionId: this.visitor.instanceId,
        config: this.config
      })

      this.sendUsageHit(analytic)

      this.processTroubleshootingHit(troubleshooting)
    }

    public async sendDiagnosticHitQueue () {
      if (!this.decisionManager.troubleshooting) {
        return
      }
      this.visitor.troubleshootingHits.forEach(hit => {
        this.trackingManager.sendTroubleshootingHit(hit)
      })
    }

    public async sendSdkConfigAnalyticHit () {
      if (this.config.disableDeveloperUsageTracking) {
        return
      }
      const traffic = this.visitor.analyticTraffic

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
