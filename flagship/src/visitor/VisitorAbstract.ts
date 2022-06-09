import { DecisionMode, IConfigManager, IFlagshipConfig } from '../config/index'
import { IHit, Modification, NewVisitor, modificationsRequested, primitive, VisitorCacheDTO, FlagDTO } from '../types'

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
import { IFlag } from '../flag/Flags'
import { IFlagMetadata } from '../flag/FlagMetadata'

export abstract class VisitorAbstract extends EventEmitter implements IVisitor {
  protected _visitorId!: string;
  protected _context: Record<string, primitive>;
  protected _flags!: Map<string, FlagDTO>;
  protected _configManager: IConfigManager;
  protected _campaigns!: CampaignDTO[];
  protected _hasConsented!: boolean;
  protected _anonymousId!: string | null;
  public deDuplicationCache: Record<string, number>
  protected _isCleaningDeDuplicationCache: boolean
  public visitorCache?: VisitorCacheDTO

  constructor (param: NewVisitor & {
    visitorId?: string
    configManager: IConfigManager
    context: Record<string, primitive>
  }) {
    const { visitorId, configManager, context, isAuthenticated, hasConsented, initialModifications, initialFlagsData, initialCampaigns } = param
    super()
    this._isCleaningDeDuplicationCache = false
    this.deDuplicationCache = {}
    this._context = {}
    this._configManager = configManager

    const VisitorCache = this.config.enableClientCache ? cacheVisitor.loadVisitorProfile() : null
    this.visitorId = visitorId || VisitorCache?.visitorId || this.uuidV4()

    this.campaigns = []

    this._anonymousId = VisitorCache?.anonymousId || null

    if (!this._anonymousId && isAuthenticated && this.config.decisionMode === DecisionMode.DECISION_API) {
      this._anonymousId = this.uuidV4()
    }

    this.setConsent(hasConsented ?? true)
    this.updateContext(context)
    this.loadPredefinedContext()

    this.updateCache()
    this.setInitialFlags(initialFlagsData || initialModifications)
    this.setInitializeCampaigns(initialCampaigns, !!initialModifications)
  }

  public clearDeDuplicationCache (deDuplicationTime: number): void {
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
    return Array.from(this._flags, ([_, item]) => item)
  }

  public getFlagsDataArray (): FlagDTO[] {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return Array.from(this._flags, ([_, item]) => item)
  }

  protected setInitialFlags (modifications?: Map<string, FlagDTO> | FlagDTO[]): void {
    this._flags = new Map<string, FlagDTO>()
    if (!modifications || (!(modifications instanceof Map) && !Array.isArray(modifications))) {
      return
    }
    modifications.forEach((item: FlagDTO) => {
      this._flags.set(item.key, item)
    })
  }

  protected setInitializeCampaigns (campaigns?: CampaignDTO[], hasModifications?: boolean): void {
    if (campaigns && Array.isArray(campaigns) && !hasModifications) {
      this.getStrategy().updateCampaigns(campaigns)
    }
  }

  protected updateCache (): void {
    const visitorProfil = {
      visitorId: this.visitorId,
      anonymousId: this.anonymousId
    }
    cacheVisitor.saveVisitorProfile(visitorProfil)
  }

  protected loadPredefinedContext (): void {
    this.context.fs_client = SDK_LANGUAGE.name
    this.context.fs_version = SDK_VERSION
    this.context.fs_users = this.visitorId
  }

  protected uuidV4 (): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (char) {
      const rand = Math.random() * 16 | 0
      const value = char === 'x' ? rand : (rand & 0x3 | 0x8)
      return value.toString(16)
    })
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
    this.loadPredefinedContext()
    this.visitorCache = undefined
  }

  /**
   * Return True or False if the visitor has consented for protected data usage.
   * @return bool
   */
  public get hasConsented (): boolean {
    return this._hasConsented
  }

  public set hasConsented (v: boolean) {
    this._hasConsented = v
  }

  /**
    * Set if visitor has consented for protected data usage.
    * @param {boolean} hasConsented True if the visitor has consented false otherwise.
    */
  public setConsent (hasConsented: boolean): void {
    this.hasConsented = hasConsented
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

  public get flagsData (): Map<string, FlagDTO> {
    return this._flags
  }

  public set flagsData (v: Map<string, FlagDTO>) {
    this._flags = v
  }

  public get modifications (): Map<string, Modification> {
    return this._flags
  }

  public set modifications (v: Map<string, Modification>) {
    this._flags = v
  }

  get configManager (): IConfigManager {
    return this._configManager
  }

  public get config (): IFlagshipConfig {
    return this.configManager.config
  }

  public get campaigns (): CampaignDTO[] {
    return this._campaigns
  }

  public set campaigns (v: CampaignDTO[]) {
    this._campaigns = v
  }

  public get anonymousId (): string | null {
    return this._anonymousId
  }

  public set anonymousId (v: string | null) {
    this._anonymousId = v
  }

  protected getStrategy (): VisitorStrategyAbstract {
    let strategy: VisitorStrategyAbstract
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
  abstract clearContext(): void

  abstract getModification<T>(params: modificationsRequested<T>): Promise<T>;
  abstract getModificationSync<T>(params: modificationsRequested<T>): T

  abstract getFlag<T>(key: string, defaultValue: T): IFlag<T>

  abstract getModifications<T>(params: modificationsRequested<T>[], activateAll?: boolean): Promise<Record<string, T>>
  abstract getModificationsSync<T>(params: modificationsRequested<T>[], activateAll?: boolean): Record<string, T>

  abstract getModificationInfo(key: string): Promise<Modification | null>

  abstract getModificationInfoSync(key: string): Modification | null

  abstract synchronizeModifications(): Promise<void>

  abstract activateModification(key: string): Promise<void>;

  abstract activateModifications(keys: { key: string; }[]): Promise<void>;
  abstract activateModifications(keys: string[]): Promise<void>;
  abstract activateModifications(params: Array<{ key: string }> | Array<string>): Promise<void>

  abstract sendHit(hit: HitAbstract): Promise<void>;
  abstract sendHit(hit: IHit): Promise<void>;
  abstract sendHit(hit: HitShape): Promise<void>;
  abstract sendHit(hit: IHit | HitAbstract | HitShape): Promise<void>;

  abstract sendHits(hit: HitAbstract[]): Promise<void>;
  abstract sendHits(hit: IHit[]): Promise<void>;
  abstract sendHits(hit: HitShape[]): Promise<void>;
  abstract sendHits(hit: HitAbstract[] | IHit[] | HitShape[]): Promise<void>

  abstract getAllModifications(activate: boolean): Promise<{ visitorId: string; campaigns: CampaignDTO[] }>

  abstract getModificationsForCampaign(campaignId: string, activate: boolean): Promise<{ visitorId: string; campaigns: CampaignDTO[] }>

  abstract getAllFlagsData(activate: boolean): Promise<{ visitorId: string; campaigns: CampaignDTO[] }>

  abstract getFlatsDataForCampaign(campaignId: string, activate: boolean): Promise<{ visitorId: string; campaigns: CampaignDTO[] }>

  abstract authenticate(visitorId: string): void
  abstract unauthenticate(): void

  abstract userExposed<T>(param: { key: string, flag?: FlagDTO, defaultValue: T }): Promise<void>
  abstract getFlagValue<T>(param: { key: string, defaultValue: T, flag?: FlagDTO, userExposed?: boolean }): T
  abstract fetchFlags(): Promise<void>
  abstract getFlagMetadata(param: { metadata: IFlagMetadata, key?: string, hasSameType: boolean }): IFlagMetadata
}
