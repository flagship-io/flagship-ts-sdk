import { Event, EventCategory, HitAbstract, HitShape } from '../hit/index'
import { primitive, modificationsRequested, IHit, VisitorCacheDTO, IFlagMetadata, FlagDTO } from '../types'
import { IVisitor } from './IVisitor'
import { VisitorAbstract } from './VisitorAbstract'
import { DecisionMode, IConfigManager, IFlagshipConfig } from '../config/index'
import { CampaignDTO } from '../decision/api/models'
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
export const LOOKUP_HITS_JSON_ERROR = 'JSON DATA must be an array of object'
export const LOOKUP_HITS_JSON_OBJECT_ERROR = 'JSON DATA must fit the type HitCacheDTO'

export const VISITOR_ID_MISMATCH_ERROR = 'Visitor ID mismatch: {0} vs {1}'

export type StrategyAbstractConstruct = {
  visitor:VisitorAbstract,
  murmurHash: MurmurHash
}
export abstract class VisitorStrategyAbstract implements Omit<IVisitor, 'visitorId'|'anonymousId'|'flagsData'|'modifications'|'context'|'hasConsented'|'getModificationsArray'|'getFlagsDataArray'|'getFlag'> {
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

    consentHit.ds = SDK_APP
    consentHit.config = this.config

