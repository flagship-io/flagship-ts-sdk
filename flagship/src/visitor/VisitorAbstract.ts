import { Modification } from '../index'
import { IConfigManager, IFlagshipConfig } from '../config/index'
import { modificationsRequested, primitive } from '../types'
import { IVisitor } from './IVisitor'
import { CampaignDTO } from '../decision/api/models'
import { VISITOR_ID_ERROR } from '../enum/index'
import { logError } from '../utils/utils'
import { HitAbstract, IPage, IScreen, IEvent, IItem, ITransaction } from '../hit'
import { DefaultStrategy } from './DefaultStrategy'
import { VisitorStrategyAbstract } from './VisitorStrategyAbstract'
import { EventEmitter } from '../nodeDeps'

export abstract class VisitorAbstract extends EventEmitter implements IVisitor {
    protected _visitorId!: string;
    protected _context: Record<string, primitive>;
    protected _modifications: Map<string, Modification>;
    protected _configManager: IConfigManager;
    protected _config: IFlagshipConfig;
    protected _campaigns!: CampaignDTO[];
    protected _hasConsented!:boolean

    constructor (
      visitorId: string|null,
      context: Record<string, primitive>,
      configManager: IConfigManager
    ) {
      super()
      this.visitorId = visitorId || this.createVisitorId()
      this._modifications = new Map<string, Modification>()
      this._configManager = configManager
      this._config = configManager.config
      this._context = {}
      this.updateContext(context)
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

    /**
      * Set if visitor has consented for protected data usage.
      * @param {boolean} hasConsented True if the visitor has consented false otherwise.
      */
    public setConsent (hasConsented:boolean):void {
      this._hasConsented = hasConsented
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
      return this._config
    }

    public get campaigns () : CampaignDTO[] {
      return this._campaigns
    }

    public set campaigns (v : CampaignDTO[]) {
      this._campaigns = v
    }

    protected getStrategy (): VisitorStrategyAbstract {
      return new DefaultStrategy(this)
    }

    abstract updateContext(context: Record<string, primitive>): void
    abstract clearContext (): void

    abstract getModification<T>(params: modificationsRequested<T>, activateAll?: boolean): Promise<T>;
    abstract getModification<T>(params: modificationsRequested<T>[], activateAll?: boolean): Promise<T[]>;
    abstract getModification<T>(params: modificationsRequested<T> | modificationsRequested<T>[], activateAll?: boolean): Promise<T | T[]>;

    abstract getModificationSync<T>(params: modificationsRequested<T>, activateAll?: boolean): T
    abstract getModificationSync<T>(params: modificationsRequested<T>[], activateAll?: boolean): T[]
    abstract getModificationSync<T>(params: modificationsRequested<T> | modificationsRequested<T>[], activateAll?: boolean): T | T[]

    abstract getModificationInfo (key: string): Promise<Modification | null>

    abstract getModificationInfoSync (key: string): Modification | null

    abstract synchronizeModifications (): Promise<void>

    abstract activateModification(key: string): Promise<void>;
    abstract activateModification(keys: { key: string; }[]): Promise<void>;
    abstract activateModification(keys: string[]): Promise<void>;
    abstract activateModification (params: string | Array<{ key: string }> | Array<string>): Promise<void>

    abstract activateModificationSync(key: string): void
    abstract activateModificationSync(keys: { key: string }[]): void
    abstract activateModificationSync(keys: string[]): void
    abstract activateModificationSync (params: string | Array<{ key: string }> | Array<string>): void

    abstract sendHit(hit: HitAbstract): Promise<void>;
    abstract sendHit(hit: HitAbstract[]): Promise<void>;
    abstract sendHit(hit: IPage | IScreen | IEvent | IItem | ITransaction): Promise<void>;
    abstract sendHit(hit: (IPage | IScreen | IEvent | IItem | ITransaction)[]): Promise<void>;
    abstract sendHit (hit:IPage|IScreen|IEvent|IItem|ITransaction|
        Array<IPage|IScreen|IEvent|IItem|ITransaction>|
        HitAbstract|HitAbstract[]): Promise<void>

    abstract sendHitSync(hit: HitAbstract[]): void
    abstract sendHitSync(hit: HitAbstract): void
    abstract sendHitSync(hit: (IPage | IScreen | IEvent | IItem | ITransaction)[]): void
    abstract sendHitSync(hit: HitAbstract | IPage | IScreen | IEvent | IItem | ITransaction): void
    abstract sendHitSync (hit:IPage|IScreen|IEvent|IItem|ITransaction|
        Array<IPage|IScreen|IEvent|IItem|ITransaction>|
        HitAbstract|HitAbstract[]): void
}
