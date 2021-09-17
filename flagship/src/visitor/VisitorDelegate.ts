import { Modification } from '../index'
import { HitAbstract } from '../hit/index'
import { primitive, modificationsRequested, IHit } from '../types'
import { VisitorAbstract } from './VisitorAbstract'
import { CampaignDTO } from '../decision/api/models'

export class VisitorDelegate extends VisitorAbstract {
  updateContext (context: Record<string, primitive>): void {
    this.getStrategy().updateContext(context)
  }

  clearContext (): void {
    this.getStrategy().clearContext()
  }

  getModification<T> (params: modificationsRequested<T>): Promise<T> {
    return this.getStrategy().getModification(params)
  }

  getModificationSync<T> (params: modificationsRequested<T>): T {
    return this.getStrategy().getModificationSync(params)
  }

  getModifications<T> (params: modificationsRequested<T>[], activateAll?: boolean): Promise<T[]> {
    return this.getStrategy().getModifications(params, activateAll)
  }

  getModificationsSync<T> (params: modificationsRequested<T>[], activateAll?: boolean): T[] {
    return this.getStrategy().getModificationsSync(params, activateAll)
  }

  getModificationInfo (key: string): Promise<Modification | null> {
    return this.getStrategy().getModificationInfo(key)
  }

  getModificationInfoSync (key: string): Modification | null {
    return this.getStrategy().getModificationInfoSync(key)
  }

  synchronizeModifications (): Promise<void> {
    return this.getStrategy().synchronizeModifications()
  }

  activateModification (key: string): Promise<void> {
    return this.getStrategy().activateModification(key)
  }

  activateModificationSync (key: string): void {
    return this.getStrategy().activateModificationSync(key)
  }

  activateModifications(keys: { key: string; }[]): Promise<void>;
  activateModifications(keys: string[]): Promise<void>;
  activateModifications (params: Array<{ key: string }> | Array<string>): Promise<void> {
    return this.getStrategy().activateModifications(params)
  }

  activateModificationsSync(keys: { key: string }[]): void
  activateModificationsSync(keys: string[]): void
  activateModificationsSync (params: Array<{ key: string }> | Array<string>): void {
    return this.getStrategy().activateModificationsSync(params)
  }

  sendHit(hit: HitAbstract): Promise<void>
  sendHit(hit: IHit): Promise<void>
  sendHit(hit: HitAbstract | IHit): Promise<void>
  sendHit (hit: HitAbstract | IHit): Promise<void> {
    return this.getStrategy().sendHit(hit)
  }

  sendHitSync(hit: HitAbstract): void
  sendHitSync(hit: IHit): void
  sendHitSync(hit: HitAbstract | IHit): void
  sendHitSync (hit: HitAbstract | IHit): void {
    this.getStrategy().sendHitSync(hit)
  }

  sendHits(hits: HitAbstract[]): Promise<void>
  sendHits(hits: IHit[]): Promise<void>
  sendHits(hits: HitAbstract[] | IHit[]): Promise<void>
  sendHits (hits: HitAbstract[] | IHit[]): Promise<void> {
    return this.getStrategy().sendHits(hits)
  }

  sendHitsSync(hits: HitAbstract[]): void
  sendHitsSync(hits: IHit[]): void
  sendHitsSync(hits: HitAbstract[] | IHit[]): void
  sendHitsSync (hits: HitAbstract[] | IHit[]): void {
    this.getStrategy().sendHitsSync(hits)
  }

  getAllModifications (activate = false): Promise<{ visitorId: string; campaigns: CampaignDTO[] }> {
    return this.getStrategy().getAllModifications(activate)
  }

  getModificationsForCampaign (campaignId: string, activate = false): Promise<{ visitorId: string; campaigns: CampaignDTO[] }> {
    return this.getStrategy().getModificationsForCampaign(campaignId, activate)
  }

  authenticate (visitorId: string): void {
    this.getStrategy().authenticate(visitorId)
    this.updateCache()
  }

  unauthenticate (): void {
    this.getStrategy().unauthenticate()
    this.updateCache()
  }
}
