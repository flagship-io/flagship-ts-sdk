import { FlagDTO } from '../index'
import { Event, HitAbstract, HitShape } from '../hit/index'
import { primitive, modificationsRequested, IHit, VisitorCacheDTO, IFlagMetadata } from '../types'
import { IVisitor } from './IVisitor'
import { VisitorAbstract } from './VisitorAbstract'
import { IConfigManager, IFlagshipConfig } from '../config/index'
import { CampaignDTO } from '../decision/api/models'
import { IDecisionManager } from '../decision/IDecisionManager'
import { logDebugSprintf, logError, logErrorSprintf, logInfoSprintf, sprintf } from '../utils/utils'
import { VISITOR_CACHE_ERROR, CONSENT_CHANGED, FS_CONSENT, LOOKUP_VISITOR_JSON_OBJECT_ERROR, PROCESS_CACHE, PROCESS_SET_CONSENT, SDK_APP, SDK_INFO, TRACKER_MANAGER_MISSING_ERROR, VISITOR_CACHE_VERSION, VISITOR_CACHE_FLUSHED, VISITOR_CACHE_LOADED, VISITOR_CACHE_SAVED } from '../enum/index'
import { BatchDTO } from '../hit/Batch'
import { EventCategory } from '../hit/Monitoring'
import { ITrackingManager } from '../api/ITrackingManager'
export const LOOKUP_HITS_JSON_ERROR = 'JSON DATA must be an array of object'
export const LOOKUP_HITS_JSON_OBJECT_ERROR = 'JSON DATA must fit the type HitCacheDTO'

export const VISITOR_ID_MISMATCH_ERROR = 'Visitor ID mismatch: {0} vs {1}'
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

  public constructor (visitor:VisitorAbstract) {
    this.visitor = visitor
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

    this.trackingManager.addHit(consentHit)

    logDebugSprintf(this.config, PROCESS_SET_CONSENT, CONSENT_CHANGED, this.visitor.visitorId, hasConsented)
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
    if (item.data.visitorId !== this.visitor.visitorId) {
      logInfoSprintf(this.config, PROCESS_CACHE, VISITOR_ID_MISMATCH_ERROR, item.data.visitorId, this.visitor.visitorId)
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
      const visitorCache = await visitorCacheInstance.lookupVisitor(this.visitor.visitorId)

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
      const data: VisitorCacheDTO = {
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

      data.data.assignmentsHistory = { ...this.visitor.visitorCache?.data?.assignmentsHistory, ...assignmentsHistory }

      await visitorCacheInstance.cacheVisitor(this.visitor.visitorId, data)

      logDebugSprintf(this.config, PROCESS_CACHE, VISITOR_CACHE_SAVED, this.visitor.visitorId, data)

      this.visitor.visitorCache = data
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
    abstract userExposed<T>(param:{key:string, flag?:FlagDTO, defaultValue:T}):Promise<void>
    abstract getFlagValue<T>(param:{ key:string, defaultValue: T, flag?:FlagDTO, userExposed?: boolean}):T
    abstract getFlagMetadata(param:{metadata:IFlagMetadata, key?:string, hasSameType:boolean}):IFlagMetadata
}
