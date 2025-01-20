import { IHit, primitive } from '../types.ts'
import { EventEmitter } from '../depsDeno.ts'
import { IVisitor } from './IVisitor.ts'
import { IFlagshipConfig } from '../config/index.ts'
import { EMIT_READY } from '../enum/index.ts'
import { HitAbstract } from '../hit/HitAbstract.ts'
import { VisitorAbstract } from './VisitorAbstract.ts'
import { IFSFlag } from '../flag/IFSFlag.ts'
import { IFSFlagCollection } from '../flag/IFSFlagCollection.ts'
import { IVisitorEvent } from '../emotionAI/hit/IVisitorEvent.ts'
import { IPageView } from '../emotionAI/hit/IPageView.ts'

/**
 * The `Visitor` class represents a unique user within your application. It aids in
 * managing the visitor's data and fetching the corresponding flags for the visitor
 * from the [Flagship platform](https://app.flagship.io/login) .
 */
export class Visitor extends EventEmitter implements IVisitor {
  private visitorDelegate:VisitorAbstract
  private _onReady:((err:any)=>void)
  public constructor (visitorDelegate: VisitorAbstract) {
    super()
    this.visitorDelegate = visitorDelegate
    this._onReady = (err:any) => {
      this.emit(EMIT_READY, err)
    }
    this.visitorDelegate.on(EMIT_READY, this._onReady)

    const instance = this as any

    instance.sendEaiVisitorEvent = (event: IVisitorEvent) => {
      this.visitorDelegate.sendEaiVisitorEvent(event)
    }

    instance.sendEaiPageView = (pageView: IPageView) => {
      this.visitorDelegate.sendEaiPageView(pageView)
    }

    instance.onEAICollectStatusChange = (callback: (status: boolean) => void) => {
      this.visitorDelegate.onEAICollectStatusChange(callback)
    }
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

  /**
   * @inheritdoc
   */
  collectEAIEventsAsync (...args: unknown[]): Promise<void> {
    let currentPage: IPageView | undefined
    if (args.length > 0) {
      currentPage = args[0] as IPageView
    }
    return this.visitorDelegate.collectEAIEventsAsync(currentPage)
  }

  /**
   * @inheritdoc
   */

  public cleanup (): void {
    this.visitorDelegate.cleanup()
    this.visitorDelegate.off(EMIT_READY, this._onReady)
  }
}
