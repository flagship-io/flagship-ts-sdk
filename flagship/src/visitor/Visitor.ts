import { IHit, FlagDTO, primitive } from '../types'
import { EventEmitter } from '../depsNode.native'
import { IVisitor } from './IVisitor'
import { IFlagshipConfig } from '../config/index'
import { EMIT_READY } from '../enum/index'
import { HitAbstract } from '../hit/HitAbstract'
import { VisitorAbstract } from './VisitorAbstract'
import { IFlag } from '../flag/Flags'

/**
 * Represents a visitor in the Flagship SDK.
 *
 * The `Visitor` class extends `EventEmitter` and implements the `IVisitor` interface.
 */
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

  /**
   * @inheritdoc
   */
  getFlagsDataArray (): FlagDTO[] {
    return this.visitorDelegate.getFlagsDataArray()
  }

  /**
   * @inheritdoc
   */
  public get visitorId () : string {
    return this.visitorDelegate.visitorId
  }

  /**
   * @inheritdoc
   */
  public set visitorId (v : string) {
    this.visitorDelegate.visitorId = v
  }

  /**
   * @inheritdoc
   */
  public get anonymousId ():string|null {
    return this.visitorDelegate.anonymousId
  }

  /**
   * @inheritdoc
   */
  public get hasConsented (): boolean {
    return this.visitorDelegate.hasConsented
  }

  /**
   * @inheritdoc
   */
  public setConsent (hasConsented: boolean): void {
    this.visitorDelegate.setConsent(hasConsented)
  }

  /**
   * @inheritdoc
   */
  public get config (): IFlagshipConfig {
    return this.visitorDelegate.config
  }

  /**
   * @inheritdoc
   */
  public get context () : Record<string, primitive> {
    return this.visitorDelegate.context
  }

  /**
   * @inheritdoc
   */
  public get flagsData (): Map<string, FlagDTO> {
    return this.visitorDelegate.flagsData
  }

  /**
   * @inheritdoc
   */
  public updateContext(key: string, value: primitive):void
  public updateContext (context: Record<string, primitive>): void
  public updateContext (context: Record<string, primitive> | string, value?:primitive): void {
    this.visitorDelegate.updateContext(context, value)
  }

  /**
   * @inheritdoc
   */
  public clearContext (): void {
    this.visitorDelegate.clearContext()
  }

  /**
   * @inheritdoc
   */
  getFlag<T> (key:string, defaultValue:T):IFlag<T> {
    return this.visitorDelegate.getFlag(key, defaultValue)
  }

  /**
   * @inheritdoc
   */
  fetchFlags ():Promise<void> {
    return this.visitorDelegate.fetchFlags()
  }

  /**
   * @inheritdoc
   */
  sendHit(hit: HitAbstract): Promise<void>;
  sendHit(hit: IHit): Promise<void>;
  sendHit (hit: IHit|HitAbstract): Promise<void> {
    return this.visitorDelegate.sendHit(hit)
  }

  /**
   * @inheritdoc
   */
  sendHits(hits: HitAbstract[]): Promise<void>;
  sendHits(hits: IHit[]): Promise<void>;
  sendHits (hits: HitAbstract[] | IHit[]): Promise<void> {
    return this.visitorDelegate.sendHits(hits)
  }

  /**
   * @inheritdoc
   */
  authenticate (visitorId: string): void {
    this.visitorDelegate.authenticate(visitorId)
  }

  /**
   * @inheritdoc
   */
  unauthenticate (): void {
    this.visitorDelegate.unauthenticate()
  }
}
