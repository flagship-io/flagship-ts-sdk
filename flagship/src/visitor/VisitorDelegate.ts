import { FlagDTO } from '../index'
import { HitAbstract, HitShape } from '../hit/index'
import { primitive, modificationsRequested, IHit } from '../types'
import { VisitorAbstract } from './VisitorAbstract'
import { CampaignDTO } from '../decision/api/models'
import { Flag, IFlag } from '../flag/Flags'
import { IFlagMetadata } from '../flag/FlagMetadata'

export class VisitorDelegate extends VisitorAbstract {
  updateContext (context: Record<string, primitive>): void {
    this.getStrategy().updateContext(context)
  }

  clearContext (): void {
    this.getStrategy().clearContext()
  }

  getFlag (key:string):IFlag {
    const flag = this.flags.get(key)
    return new Flag(key, this, flag)
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

  synchronizeModifications (): Promise<void> {
    return this.getStrategy().synchronizeModifications()
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

  getAllFlags (activate: boolean): Promise<{ visitorId: string; campaigns: CampaignDTO[] }> {
    return this.getStrategy().getAllFlags(activate)
  }

  getModificationsForCampaign (campaignId: string, activate = false): Promise<{ visitorId: string; campaigns: CampaignDTO[] }> {
    return this.getStrategy().getModificationsForCampaign(campaignId, activate)
  }

  getFlatsForCampaign (campaignId: string, activate: boolean): Promise<{ visitorId: string; campaigns: CampaignDTO[] }> {
    return this.getStrategy().getFlatsForCampaign(campaignId, activate)
  }

  authenticate (visitorId: string): void {
    this.getStrategy().authenticate(visitorId)
    this.updateCache()
  }

  unauthenticate (): void {
    this.getStrategy().unauthenticate()
    this.updateCache()
  }

  fetchFlags ():Promise<void> {
    return this.getStrategy().fetchFlags()
  }

  userExposed (key:string, flag?: FlagDTO): Promise<void> {
    return this.getStrategy().userExposed(key, flag)
  }

  getFlagValue<T> (param:{ key:string, defaultValue: T, flag?:FlagDTO, userExposed?: boolean}):T {
    return this.getStrategy().getFlagValue(param)
  }

  getFlagMetadata (metadata:IFlagMetadata):IFlagMetadata|null {
    return this.getStrategy().getFlagMetadata(metadata)
  }
}
