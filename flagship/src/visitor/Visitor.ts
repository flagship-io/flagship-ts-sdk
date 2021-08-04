import { Modification } from '../model/Modification'
import { HitAbstract, IPage, IScreen } from '../hit/index'
import { IEvent } from '../hit/Event'
import { IItem } from '../hit/Item'
import { ITransaction } from '../hit/Transaction'
import { modificationsRequested, primitive } from '../types'
import { EventEmitter } from '../nodeDeps'
import { IVisitor } from './IVisitor'
import { VisitorAbstract } from './VisitorAbstract'
import { IFlagshipConfig } from '../config'
import { EMIT_READY } from '../enum/index'
import { CampaignDTO } from '../decision/api/models'

export class Visitor extends EventEmitter implements IVisitor {
  private visitorDelegate:VisitorAbstract
  public constructor (visitorDelegate: VisitorAbstract) {
    super()
    this.visitorDelegate = visitorDelegate
    this.visitorDelegate.on(EMIT_READY, err => {
      this.emit(EMIT_READY, err)
    })
  }

  public get visitorId () : string {
    return this.visitorDelegate.visitorId
  }

  public set visitorId (v : string) {
    this.visitorDelegate.visitorId = v
  }

  public get hasConsented (): boolean {
    return this.visitorDelegate.hasConsented
  }

  public setConsent (hasConsented: boolean): void {
    this.visitorDelegate.setConsent(hasConsented)
  }

  public get config (): IFlagshipConfig {
    return this.visitorDelegate.config
  }

  public get context () : Record<string, primitive> {
    return this.visitorDelegate.context
  }

  public get modifications (): Map<string, Modification> {
    return this.visitorDelegate.modifications
  }

  public updateContext (context: Record<string, primitive>): void {
    this.visitorDelegate.updateContext(context)
  }

  public clearContext (): void {
    this.visitorDelegate.clearContext()
  }

  getModification<T>(params: modificationsRequested<T>, activateAll?: boolean): Promise<T>
  getModification<T>(params: modificationsRequested<T>[], activateAll?: boolean): Promise<T[]>
  getModification<T> (params: modificationsRequested<T> | modificationsRequested<T>[], activateAll?: boolean): Promise<T | T[]> {
    return this.visitorDelegate.getModification(params, activateAll)
  }

  getModificationSync<T>(params: modificationsRequested<T>, activateAll?: boolean): T
  getModificationSync<T>(params: modificationsRequested<T>[], activateAll?: boolean): T[]
  getModificationSync<T> (params: modificationsRequested<T> | modificationsRequested<T>[], activateAll?: boolean): T | T[] {
    return this.visitorDelegate.getModificationSync(params, activateAll)
  }

  getModificationInfo (key: string): Promise<Modification | null> {
    return this.visitorDelegate.getModificationInfo(key)
  }

  getModificationInfoSync (key: string): Modification | null {
    return this.visitorDelegate.getModificationInfoSync(key)
  }

  synchronizeModifications (): Promise<void> {
    return this.visitorDelegate.synchronizeModifications()
  }

  activateModification(key: string): Promise<void>
  activateModification(keys: { key: string }[]): Promise<void>
  activateModification(keys: string[]): Promise<void>
  activateModification (params: string | Array<{ key: string }> | Array<string>): Promise<void> {
    return this.visitorDelegate.activateModification(params)
  }

  activateModificationSync(key: string): void
  activateModificationSync(keys: { key: string }[]): void
  activateModificationSync(keys: string[]): void
  activateModificationSync (params: string | Array<{ key: string }> | Array<string>): void {
    this.visitorDelegate.activateModificationSync(params)
  }

  sendHit(hit: HitAbstract): Promise<void>
  sendHit(hit: HitAbstract[]): Promise<void>
  sendHit(hit: IPage | IScreen | IEvent | IItem | ITransaction): Promise<void>
  sendHit(hit: (IPage | IScreen | IEvent | IItem | ITransaction)[]): Promise<void>
  sendHit (hit:IPage|IScreen|IEvent|IItem|ITransaction|
    Array<IPage|IScreen|IEvent|IItem|ITransaction>|
    HitAbstract|HitAbstract[]): Promise<void> {
    return this.visitorDelegate.sendHit(hit)
  }

  sendHitSync(hit: HitAbstract[]): void
  sendHitSync(hit: HitAbstract): void
  sendHitSync(hit: (IPage | IScreen | IEvent | IItem | ITransaction)[]): void
  sendHitSync(hit: HitAbstract | IPage | IScreen | IEvent | IItem | ITransaction): void
  sendHitSync (hit:IPage|IScreen|IEvent|IItem|ITransaction|
    Array<IPage|IScreen|IEvent|IItem|ITransaction>|
    HitAbstract|HitAbstract[]): void {
    return this.visitorDelegate.sendHitSync(hit)
  }

  getAllModifications (activate = false): Promise<{ visitorId: string; campaigns: CampaignDTO[] }> {
    return this.visitorDelegate.getAllModifications(activate)
  }

  getModificationsForCampaign (campaignId: string, activate = false): Promise<{ visitorId: string; campaigns: CampaignDTO[] }> {
    return this.visitorDelegate.getModificationsForCampaign(campaignId, activate)
  }
}