    const hitTroubleshooting = new Troubleshooting({

      label: 'VISITOR_SEND_HIT',
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
    if ((this.visitor.visitorCacheStatus === 'VISITOR_ID_CACHE' || this.visitor.visitorCacheStatus === 'VISITOR_ID_CACHE_NOT_ANONYMOUS_ID_CACHE') && item.data.visitorId !== this.visitor.visitorId) {
      logInfoSprintf(this.config, PROCESS_CACHE, VISITOR_ID_MISMATCH_ERROR, item.data.visitorId, this.visitor.visitorId)
      return false
    }
    if (this.visitor.visitorCacheStatus === 'ANONYMOUS_ID_CACHE' && item.data.visitorId !== this.visitor.anonymousId) {
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
      this.visitor.visitorCacheStatus = 'NONE'
      let visitorCache = await visitorCacheInstance.lookupVisitor(this.visitor.visitorId)
      if (visitorCache) {
        this.visitor.visitorCacheStatus = 'VISITOR_ID_CACHE'
      }
      if (this.visitor.anonymousId) {
        const anonymousVisitorCache = await visitorCacheInstance.lookupVisitor(this.visitor.anonymousId)
        if (anonymousVisitorCache && !visitorCache) {
          visitorCache = anonymousVisitorCache
          this.visitor.visitorCacheStatus = 'ANONYMOUS_ID_CACHE'
        } else if (!anonymousVisitorCache && visitorCache) {
          this.visitor.visitorCacheStatus = 'VISITOR_ID_CACHE_NOT_ANONYMOUS_ID_CACHE'
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

      if (!visitorCacheStatus || visitorCacheStatus === 'NONE' || visitorCacheStatus === 'VISITOR_ID_CACHE_NOT_ANONYMOUS_ID_CACHE') {
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

    abstract updateContext(key: string, value: primitive):void
    abstract updateContext(context: Record<string, primitive>): void
    abstract updateContext (context: Record<string, primitive> | string, value?:primitive): void
    abstract clearContext (): void

    abstract getModification<T>(params: modificationsRequested<T>): Promise<T>;
    abstract getModificationSync<T>(params: modificationsRequested<T>): T

    abstract getModifications<T> (params: modificationsRequested<T>[], activateAll?: boolean): Promise<Record<string, T>>
    abstract getModificationsSync<T> (params: modificationsRequested<T>[], activateAll?: boolean): Record<string, T>

    abstract getModificationInfo (key: string): Promise<FlagDTO | null>
    abstract getModificationInfoSync(key: string): FlagDTO | null

    abstract synchronizeModifications (): Promise<void>

    /**
     *
     * @param key
     * @deprecated
     */
    abstract activateModification(key: string): Promise<void>;

    /**
     *
     * @param keys
     * @deprecated
     */
    abstract activateModifications(keys: { key: string; }[]): Promise<void>;
    abstract activateModifications(keys: string[]): Promise<void>;
    abstract activateModifications (params: Array<{ key: string }> | Array<string>): Promise<void>

    protected abstract sendActivate (modification: FlagDTO): Promise<void>

    abstract sendHit(hit: HitAbstract): Promise<void>;
    abstract sendHit(hit: IHit): Promise<void>;
    abstract sendHit(hit: HitShape): Promise<void>;
    abstract sendHit(hit: IHit | HitAbstract | HitShape|BatchDTO): Promise<void>;

    abstract sendHits(hit: HitAbstract[]): Promise<void>;
    abstract sendHits(hit: IHit[]): Promise<void>;
    abstract sendHits(hit: HitShape[]): Promise<void>;
    abstract sendHits (hits: HitAbstract[] | IHit[]|HitShape[]|BatchDTO[]): Promise<void>

    abstract getAllModifications (activate: boolean): Promise<{ visitorId: string; campaigns: CampaignDTO[] }>

    abstract getAllFlagsData (activate: boolean): Promise<{ visitorId: string; campaigns: CampaignDTO[] }>

    abstract getModificationsForCampaign (campaignId: string, activate: boolean): Promise<{ visitorId: string; campaigns: CampaignDTO[] }>

    abstract getFlatsDataForCampaign (campaignId: string, activate: boolean): Promise<{ visitorId: string; campaigns: CampaignDTO[] }>

    abstract authenticate(visitorId: string): void
    abstract unauthenticate(): void

    abstract fetchFlags(): Promise<void>
    abstract visitorExposed<T>(param:{key:string, flag?:FlagDTO, defaultValue:T}):Promise<void>
    abstract getFlagValue<T>(param:{ key:string, defaultValue: T, flag?:FlagDTO, userExposed?: boolean}):T
    abstract getFlagMetadata(param:{metadata:IFlagMetadata, key?:string, hasSameType:boolean}):IFlagMetadata

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
        label: 'SDK_CONFIG',
        logLevel: LogLevel.INFO,
        visitorId: this.visitor.sdkInitialData?.instanceId as string,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        config: this.config,
        sdkStatus: this.visitor.getSdkStatus(),
        lastBucketingTimestamp: this.configManager.decisionManager.lastBucketingTimestamp,
        lastInitializationTimestamp: this.visitor.sdkInitialData?.lastInitializationTimestamp,
        sdkConfigMode: this.getSdkConfigDecisionMode(),
        sdkConfigTimeout: this.config.timeout,
        sdkConfigPollingInterval: this.config.pollingInterval,
        sdkConfigTrackingManagerConfigStrategy: this.config.trackingManagerConfig?.cacheStrategy,
        sdkConfigTrackingManagerConfigBatchIntervals: this.config.trackingManagerConfig?.batchIntervals,
        sdkConfigTrackingManagerConfigPoolMaxSize: this.config.trackingManagerConfig?.poolMaxSize,
        sdkConfigFetchNow: this.config.fetchNow,
        sdkConfigEnableClientCache: this.config.enableClientCache,
        sdkConfigInitialBucketing: this.config.initialBucketing,
        sdkConfigDecisionApiUrl: this.config.decisionApiUrl,
        sdkConfigHitDeduplicationTime: this.config.hitDeduplicationTime,
        sdkConfigUsingOnVisitorExposed: !!this.config.onVisitorExposed,
        sdkConfigUsingCustomHitCache,
        sdkConfigUsingCustomVisitorCache,
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
        label: 'VISITOR_FETCH_CAMPAIGNS',
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

        sdkConfigMode: this.getSdkConfigDecisionMode(),
        sdkConfigTimeout: this.config.timeout,
        sdkConfigPollingInterval: this.config.pollingInterval,
        sdkConfigTrackingManagerConfigStrategy: this.config.trackingManagerConfig?.cacheStrategy,
        sdkConfigTrackingManagerConfigBatchIntervals: this.config.trackingManagerConfig?.batchIntervals,
        sdkConfigTrackingManagerConfigPoolMaxSize: this.config.trackingManagerConfig?.poolMaxSize,
        sdkConfigFetchNow: this.config.fetchNow,
        sdkConfigEnableClientCache: this.config.enableClientCache,
        sdkConfigInitialBucketing: this.config.initialBucketing,
        sdkConfigDecisionApiUrl: this.config.decisionApiUrl,
        sdkConfigHitDeduplicationTime: this.config.hitDeduplicationTime,
        sdkConfigUsingOnVisitorExposed: !!this.config.onVisitorExposed,
        sdkConfigUsingCustomHitCache,
        sdkConfigUsingCustomVisitorCache,
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
