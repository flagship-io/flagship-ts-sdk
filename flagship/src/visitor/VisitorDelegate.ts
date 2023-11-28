import { HitAbstract, HitShape } from '../hit/index'
import { primitive, modificationsRequested, IHit, IFlagMetadata, FlagDTO, CampaignDTO } from '../types'
import { VisitorAbstract } from './VisitorAbstract'
import { Flag, IFlag } from '../flag/Flags'
import { logWarningSprintf, visitorFlagSyncStatusMessage } from '../utils/utils'
import { GET_FLAG } from '../enum/FlagshipConstant'
import { FlagSynchStatus } from '../enum/FlagSynchStatus'

export class VisitorDelegate extends VisitorAbstract {
  updateContext (key: string, value: primitive):void
  updateContext (context: Record<string, primitive>): void
  updateContext (context: Record<string, primitive> | string, value?:primitive): void {
    this.getStrategy().updateContext(context, value)
    this.loadPredefinedContext()
  }

  clearContext (): void {
    this.getStrategy().clearContext()
  }

  getFlag<T> (key:string, defaultValue: T):IFlag<T> {
    if (this.flagSynchStatus !== FlagSynchStatus.FLAGS_FETCHED) {
      logWarningSprintf(this.config, GET_FLAG, visitorFlagSyncStatusMessage(this.flagSynchStatus), this.visitorId, key)
    }
    return new Flag({ key, visitor: this, defaultValue })
  }

  getModification<T> (params: modificationsRequested<T>): Promise<T> {
    return this.getStrategy().getModification(params)
  }

  getModificationSync<T> (params: modificationsRequested<T>): T {
    return this.getStrategy().getModificationSync(params)
  }

  getModifications<T> (params: modificationsRequested<T>[], activateAll?: boolean): Promise<Record<string, T>> {
    return this.getStrategy().getModifications(params, activateAll)
  }

  getModificationsSync<T> (params: modificationsRequested<T>[], activateAll?: boolean): Record<string, T> {
    return this.getStrategy().getModificationsSync(params, activateAll)
  }

  getModificationInfo (key: string): Promise<FlagDTO | null> {
    return this.getStrategy().getModificationInfo(key)
  }

  getModificationInfoSync (key: string): FlagDTO | null {
    return this.getStrategy().getModificationInfoSync(key)
  }

  async synchronizeModifications (): Promise<void> {
    await this.getStrategy().lookupVisitor()
    await this.getStrategy().synchronizeModifications()
    await this.getStrategy().cacheVisitor()
  }

  activateModification (key: string): Promise<void> {
    return this.getStrategy().activateModification(key)
  }

  activateModifications(keys: { key: string; }[]): Promise<void>;
  activateModifications(keys: string[]): Promise<void>;
  activateModifications (params: Array<{ key: string }> | Array<string>): Promise<void> {
    return this.getStrategy().activateModifications(params)
  }

  sendHit(hit: HitAbstract): Promise<void>
  sendHit(hit: IHit): Promise<void>
  sendHit(hit: HitShape): Promise<void>
  sendHit(hit: HitAbstract | IHit|HitShape): Promise<void>
  sendHit (hit: HitAbstract | IHit|HitShape): Promise<void> {
    return this.getStrategy().sendHit(hit)
  }

  sendHits(hits: HitAbstract[]): Promise<void>
  sendHits(hits: IHit[]): Promise<void>
  sendHits(hit: HitShape[]): Promise<void>;
  sendHits(hits: HitAbstract[] | IHit[]|HitShape[]): Promise<void>
  sendHits (hits: HitAbstract[] | IHit[]|HitShape[]): Promise<void> {
    return this.getStrategy().sendHits(hits)
  }

  getAllModifications (activate = false): Promise<{ visitorId: string; campaigns: CampaignDTO[] }> {
    return this.getStrategy().getAllModifications(activate)
  }

  getAllFlagsData (activate = false): Promise<{ visitorId: string; campaigns: CampaignDTO[] }> {
    return this.getStrategy().getAllFlagsData(activate)
  }

  getModificationsForCampaign (campaignId: string, activate = false): Promise<{ visitorId: string; campaigns: CampaignDTO[] }> {
    return this.getStrategy().getModificationsForCampaign(campaignId, activate)
  }

  getFlatsDataForCampaign (campaignId: string, activate = false): Promise<{ visitorId: string; campaigns: CampaignDTO[] }> {
    return this.getStrategy().getFlatsDataForCampaign(campaignId, activate)
  }

  authenticate (visitorId: string): void {
    this.getStrategy().authenticate(visitorId)
    this.updateCache()
  }

  unauthenticate (): void {
    this.getStrategy().unauthenticate()
    this.updateCache()
  }

  async fetchFlags ():Promise<void> {
    await this.getStrategy().lookupVisitor()
    await this.getStrategy().fetchFlags()
    await this.getStrategy().cacheVisitor()
  }

  visitorExposed <T> (param:{key:string, flag?:FlagDTO, defaultValue:T}): Promise<void> {
    return this.getStrategy().visitorExposed(param)
  }

  getFlagValue<T> (param:{ key:string, defaultValue: T, flag?:FlagDTO, userExposed?: boolean}):T {
    return this.getStrategy().getFlagValue(param)
  }

  getFlagMetadata (param:{metadata:IFlagMetadata, key?:string, hasSameType:boolean}):IFlagMetadata {
    return this.getStrategy().getFlagMetadata(param)
  }
}
