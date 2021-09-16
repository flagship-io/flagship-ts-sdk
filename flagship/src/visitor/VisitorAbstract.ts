import { Modification } from '../index'
import { DecisionMode, IConfigManager, IFlagshipConfig } from '../config/index'
import { IHit, modificationsRequested, primitive } from '../types'
import { IVisitor } from './IVisitor'
import { CampaignDTO } from '../decision/api/models'
import { FlagshipStatus, SDK_LANGUAGE, SDK_VERSION, VISITOR_ID_ERROR } from '../enum/index'
import { logError } from '../utils/utils'
import { HitAbstract } from '../hit/index'
import { DefaultStrategy } from './DefaultStrategy'
import { VisitorStrategyAbstract } from './VisitorStrategyAbstract'
import { EventEmitter } from '../nodeDeps'
import { Flagship } from '../main/Flagship'
import { NotReadyStrategy } from './NotReadyStrategy'
import { PanicStrategy } from './PanicStrategy'
import { NoConsentStrategy } from './NoConsentStrategy'
import { cacheVisitor } from './VisitorCache'

export abstract class VisitorAbstract extends EventEmitter implements IVisitor {
    protected _visitorId!: string;
    protected _context: Record<string, primitive>;
    protected _modifications: Map<string, Modification>;
    protected _configManager: IConfigManager;
    protected _campaigns!: CampaignDTO[];
    protected _hasConsented!:boolean;
    protected _anonymousId!:string|null;

    constructor (param: {
        visitorId?: string|null,
        isAuthenticated?:boolean,
        hasConsented?: boolean
        context: Record<string, primitive>,
        configManager: IConfigManager
      }) {
      const { visitorId, configManager, context, isAuthenticated, hasConsented } = param
      super()
      this._configManager = configManager
      const VisitorCache = this.config.enableClientCache ? cacheVisitor.loadVisitorProfile() : null
      this.visitorId = visitorId || VisitorCache?.visitorId || this.createVisitorId()
      this._modifications = new Map<string, Modification>()
      this.campaigns = []

      this._context = {}
      this.updateContext(context)
      this._anonymousId = VisitorCache?.anonymousId || null
      this.loadPredefinedContext()

      if (!hasConsented) {
        this.setConsent(hasConsented ?? false)
      }
      this.hasConsented = hasConsented ?? false

      if (!this._anonymousId && isAuthenticated && this.config.decisionMode === DecisionMode.DECISION_API) {
        this._anonymousId = this.uuidV4()
      }

      this.updateCache()
    }

    protected updateCache ():void {
      const visitorProfil = {
        visitorId: this.visitorId,
        anonymousId: this.anonymousId
      }
      cacheVisitor.saveVisitorProfile(visitorProfil)
    }

    protected loadPredefinedContext ():void {
      this.context.fs_client = SDK_LANGUAGE
      this.context.fs_version = SDK_VERSION
      this.context.fs_users = this.visitorId
    }

