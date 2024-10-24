import { IHit, primitive } from '../types'
import { EventEmitter } from '../depsNode.native'
import { IVisitor } from './IVisitor'
import { IFlagshipConfig } from '../config/index'
import { EMIT_READY } from '../enum/index'
import { HitAbstract } from '../hit/HitAbstract'
import { VisitorAbstract } from './VisitorAbstract'
import { IFSFlag } from '../flag/IFSFlag'
import { IFSFlagCollection } from '../flag/IFSFlagCollection'

/**
 * The `Visitor` class represents a unique user within your application. It aids in
 * managing the visitor's data and fetching the corresponding flags for the visitor
 * from the [Flagship platform](https://app.flagship.io) .
 */
export class Visitor extends EventEmitter implements IVisitor {
  private visitorDelegate:VisitorAbstract
  private _onReady:((err:unknown)=>void)
  public constructor (visitorDelegate: VisitorAbstract) {
    super()
    this.visitorDelegate = visitorDelegate

    this._onReady = (err:unknown) => {
      this.emit(EMIT_READY, err)
    }
    this.visitorDelegate.on(EMIT_READY, this._onReady)
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
  public get fetchStatus () {
    return this.visitorDelegate.fetchStatus
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
  getFlag (key:string):IFSFlag {
    return this.visitorDelegate.getFlag(key)
  }

  /**
   * @inheritdoc
   */
  getFlags (): IFSFlagCollection {
    return this.visitorDelegate.getFlags()
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
  sendHit (hit: IHit|HitAbstract): Promise<void>
  sendHit (hit: IHit|HitAbstract): Promise<void> {
    return this.visitorDelegate.sendHit(hit)
  }

  /**
   * @inheritdoc
   */
  sendHits(hits: HitAbstract[]): Promise<void>;
  sendHits(hits: IHit[]): Promise<void>;
  sendHits (hits: HitAbstract[] | IHit[]): Promise<void>
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

  updateContextAsync(context: Record<string, primitive>): Promise<void>
  updateContextAsync(key: string, value: primitive): Promise<void>
  updateContextAsync (context: Record<string, primitive> | string, value?:primitive): Promise<void> {
    return this.visitorDelegate.updateContextAsync(context, value)
  }

  clearContextAsync (): Promise<void> {
    return this.visitorDelegate.clearContextAsync()
  }

  authenticateAsync (visitorId: string): Promise<void> {
    return this.visitorDelegate.authenticateAsync(visitorId)
  }

  unauthenticateAsync (): Promise<void> {
    return this.visitorDelegate.unauthenticateAsync()
  }

  /**
   * @inheritdoc
   */
  public cleanup (): void {
    this.visitorDelegate.cleanup()
    this.visitorDelegate.off(EMIT_READY, this._onReady)
  }
}
