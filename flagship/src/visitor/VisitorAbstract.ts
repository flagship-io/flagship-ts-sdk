import { Modification } from '../index'
import { DecisionMode, IConfigManager, IFlagshipConfig } from '../config/index'
import { IHit, modificationsRequested, primitive } from '../types'
import { IVisitor } from './IVisitor'
import { CampaignDTO } from '../decision/api/models'
import { FlagshipStatus, SDK_LANGUAGE, SDK_VERSION, VISITOR_ID_ERROR } from '../enum/index'
import { logError } from '../utils/utils'
import { HitAbstract, HitShape } from '../hit/index'
import { DefaultStrategy } from './DefaultStrategy'
import { VisitorStrategyAbstract } from './VisitorStrategyAbstract'
import { EventEmitter } from '../nodeDeps'
import { Flagship } from '../main/Flagship'
import { NotReadyStrategy } from './NotReadyStrategy'
import { PanicStrategy } from './PanicStrategy'
import { NoConsentStrategy } from './NoConsentStrategy'
import { cacheVisitor } from './VisitorCache'
import { VisitorLookupCacheDTO } from '../models/visitorDTO'

export abstract class VisitorAbstract extends EventEmitter implements IVisitor {
    protected _visitorId!: string;
    protected _context: Record<string, primitive>;
    protected _modifications!: Map<string, Modification>;
    protected _configManager: IConfigManager;
    protected _campaigns!: CampaignDTO[];
    protected _hasConsented!:boolean;
    protected _anonymousId!:string|null;
    public deDuplicationCache:Record<string, number>
    protected _isCleaningDeDuplicationCache:boolean
    public visitorCache!: VisitorLookupCacheDTO
    protected _strategy!:VisitorStrategyAbstract

    constructor (param: {
        visitorId?: string|null,
        isAuthenticated?:boolean,
        hasConsented?: boolean
        context: Record<string, primitive>,
        configManager: IConfigManager,
        initialCampaigns?: CampaignDTO[]
        initialModifications?: Map<string, Modification>| Modification[]
      }) {
      const { visitorId, configManager, context, isAuthenticated, hasConsented, initialModifications, initialCampaigns } = param
      super()
      this._isCleaningDeDuplicationCache = false
      this.deDuplicationCache = {}
      this._configManager = configManager
      if (!hasConsented) {
        this.setConsent(false)
      }
      this.hasConsented = hasConsented ?? true
      const VisitorCache = this.config.enableClientCache ? cacheVisitor.loadVisitorProfile() : null
      this.visitorId = visitorId || VisitorCache?.visitorId || this.createVisitorId()
      this.campaigns = []

      this._context = {}
      this.updateContext(context)
      this._anonymousId = VisitorCache?.anonymousId || null
      this.loadPredefinedContext()

      if (!this._anonymousId && isAuthenticated && this.config.decisionMode === DecisionMode.DECISION_API) {
        this._anonymousId = this.uuidV4()
      }
      this.updateCache()
      this.setInitialModifications(initialModifications)
      this.setInitializeCampaigns(initialCampaigns, !!initialModifications)

      this.getStrategy().lookupVisitor()
      this.getStrategy().lookupHits()
    }

    public clearDeDuplicationCache (deDuplicationTime:number):void {
      if (this._isCleaningDeDuplicationCache) {
        return
      }
      this._isCleaningDeDuplicationCache = true
      const entries = Object.entries(this.deDuplicationCache)

      for (const [key, value] of entries) {
        if ((Date.now() - value) > (deDuplicationTime * 1000)) {
          delete this.deDuplicationCache[key]
        }
      }
      this._isCleaningDeDuplicationCache = false
    }

    public getModificationsArray (): Modification[] {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      return Array.from(this._modifications, ([_key, item]) => item)
    }

    protected setInitialModifications (modifications?:Map<string, Modification>| Modification[]):void {
      this._modifications = new Map<string, Modification>()
      if (!modifications || (!(modifications instanceof Map) && !Array.isArray(modifications))) {
        return
      }
      modifications.forEach(item => {
        this._modifications.set(item.key, item)
      })
    }

    protected setInitializeCampaigns (campaigns?:CampaignDTO[], hasModifications?:boolean):void {
      if (campaigns && Array.isArray(campaigns) && !hasModifications) {
        this.getStrategy().updateCampaigns(campaigns)
      }
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
      const isSameType = (strategy: VisitorStrategyAbstract, className:string) => strategy && strategy.constructor.name === className
      if (!Flagship.getStatus() || Flagship.getStatus() === FlagshipStatus.NOT_INITIALIZED) {
        this._strategy = isSameType(this._strategy, NotReadyStrategy.name) ? this._strategy : new NotReadyStrategy(this)
      } else if (Flagship.getStatus() === FlagshipStatus.READY_PANIC_ON) {
        this._strategy = isSameType(this._strategy, PanicStrategy.name) ? this._strategy : new PanicStrategy(this)
      } else if (!this.hasConsented) {
        this._strategy = isSameType(this._strategy, NoConsentStrategy.name) ? this._strategy : new NoConsentStrategy(this)
      } else {
        this._strategy = isSameType(this._strategy, DefaultStrategy.name) ? this._strategy : new DefaultStrategy(this)
      }

      return this._strategy
    }

    abstract updateContext(context: Record<string, primitive>): void
    abstract clearContext (): void

    abstract getModification<T>(params: modificationsRequested<T>): Promise<T>;
    abstract getModificationSync<T>(params: modificationsRequested<T>): T

    abstract getModifications<T> (params: modificationsRequested<T>[], activateAll?: boolean): Promise<Record<string, T>>
    abstract getModificationsSync<T> (params: modificationsRequested<T>[], activateAll?: boolean): Record<string, T>

    abstract getModificationInfo (key: string): Promise<Modification | null>

    abstract getModificationInfoSync (key: string): Modification | null

    abstract synchronizeModifications (): Promise<void>

    abstract activateModification(key: string): Promise<void>;

    abstract activateModifications(keys: { key: string; }[]): Promise<void>;
    abstract activateModifications(keys: string[]): Promise<void>;
    abstract activateModifications (params: Array<{ key: string }> | Array<string>): Promise<void>

    abstract sendHit(hit: HitAbstract): Promise<void>;
    abstract sendHit(hit: IHit): Promise<void>;
    abstract sendHit(hit: HitShape): Promise<void>;
    abstract sendHit(hit: IHit|HitAbstract|HitShape): Promise<void>;

    abstract sendHits(hit: HitAbstract[]): Promise<void>;
    abstract sendHits(hit: IHit[]): Promise<void>;
    abstract sendHits(hit: HitShape[]): Promise<void>;
    abstract sendHits (hit: HitAbstract[]|IHit[]|HitShape[]): Promise<void>

    abstract getAllModifications (activate: boolean): Promise<{ visitorId: string; campaigns: CampaignDTO[] }>

    abstract getModificationsForCampaign (campaignId: string, activate: boolean): Promise<{ visitorId: string; campaigns: CampaignDTO[] }>

    abstract authenticate(visitorId: string): void
    abstract unauthenticate(): void
}
