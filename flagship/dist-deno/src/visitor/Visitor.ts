import { Modification } from '../model/Modification.ts'
import { HitAbstract, IPage, IScreen } from '../hit/index.ts'
import { IEvent } from '../hit/Event.ts'
import { IItem } from '../hit/Item.ts'
import { ITransaction } from '../hit/Transaction.ts'
import { modificationsRequested, primitive } from '../types.ts'
import { EventEmitter } from '../deps.ts'
import { IVisitor } from './IVisitor.ts'
import { VisitorAbstract } from './VisitorAbstract.ts'
import { IFlagshipConfig } from '../config/index.ts'
import { EMIT_READY } from '../enum/index.ts'
import { CampaignDTO } from '../decision/api/models.ts'

export class Visitor extends EventEmitter implements IVisitor {
  private visitorDelegate:VisitorAbstract
  public constructor (visitorDelegate: VisitorAbstract) {
    super()
    this.visitorDelegate = visitorDelegate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.visitorDelegate.on(EMIT_READY, (err:any) => {
      this.emit(EMIT_READY, err)
    })
  }

  public get visitorId () : string {
    return this.visitorDelegate.visitorId
  }

  public set visitorId (v : string) {
    this.visitorDelegate.visitorId = v
  }

  public get anonymousId ():string|null {
    return this.visitorDelegate.anonymousId
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
  getModification<T> (params: modificationsRequested<T> | modificationsRequested<T>[], activateAll?: boolean): Promise<T | T[]>
  getModification<T> (params: modificationsRequested<T> | modificationsRequested<T>[], activateAll?: boolean): Promise<T | T[]> {
    return this.visitorDelegate.getModification(params, activateAll)
  }

  getModificationSync<T>(params: modificationsRequested<T>, activateAll?: boolean): T
  getModificationSync<T>(params: modificationsRequested<T>[], activateAll?: boolean): T[]
  getModificationSync<T> (params: modificationsRequested<T> | modificationsRequested<T>[], activateAll?: boolean): T | T[]
  getModificationSync<T> (params: modificationsRequested<T> | modificationsRequested<T>[], activateAll?: boolean): T | T[] {
    return this.visitorDelegate.getModificationSync(params, activateAll)
  }

  getModificationInfo (key: string): Promise<Modification | null> {
    return this.visitorDelegate.getModificationInfo(key)
  }

<<<<<<< HEAD
  getModificationInfoSync (key: string): Modification | null {
    return this.visitorDelegate.getModificationInfoSync(key)
=======
  /**
   * This function calls the decision api and update all the campaigns modifications
   * from the server according to the visitor context.
   */
  public async synchronizeModifications (): Promise<void> {
    return new Promise((resolve, reject) => {
      this.configManager.decisionManager.getCampaignsAsync(this)
        .then(campaigns => {
          this._campaigns = campaigns
          this._modifications = this.configManager.decisionManager.getModifications(this._campaigns)
          this.emit('ready')
          resolve()
        })
        .catch(error => {
          this.emit('ready', error)
          logError(this.config, error.message, PROCESS_SYNCHRONIZED_MODIFICATION)
          resolve()
        })
    })
>>>>>>> deno-qa-v1-refactor
  }

  synchronizeModifications (): Promise<void> {
    return this.visitorDelegate.synchronizeModifications()
  }

  activateModification(key: string): Promise<void>
  activateModification(keys: { key: string }[]): Promise<void>
  activateModification(keys: string[]): Promise<void>
  activateModification (params: string | Array<{ key: string }> | Array<string>): Promise<void>
  activateModification (params: string | Array<{ key: string }> | Array<string>): Promise<void> {
    return this.visitorDelegate.activateModification(params)
  }

<<<<<<< HEAD
  activateModificationSync(key: string): void
  activateModificationSync(keys: { key: string }[]): void
  activateModificationSync(keys: string[]): void
  activateModificationSync (params: string | Array<{ key: string }> | Array<string>): void
  activateModificationSync (params: string | Array<{ key: string }> | Array<string>): void {
    this.visitorDelegate.activateModificationSync(params)
=======
  private activate (key: string) {
    const modification = this.modifications.get(key)

    if (!modification) {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_ERROR, key),
        PROCESS_ACTIVE_MODIFICATION
      )
      return
    }

    if (!this.hasTrackingManager(PROCESS_ACTIVE_MODIFICATION)) {
      return
    }

    this.configManager.trackingManager
      .sendActive(this, modification)
      .catch((error) => {
        logError(this.config, error.message || error, PROCESS_ACTIVE_MODIFICATION)
      })
>>>>>>> deno-qa-v1-refactor
  }

  sendHit(hit: HitAbstract): Promise<void>
  sendHit(hit: HitAbstract[]): Promise<void>
  sendHit(hit: IPage | IScreen | IEvent | IItem | ITransaction): Promise<void>
  sendHit(hit: (IPage | IScreen | IEvent | IItem | ITransaction)[]): Promise<void>
  sendHit (hit:IPage|IScreen|IEvent|IItem|ITransaction|
    Array<IPage|IScreen|IEvent|IItem|ITransaction>|
    HitAbstract|HitAbstract[]): Promise<void>

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
    HitAbstract|HitAbstract[]): void

  sendHitSync (hit:IPage|IScreen|IEvent|IItem|ITransaction|
    Array<IPage|IScreen|IEvent|IItem|ITransaction>|
    HitAbstract|HitAbstract[]): void {
    return this.visitorDelegate.sendHitSync(hit)
  }

<<<<<<< HEAD
  getAllModifications (activate = false): Promise<{ visitorId: string; campaigns: CampaignDTO[] }> {
    return this.visitorDelegate.getAllModifications(activate)
=======
  private async prepareAndSendHit (hit:IPage|IScreen|IEvent|IItem|ITransaction|HitAbstract) {
    let hitInstance:HitAbstract
    if (hit instanceof HitAbstract) {
      hitInstance = hit
    } else {
      const hitFromInt = this.getHit(hit)
      if (!hitFromInt) {
        logError(this.config, TYPE_HIT_REQUIRED_ERROR, PROCESS_SEND_HIT)
        return
      }
      hitInstance = hitFromInt
    }
    hitInstance.visitorId = this.visitorId
    hitInstance.ds = SDK_APP
    hitInstance.config = this.config

    if (!hitInstance.isReady()) {
      logError(this.config, hitInstance.getErrorMessage(), PROCESS_SEND_HIT)
      return
    }
    this.configManager.trackingManager.sendHit(hitInstance).catch((error) => {
      logError(this.config, error.message || error, PROCESS_SEND_HIT)
    })
>>>>>>> deno-qa-v1-refactor
  }

  getModificationsForCampaign (campaignId: string, activate = false): Promise<{ visitorId: string; campaigns: CampaignDTO[] }> {
    return this.visitorDelegate.getModificationsForCampaign(campaignId, activate)
  }

  authenticate (visitorId: string): void {
    this.visitorDelegate.authenticate(visitorId)
  }

  unauthenticate (): void {
    this.visitorDelegate.unauthenticate()
  }
}
