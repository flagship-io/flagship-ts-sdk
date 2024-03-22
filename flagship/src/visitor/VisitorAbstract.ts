import { PREDEFINED_CONTEXT_LOADED, PROCESS_NEW_VISITOR, VISITOR_CREATED, VISITOR_ID_GENERATED, VISITOR_PROFILE_LOADED } from './../enum/FlagshipConstant'
import { IConfigManager, IFlagshipConfig } from '../config/index'
import { IHit, NewVisitor, primitive, VisitorCacheDTO, FlagDTO, IFlagMetadata, sdkInitialData, VisitorCacheStatus, VisitorFlagsStatus } from '../types'

import { IVisitor } from './IVisitor'
import { CampaignDTO } from '../decision/api/models'
import { FSSdkStatus, SDK_INFO, VISITOR_ID_ERROR } from '../enum/index'
import { logDebugSprintf, logError, uuidV4 } from '../utils/utils'
import { HitAbstract } from '../hit/index'
import { DefaultStrategy } from './DefaultStrategy'
import { StrategyAbstract } from './StrategyAbstract'
import { EventEmitter } from '../depsNode.native'
import { NotReadyStrategy } from './NotReadyStrategy'
import { PanicStrategy } from './PanicStrategy'
import { NoConsentStrategy } from './NoConsentStrategy'
import { cacheVisitor } from './VisitorCache'
import { IFlag } from '../flag/Flags'
import { MurmurHash } from '../utils/MurmurHash'
import { FlagSynchStatus } from '../enum/FlagSynchStatus'
import { Troubleshooting } from '../hit/Troubleshooting'
import { FSFetchStatus } from '../enum/FSFetchStatus'
import { FSFetchReasons } from '../enum/FSFetchReasons'

export abstract class VisitorAbstract extends EventEmitter implements IVisitor {
  protected _visitorId!: string
  protected _context: Record<string, primitive>
  protected _flags!: Map<string, FlagDTO>
  protected _configManager: IConfigManager
  protected _campaigns!: CampaignDTO[]
  protected _hasConsented!: boolean
  protected _anonymousId!: string | null
  public deDuplicationCache: Record<string, number>
  protected _isCleaningDeDuplicationCache: boolean
  public visitorCache?: VisitorCacheDTO
  private _instanceId : string
  private _traffic! : number
  protected _sdkInitialData?: sdkInitialData
  private _consentHitTroubleshooting? : Troubleshooting
  private _segmentHitTroubleshooting? : Troubleshooting
  private _visitorFlagsStatus! : VisitorFlagsStatus;
  private _onFetchFlagsStatusChanged? : ({ newStatus, reason }: VisitorFlagsStatus) => void;

  public get onFetchFlagsStatusChanged() : (({ newStatus, reason }: VisitorFlagsStatus) => void)|undefined {
    return this._onFetchFlagsStatusChanged;
  }
  public set onFetchFlagsStatusChanged(v : (({ newStatus, reason }: VisitorFlagsStatus) => void)|undefined ) {
    this._onFetchFlagsStatusChanged = v;
  }

  public get visitorFlagsStatus() : VisitorFlagsStatus {
    return this._visitorFlagsStatus;
  }
  public set visitorFlagsStatus(v : VisitorFlagsStatus) {
    this._visitorFlagsStatus = v;
    if (this.onFetchFlagsStatusChanged) {
      this.onFetchFlagsStatusChanged(v)
    }
  }
  

  public get segmentHitTroubleshooting () : Troubleshooting|undefined {
    return this._segmentHitTroubleshooting
  }

  public set segmentHitTroubleshooting (v : Troubleshooting|undefined) {
    this._segmentHitTroubleshooting = v
  }

  public get consentHitTroubleshooting () : Troubleshooting|undefined {
    return this._consentHitTroubleshooting
  }

  public set consentHitTroubleshooting (v : Troubleshooting|undefined) {
    this._consentHitTroubleshooting = v
  }

  public get sdkInitialData ():sdkInitialData|undefined {
    return this._sdkInitialData
  }

  public static SdkStatus?: FSSdkStatus

  public getSdkStatus () : FSSdkStatus|undefined {
    return VisitorAbstract.SdkStatus
  }

  private _flagSynchStatus : FlagSynchStatus
  public lastFetchFlagsTimestamp = 0
  public isFlagFetching = false
  private _visitorCacheStatus? : VisitorCacheStatus

  public get visitorCacheStatus () : VisitorCacheStatus|undefined {
    return this._visitorCacheStatus
  }

  public set visitorCacheStatus (v : VisitorCacheStatus|undefined) {
    this._visitorCacheStatus = v
  }

  public get flagSynchStatus () : FlagSynchStatus {
    return this._flagSynchStatus
  }

  public set flagSynchStatus (v : FlagSynchStatus) {
    this._flagSynchStatus = v
  }

