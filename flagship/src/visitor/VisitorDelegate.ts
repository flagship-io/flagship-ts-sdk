import { Modification } from '../index'
import { HitAbstract, IPage, IScreen, IEvent, IItem, ITransaction } from '../hit/index'
import { primitive, modificationsRequested } from '../types'
import { VisitorAbstract } from './VisitorAbstract'
import { CampaignDTO } from '../decision/api/models'

export class VisitorDelegate extends VisitorAbstract {
  updateContext (context: Record<string, primitive>): void {
    this.getStrategy().updateContext(context)
  }

  clearContext (): void {
    this.getStrategy().clearContext()
  }

  getModification<T> (params: modificationsRequested<T>, activateAll?: boolean): Promise<T> {
    return this.getStrategy().getModification(params, activateAll)
  }

  getModificationSync<T> (params: modificationsRequested<T>, activateAll?: boolean): T {
    return this.getStrategy().getModificationSync(params, activateAll)
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

  sendHit(hit: HitAbstract): Promise<void>;
  sendHit(hit: HitAbstract[]): Promise<void>;
  sendHit(hit: IPage | IScreen | IEvent | IItem | ITransaction): Promise<void>;
  sendHit(hit: (IPage | IScreen | IEvent | IItem | ITransaction)[]): Promise<void>;
  sendHit (hit:IPage|IScreen|IEvent|IItem|ITransaction|
    Array<IPage|IScreen|IEvent|IItem|ITransaction>|
    HitAbstract|HitAbstract[]): Promise<void> {
    return this.getStrategy().sendHit(hit)
  }

  sendHitSync(hit: HitAbstract[]): void
  sendHitSync(hit: HitAbstract): void
  sendHitSync(hit: (IPage | IScreen | IEvent | IItem | ITransaction)[]): void
  sendHitSync(hit: HitAbstract | IPage | IScreen | IEvent | IItem | ITransaction): void
  sendHitSync (hit:IPage|IScreen|IEvent|IItem|ITransaction|
    Array<IPage|IScreen|IEvent|IItem|ITransaction>|
    HitAbstract|HitAbstract[]): void {
    return this.getStrategy().sendHitSync(hit)
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
