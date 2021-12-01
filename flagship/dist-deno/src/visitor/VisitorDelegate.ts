import { Modification } from '../index.ts'
import { HitAbstract, HitShape } from '../hit/index.ts'
import { primitive, modificationsRequested, IHit } from '../types.ts'
import { VisitorAbstract } from './VisitorAbstract.ts'
import { CampaignDTO } from '../decision/api/models.ts'

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

  getModifications<T> (params: modificationsRequested<T>[], activateAll?: boolean): Promise<Record<string, T>> {
    return this.getStrategy().getModifications(params, activateAll)
  }

  getModificationsSync<T> (params: modificationsRequested<T>[], activateAll?: boolean): Record<string, T> {
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
