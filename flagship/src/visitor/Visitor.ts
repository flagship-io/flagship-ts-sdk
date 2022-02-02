import { HitShape, IHit, FlagDTO, modificationsRequested, primitive } from '../types'
import { EventEmitter } from '../nodeDeps'
import { IVisitor } from './IVisitor'
import { IFlagshipConfig } from '../config/index'
import { EMIT_READY } from '../enum/index'
import { CampaignDTO } from '../decision/api/models'
import { HitAbstract } from '../hit/HitAbstract'
import { VisitorAbstract } from './VisitorAbstract'
import { IFlag } from '../flag/Flags'

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

  getModificationsArray (): FlagDTO[] {
    return this.visitorDelegate.getModificationsArray()
  }

  getFlagsDataArray (): FlagDTO[] {
    return this.visitorDelegate.getFlagsDataArray()
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

  public get flagsData (): Map<string, FlagDTO> {
    return this.visitorDelegate.flagsData
  }

  public get modifications (): Map<string, FlagDTO> {
    return this.visitorDelegate.flagsData
  }

  public updateContext (context: Record<string, primitive>): void {
    this.visitorDelegate.updateContext(context)
  }

  public clearContext (): void {
    this.visitorDelegate.clearContext()
  }

  getFlag<T> (key:string, defaultValue:T):IFlag<T> {
    return this.visitorDelegate.getFlag(key, defaultValue)
  }

  getModification<T> (params: modificationsRequested<T>): Promise<T> {
    return this.visitorDelegate.getModification(params)
  }

  getModificationSync<T> (params: modificationsRequested<T>): T {
    return this.visitorDelegate.getModificationSync(params)
  }

  getModifications<T> (params: modificationsRequested<T>[], activateAll?: boolean): Promise<Record<string, T>> {
    return this.visitorDelegate.getModifications(params, activateAll)
  }

  getModificationsSync<T> (params: modificationsRequested<T>[], activateAll?: boolean): Record<string, T> {
    return this.visitorDelegate.getModificationsSync(params, activateAll)
  }

  getModificationInfo (key: string): Promise<FlagDTO | null> {
    return this.visitorDelegate.getModificationInfo(key)
  }

  getModificationInfoSync (key: string): FlagDTO | null {
    return this.visitorDelegate.getModificationInfoSync(key)
  }

  synchronizeModifications (): Promise<void> {
    return this.visitorDelegate.synchronizeModifications()
  }

  fetchFlags ():Promise<void> {
    return this.visitorDelegate.fetchFlags()
  }

  activateModification (key: string): Promise<void> {
    return this.visitorDelegate.activateModification(key)
  }

  activateModifications(keys: { key: string }[]): Promise<void>
  activateModifications(keys: string[]): Promise<void>
  activateModifications (params: Array<{ key: string }> | Array<string>): Promise<void>
  activateModifications (params: Array<{ key: string }> | Array<string>): Promise<void> {
    return this.visitorDelegate.activateModifications(params)
  }

  sendHit(hit: HitAbstract): Promise<void>;
  sendHit(hit: IHit): Promise<void>;
  sendHit(hit: HitShape): Promise<void>;
  sendHit (hit: IHit|HitAbstract|HitShape): Promise<void>
  sendHit (hit: IHit|HitAbstract|HitShape): Promise<void> {
    return this.visitorDelegate.sendHit(hit)
  }

  sendHits(hits: HitAbstract[]): Promise<void>;
  sendHits(hits: IHit[]): Promise<void>;
  sendHits(hit: HitShape[]): Promise<void>;
  sendHits(hits: HitAbstract[] | IHit[]|HitShape[]): Promise<void>
  sendHits (hits: HitAbstract[]|IHit[]|HitShape[]): Promise<void> {
    return this.visitorDelegate.sendHits(hits)
  }

  getAllModifications (activate = false): Promise<{ visitorId: string; campaigns: CampaignDTO[] }> {
    return this.visitorDelegate.getAllModifications(activate)
  }

  getModificationsForCampaign (campaignId: string, activate = false): Promise<{ visitorId: string; campaigns: CampaignDTO[] }> {
    return this.visitorDelegate.getModificationsForCampaign(campaignId, activate)
  }

  getAllFlagsData (activate = false): Promise<{ visitorId: string; campaigns: CampaignDTO[] }> {
    return this.visitorDelegate.getAllFlagsData(activate)
  }

  getFlatsDataForCampaign (campaignId: string, activate = false): Promise<{ visitorId: string; campaigns: CampaignDTO[] }> {
    return this.visitorDelegate.getFlatsDataForCampaign(campaignId, activate)
  }

  authenticate (visitorId: string): void {
    this.visitorDelegate.authenticate(visitorId)
  }

  unauthenticate (): void {
    this.visitorDelegate.unauthenticate()
  }
}
