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

  getModification<T>(params: modificationsRequested<T>, activateAll?: boolean): Promise<T>;
  getModification<T>(params: modificationsRequested<T>[], activateAll?: boolean): Promise<T[]>;
  getModification<T> (params: modificationsRequested<T> | modificationsRequested<T>[], activateAll?: boolean): Promise<T | T[]> {
    return this.getStrategy().getModification(params, activateAll)
  }

  getModificationSync<T>(params: modificationsRequested<T>, activateAll?: boolean): T
  getModificationSync<T>(params: modificationsRequested<T>[], activateAll?: boolean): T[]
  getModificationSync<T> (params: modificationsRequested<T> | modificationsRequested<T>[], activateAll?: boolean): T | T[] {
    return this.getStrategy().getModificationSync(params, activateAll)
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

  activateModification(key: string): Promise<void>;
  activateModification(keys: { key: string; }[]): Promise<void>;
  activateModification(keys: string[]): Promise<void>;
  activateModification (params: string | Array<{ key: string }> | Array<string>): Promise<void> {
    return this.getStrategy().activateModification(params)
  }

  activateModificationSync(key: string): void
  activateModificationSync(keys: { key: string }[]): void
  activateModificationSync(keys: string[]): void
  activateModificationSync (params: string | Array<{ key: string }> | Array<string>): void {
    return this.getStrategy().activateModificationSync(params)
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
}