    protected uuidV4 ():string {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (char) {
        const rand = Math.random() * 16 | 0
        const value = char === 'x' ? rand : (rand & 0x3 | 0x8)
        return value.toString(16)
      })
    }

    protected createVisitorId (): string {
      const now = new Date()
      const random = Math.floor(Math.random() * (99999 - 10000) + 10000)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const twoDigits = (value: any): any => (value.toString().length === 1 ? `0${value}` : value)
      return `${now.getFullYear()}${twoDigits(now.getMonth() + 1)}${twoDigits(now.getDate())}${twoDigits(now.getHours())}${twoDigits(
            now.getMinutes()
        )}${random}`
    }

    public get visitorId (): string {
      return this._visitorId
    }

    public set visitorId (v: string) {
      if (!v || typeof v !== 'string') {
        logError(this.config, VISITOR_ID_ERROR, 'VISITOR ID')
        return
      }
      this._visitorId = v
    }

    /**
     * Return True or False if the visitor has consented for protected data usage.
     * @return bool
     */
    public get hasConsented ():boolean {
      return this._hasConsented
    }

    public set hasConsented (v:boolean) {
      this._hasConsented = v
    }

    /**
      * Set if visitor has consented for protected data usage.
      * @param {boolean} hasConsented True if the visitor has consented false otherwise.
      */
    public setConsent (hasConsented:boolean):void {
      this.getStrategy().setConsent(hasConsented)
    }

    public get context (): Record<string, primitive> {
      return this._context
    }

    /**
    * Clear the current context and set a new context value
    */
    public set context (v: Record<string, primitive>) {
      this._context = {}
      this.updateContext(v)
    }

    public get modifications (): Map<string, Modification> {
      return this._modifications
    }

    public set modifications (v:Map<string, Modification>) {
      this._modifications = v
    }

    get configManager (): IConfigManager {
      return this._configManager
    }

    public get config (): IFlagshipConfig {
      return this.configManager.config
    }

    public get campaigns () : CampaignDTO[] {
      return this._campaigns
    }

    public set campaigns (v : CampaignDTO[]) {
      this._campaigns = v
    }

    public get anonymousId () : string|null {
      return this._anonymousId
    }

    public set anonymousId (v : string|null) {
      this._anonymousId = v
    }

    protected getStrategy (): VisitorStrategyAbstract {
      let strategy:VisitorStrategyAbstract
      if (!Flagship.getStatus() || Flagship.getStatus() === FlagshipStatus.NOT_INITIALIZED) {
        strategy = new NotReadyStrategy(this)
      } else if (Flagship.getStatus() === FlagshipStatus.READY_PANIC_ON) {
        strategy = new PanicStrategy(this)
      } else if (!this.hasConsented) {
        strategy = new NoConsentStrategy(this)
      } else {
        strategy = new DefaultStrategy(this)
      }

      return strategy
    }

    abstract updateContext(context: Record<string, primitive>): void
    abstract clearContext (): void

    abstract getModification<T>(params: modificationsRequested<T>, activateAll?: boolean): Promise<T>;
    abstract getModificationSync<T>(params: modificationsRequested<T>, activateAll?: boolean): T

    abstract getModifications<T> (params: modificationsRequested<T>[], activateAll?: boolean): Promise<T[]>
    abstract getModificationsSync<T> (params: modificationsRequested<T>[], activateAll?: boolean): T[]

    abstract getModificationInfo (key: string): Promise<Modification | null>

    abstract getModificationInfoSync (key: string): Modification | null

    abstract synchronizeModifications (): Promise<void>

    abstract activateModification(key: string): Promise<void>;
    abstract activateModificationSync(key: string): void

    abstract activateModifications(keys: { key: string; }[]): Promise<void>;
    abstract activateModifications(keys: string[]): Promise<void>;
    abstract activateModifications (params: Array<{ key: string }> | Array<string>): Promise<void>

    abstract activateModificationsSync(keys: { key: string }[]): void
    abstract activateModificationsSync(keys: string[]): void
    abstract activateModificationsSync (params:Array<{ key: string }> | Array<string>): void

    abstract sendHit(hit: HitAbstract): Promise<void>;
    abstract sendHit(hit: IHit): Promise<void>;
    abstract sendHit(hit: IHit|HitAbstract): Promise<void>;

    abstract sendHitSync(hit: HitAbstract): void;
    abstract sendHitSync(hit: IHit): void;
    abstract sendHitSync(hit: IHit|HitAbstract): void;

    abstract sendHits(hit: HitAbstract[]): Promise<void>;
    abstract sendHits(hit: IHit[]): Promise<void>;
    abstract sendHits (hit: HitAbstract[]|IHit[]): Promise<void>

    abstract sendHitsSync(hit: HitAbstract[]): void;
    abstract sendHitsSync(hit: IHit[]): void;
    abstract sendHitsSync (hit: HitAbstract[]|IHit[]): void

    abstract getAllModifications (activate: boolean): Promise<{ visitorId: string; campaigns: CampaignDTO[] }>

    abstract getModificationsForCampaign (campaignId: string, activate: boolean): Promise<{ visitorId: string; campaigns: CampaignDTO[] }>

    abstract authenticate(visitorId: string): void
    abstract unauthenticate(): void
}
