import { FlagDTO } from '../index.ts'
import { HitAbstract, HitShape } from '../hit/index.ts'
import { primitive, modificationsRequested, IHit, VisitorCacheDTO, HitCacheDTO } from '../types.ts'
import { IVisitor } from './IVisitor.ts'
import { VisitorAbstract } from './VisitorAbstract.ts'
import { IConfigManager, IFlagshipConfig } from '../config/index.ts'
import { CampaignDTO } from '../decision/api/models.ts'
import { ITrackingManager } from '../api/TrackingManagerAbstract.ts'
import { IDecisionManager } from '../decision/IDecisionManager.ts'
import { logError, logInfo, sprintf } from '../utils/utils.ts'
import { DEFAULT_HIT_CACHE_TIME, HIT_CACHE_VERSION, PROCESS_CACHE_HIT, TRACKER_MANAGER_MISSING_ERROR, VISITOR_CACHE_VERSION } from '../enum/index.ts'

import { BatchDTO } from '../hit/Batch.ts'

import { IFlagMetadata } from '../flag/FlagMetadata.ts'

export const LOOKUP_HITS_JSON_ERROR = 'JSON DATA must be an array of object'
export const LOOKUP_HITS_JSON_OBJECT_ERROR = 'JSON DATA must fit the type HitCacheDTO'
export const LOOKUP_VISITOR_JSON_OBJECT_ERROR = 'JSON DATA must fit the type VisitorCacheDTO'
export const VISITOR_ID_MISMATCH_ERROR = 'Visitor ID mismatch: {0} vs {1}'
export abstract class VisitorStrategyAbstract implements Omit<IVisitor, 'visitorId'|'flagsData'|'modifications'|'context'|'hasConsented'|'getModificationsArray'|'getFlagsDataArray'|'getFlag'> {
  protected visitor:VisitorAbstract;

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
      this.flushHits()
      this.flushVisitor()
    }
    if (!this.hasTrackingManager(method)) {
      return
    }

    this.trackingManager.sendConsentHit(this.visitor).catch((error) => {
      logError(this.config, error.message || error, method)
    })
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
      logInfo(this.config, sprintf(VISITOR_ID_MISMATCH_ERROR, item.data.visitorId, this.visitor.visitorId), 'lookupVisitor')
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
      if (!visitorCache) {
        return
      }
      if (!this.checKLookupVisitorData(visitorCache)) {
        throw new Error(LOOKUP_VISITOR_JSON_OBJECT_ERROR)
      }

      this.visitor.visitorCache = visitorCache
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logError(this.config, error.message || error, 'lookupVisitor')
    }
  }

  protected async cacheVisitor ():Promise<void> {
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

      this.visitor.visitorCache = data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logError(
        this.config,
        error.message || error,
        'cacheVisitor'
      )
    }
  }

  protected async flushVisitor ():Promise<void> {
    try {
      const visitorCacheInstance = this.config.visitorCacheImplementation
      if (this.config.disableCache || !visitorCacheInstance || typeof visitorCacheInstance.flushVisitor !== 'function') {
        return
      }
      await visitorCacheInstance.flushVisitor(this.visitor.visitorId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logError(
        this.config,
        error.message || error,
        'flushVisitor'
      )
    }
  }

  protected checKLookupHitData (item:HitCacheDTO):boolean {
    if (item && item.version === 1 && item.data && item.data.type && item.data.visitorId) {
      return true
    }
    logError(this.config, LOOKUP_HITS_JSON_OBJECT_ERROR, 'lookupHits')
    return false
  }

  async lookupHits ():Promise<void> {
    try {
      const hitCacheImplementation = this.config.hitCacheImplementation
      if (this.config.disableCache || !hitCacheImplementation || typeof hitCacheImplementation.lookupHits !== 'function') {
        return
      }

      const hitsCache = await hitCacheImplementation.lookupHits(this.visitor.visitorId)
      if (!hitsCache) {
        return
      }
      if (!Array.isArray(hitsCache)) {
        throw Error(LOOKUP_HITS_JSON_ERROR)
      }

      const checkHitTime = (time:number) => (((Date.now() - time) / 1000) <= DEFAULT_HIT_CACHE_TIME)

      const batches:BatchDTO[] = [{
        type: 'BATCH',
        hits: []
      }]
      let batchSize = 0
      let count = 0

      hitsCache.filter(item => this.checKLookupHitData(item) && checkHitTime(item.data.time)).forEach((item) => {
        if (item.data.type === 'ACTIVATE') {
          this.sendActivate(item.data.content as FlagDTO)
          return
        }

        if (item.data.type === 'BATCH') {
          this.sendHit(item.data.content as IHit)
          return
        }

        batchSize = JSON.stringify(batches[count]).length
        if (batchSize > 2621440) {
          count++
          batches[count] = {
            type: 'BATCH',
            hits: [item.data.content as IHit]
          }
        } else {
          batches[count].hits.push(item.data.content as IHit)
        }
      })

      if (batches.length === 1 && !batches[0].hits.length) {
        return
      }

      this.sendHits(batches)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logError(this.config, error.message || error, 'lookupHits')
    }
  }

  protected async cacheHit (hitInstance: HitAbstract|FlagDTO):Promise<void> {
    try {
      const hitCacheImplementation = this.config.hitCacheImplementation
      if (this.config.disableCache || !hitCacheImplementation || typeof hitCacheImplementation.cacheHit !== 'function') {
        return
      }
      const hitData: HitCacheDTO = {
        version: HIT_CACHE_VERSION,
        data: {
          visitorId: this.visitor.visitorId,
          anonymousId: this.visitor.anonymousId,
          type: hitInstance instanceof HitAbstract ? hitInstance.type : 'ACTIVATE',
          content: hitInstance instanceof HitAbstract ? hitInstance.toObject() : hitInstance,
          time: Date.now()
        }
      }
      await hitCacheImplementation.cacheHit(this.visitor.visitorId, hitData)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logError(this.config, error.message || error, PROCESS_CACHE_HIT)
    }
  }

  protected async flushHits (): Promise<void> {
    try {
      const hitCacheImplementation = this.config.hitCacheImplementation
      if (this.config.disableCache || !hitCacheImplementation || typeof hitCacheImplementation.flushHits !== 'function') {
        return
      }

      await hitCacheImplementation.flushHits(this.visitor.visitorId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logError(this.config, error.message || error, 'flushHits')
    }
  }

    abstract updateContext(context: Record<string, primitive>): void
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

    abstract sendHit(hit: BatchDTO): Promise<void>
    abstract sendHit(hit: HitAbstract): Promise<void>;
    abstract sendHit(hit: IHit): Promise<void>;
    abstract sendHit(hit: HitShape): Promise<void>;
    abstract sendHit(hit: IHit | HitAbstract | HitShape|BatchDTO): Promise<void>;

    abstract sendHits(hits: BatchDTO[]): Promise<void>
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