  constructor (param: NewVisitor & {
    visitorId?: string
    configManager: IConfigManager
    context: Record<string, primitive>
    monitoringData?:sdkInitialData
  }) {
    const { visitorId, configManager, context, isAuthenticated, hasConsented, initialFlagsData, initialCampaigns, monitoringData, onFetchFlagsStatusChanged } = param
    super()
    this._sdkInitialData = monitoringData
    this._instanceId = uuidV4()
    this._isCleaningDeDuplicationCache = false
    this.deDuplicationCache = {}
    this._context = {}
    this._configManager = configManager

    const visitorCache = this.config.reuseVisitorIds ? cacheVisitor.loadVisitorProfile() : null
    if (visitorCache) {
      logDebugSprintf(this.config, PROCESS_NEW_VISITOR, VISITOR_PROFILE_LOADED, visitorCache)
    }
    this.visitorId = visitorId || (!isAuthenticated && visitorCache?.anonymousId ? visitorCache?.anonymousId : visitorCache?.visitorId) || this.generateVisitorId()

    this.campaigns = []

    this._anonymousId = null
    if (isAuthenticated) {
      this._anonymousId = visitorCache?.anonymousId || uuidV4()
    }

    this.setConsent(hasConsented || false)

    this.updateContext(context)

    this.loadPredefinedContext()
    logDebugSprintf(this.config, PROCESS_NEW_VISITOR, PREDEFINED_CONTEXT_LOADED, {
      fs_client: SDK_INFO.name,
      fs_version: SDK_INFO.version,
      fs_users: this.visitorId
    })

    this.updateCache()
    this.setInitialFlags(initialFlagsData)
    this.setInitializeCampaigns(initialCampaigns, !!initialFlagsData)
    this._flagSynchStatus = FlagSynchStatus.CREATED

    this.onFetchFlagsStatusChanged = onFetchFlagsStatusChanged

    this.visitorFlagsStatus = {
      newStatus: FSFetchStatus.FETCH_REQUIRED,
      reason: FSFetchReasons.VISITOR_CREATED
    }

    logDebugSprintf(this.config, PROCESS_NEW_VISITOR, VISITOR_CREATED, this.visitorId, this.context, !!isAuthenticated, !!this.hasConsented)
  }


  public get traffic () : number {
    return this._traffic
  }

  public set traffic (v:number) {
    this._traffic = v
  }

  public get instanceId () : string {
    return this._instanceId
  }

  protected generateVisitorId ():string {
    const visitorId = uuidV4()
    logDebugSprintf(this.config, PROCESS_NEW_VISITOR, VISITOR_ID_GENERATED, visitorId)
    return visitorId
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

  public getFlagsDataArray (): FlagDTO[] {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return Array.from(this._flags, ([_, item]) => item)
  }

  protected setInitialFlags (flags?: Map<string, FlagDTO> | FlagDTO[]): void {
    this._flags = new Map<string, FlagDTO>()
    if (!flags || (!(flags instanceof Map) && !Array.isArray(flags))) {
      return
    }
    flags.forEach((item: FlagDTO) => {
      this._flags.set(item.key, item)
    })
  }

  protected setInitializeCampaigns (campaigns?: CampaignDTO[], hasInitialFlags?: boolean): void {
    if (campaigns && Array.isArray(campaigns) && !hasInitialFlags) {
      this.getStrategy().updateCampaigns(campaigns)
    }
  }

  protected updateCache (): void {
    const visitorProfile = {
      visitorId: this.visitorId,
      anonymousId: this.anonymousId
    }
    cacheVisitor.saveVisitorProfile(visitorProfile)
  }

  public loadPredefinedContext (): void {
    this.context.fs_client = SDK_INFO.name
    this.context.fs_version = SDK_INFO.version
    this.context.fs_users = this.visitorId
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

  public get hasConsented (): boolean {
    return this._hasConsented
  }

  public set hasConsented (v: boolean) {
    this._hasConsented = v
  }

  public setConsent (hasConsented: boolean): void {
    this.hasConsented = hasConsented
    this.getStrategy().setConsent(hasConsented)
  }

  public get context (): Record<string, primitive> {
    return this._context
  }

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

  protected getStrategy (): StrategyAbstract {
    let strategy: StrategyAbstract
    const params = {
      visitor: this,
      murmurHash: new MurmurHash()
    }
    const status = this.getSdkStatus()
    if (status === undefined || status === FSSdkStatus.SDK_NOT_INITIALIZED) {
      strategy = new NotReadyStrategy(params)
    } else if (status === FSSdkStatus.SDK_PANIC) {
      strategy = new PanicStrategy(params)
    } else if (!this.hasConsented) {
      strategy = new NoConsentStrategy(params)
    } else {
      strategy = new DefaultStrategy(params)
    }

    return strategy
  }

  abstract updateContext(key: string, value: primitive):void
  abstract updateContext(context: Record<string, primitive>): void
  abstract updateContext (context: Record<string, primitive> | string, value?:primitive): void
  abstract clearContext(): void

  abstract getFlag<T>(key: string, defaultValue: T): IFlag<T>

  abstract sendHit(hit: HitAbstract): Promise<void>;
  abstract sendHit(hit: IHit): Promise<void>;
  abstract sendHit(hit: IHit | HitAbstract): Promise<void>;

  abstract sendHits(hit: HitAbstract[]): Promise<void>;
  abstract sendHits(hit: IHit[]): Promise<void>;
  abstract sendHits(hit: HitAbstract[] | IHit[]): Promise<void>

  abstract authenticate(visitorId: string): void
  abstract unauthenticate(): void

  abstract visitorExposed<T>(param: { key: string, flag?: FlagDTO, defaultValue: T }): Promise<void>
  abstract getFlagValue<T>(param: { key: string, defaultValue: T, flag?: FlagDTO, userExposed?: boolean }): T
  abstract fetchFlags(): Promise<void>
  abstract getFlagMetadata(param: { metadata: IFlagMetadata, key?: string, hasSameType: boolean }): IFlagMetadata
}
