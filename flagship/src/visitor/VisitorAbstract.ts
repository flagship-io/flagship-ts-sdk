import { PREDEFINED_CONTEXT_LOADED, PROCESS_NEW_VISITOR, VISITOR_CREATED, VISITOR_ID_GENERATED, VISITOR_PROFILE_LOADED } from './../enum/FlagshipConstant'
import { IConfigManager, IFlagshipConfig } from '../config/index'
import { IHit, NewVisitor, primitive, VisitorCacheDTO, FlagDTO, IFSFlagMetadata, sdkInitialData, VisitorCacheStatus, FetchFlagsStatus, SerializedFlagMetadata, CampaignDTO, VisitorVariations, EAIScore } from '../types'

import { IVisitor } from './IVisitor'
import { FSSdkStatus, SDK_INFO, VISITOR_ID_ERROR } from '../enum/index'
import { hexToValue, isBrowser, logDebugSprintf, logError, uuidV4 } from '../utils/utils'
import { HitAbstract } from '../hit/index'
import { DefaultStrategy } from './DefaultStrategy'
import { StrategyAbstract } from './StrategyAbstract'
import { EventEmitter } from '../depsNode.native'
import { NotReadyStrategy } from './NotReadyStrategy'
import { PanicStrategy } from './PanicStrategy'
import { NoConsentStrategy } from './NoConsentStrategy'
import { cacheVisitor } from './VisitorCache'
import { MurmurHash } from '../utils/MurmurHash'
import { Troubleshooting } from '../hit/Troubleshooting'
import { FSFetchStatus } from '../enum/FSFetchStatus'
import { FSFetchReasons } from '../enum/FSFetchReasons'
import { IFSFlag } from '../flag/IFSFlag'
import { GetFlagMetadataParam, GetFlagValueParam, VisitorExposedParam } from '../type.local'
import { IFSFlagCollection } from '../flag/IFSFlagCollection'
import { sendVisitorExposedVariations } from '../qaAssistant/messages/index'
import { IEmotionAI } from '../emotionAI/IEmotionAI'
import { IVisitorEvent } from '../emotionAI/hit/IVisitorEvent'
import { IPageView } from '../emotionAI/hit/IPageView'

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
  protected _exposedVariations: Record<string, VisitorVariations>
  protected _sendExposedVariationTimeoutId?:NodeJS.Timeout

  private _instanceId : string
  private _traffic! : number
  protected _sdkInitialData?: sdkInitialData
  private _consentHitTroubleshooting? : Troubleshooting
  private _segmentHitTroubleshooting? : Troubleshooting
  private _fetchStatus! : FetchFlagsStatus
  private _onFetchFlagsStatusChanged? : ({ status, reason }: FetchFlagsStatus) => void
  private _getCampaignsPromise? : Promise<CampaignDTO[]|null>
  private _hasContextBeenUpdated : boolean
  private _emotionAi: IEmotionAI

  public get hasContextBeenUpdated () : boolean {
    return this._hasContextBeenUpdated
  }

  public set hasContextBeenUpdated (v : boolean) {
    this._hasContextBeenUpdated = v
  }

  public get getCampaignsPromise () : Promise<CampaignDTO[]|null>|undefined {
    return this._getCampaignsPromise
  }

  public set getCampaignsPromise (v : Promise<CampaignDTO[]|null>|undefined) {
    this._getCampaignsPromise = v
  }

  public get onFetchFlagsStatusChanged () : (({ status, reason }: FetchFlagsStatus) => void)|undefined {
    return this._onFetchFlagsStatusChanged
  }

  public set onFetchFlagsStatusChanged (v : (({ status, reason }: FetchFlagsStatus) => void)|undefined) {
    this._onFetchFlagsStatusChanged = v
  }

  public get fetchStatus () : FetchFlagsStatus {
    return this._fetchStatus
  }

  public set fetchStatus (v : FetchFlagsStatus) {
    this._fetchStatus = v
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

  public lastFetchFlagsTimestamp = 0
  private _visitorCacheStatus? : VisitorCacheStatus

  public get visitorCacheStatus () : VisitorCacheStatus|undefined {
    return this._visitorCacheStatus
  }

  public set visitorCacheStatus (v : VisitorCacheStatus|undefined) {
    this._visitorCacheStatus = v
  }

  public get emotionAi () : IEmotionAI {
    return this._emotionAi
  }

  constructor (param: NewVisitor & {
    visitorId?: string
    configManager: IConfigManager
    context: Record<string, primitive>
    monitoringData?:sdkInitialData,
    emotionAi: IEmotionAI
  }) {
    const { visitorId, configManager, context, isAuthenticated, hasConsented, initialFlagsData, initialCampaigns, monitoringData, onFetchFlagsStatusChanged, emotionAi } = param
    super()
    this._emotionAi = emotionAi
    this._hasContextBeenUpdated = true
    this._exposedVariations = {}
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

    this.onFetchFlagsStatusChanged = onFetchFlagsStatusChanged

    this.fetchStatus = {
      status: FSFetchStatus.FETCH_REQUIRED,
      reason: FSFetchReasons.VISITOR_CREATED
    }

    this._emotionAi.init(this)

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

  protected setInitialFlags (flags?: SerializedFlagMetadata[]): void {
    this._flags = new Map<string, FlagDTO>()
    if (!Array.isArray(flags)) {
      return
    }
    flags.forEach((item: SerializedFlagMetadata) => {
      this._flags.set(item.key, {
        key: item.key,
        campaignId: item.campaignId,
        campaignName: item.campaignName,
        variationGroupId: item.variationGroupId,
        variationGroupName: item.variationGroupName,
        variationId: item.variationId,
        variationName: item.variationName,
        isReference: item.isReference,
        value: hexToValue(item.hex, this.config)?.v,
        slug: item.slug,
        campaignType: item.campaignType
      })
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

  public sendExposedVariation (flag?:FlagDTO) {
    if (!flag || !isBrowser()) {
      return
    }
    this._exposedVariations[flag.campaignId] = {
      campaignId: flag.campaignId,
      variationGroupId: flag.variationGroupId,
      variationId: flag.variationId
    }

    window.flagship = {
      ...window.flagship,
      exposedVariations: this._exposedVariations
    }

    if (!this.config.isQAModeEnabled) {
      return
    }

    const BATCH_SIZE = 10
    const DELAY = 100

    if (Object.keys(this._exposedVariations).length >= BATCH_SIZE) {
      sendVisitorExposedVariations(this._exposedVariations)
      this._exposedVariations = {}
    }

    if (this._sendExposedVariationTimeoutId) {
      clearTimeout(this._sendExposedVariationTimeoutId)
    }

    if (Object.keys(this._exposedVariations).length === 0) {
      return
    }

    this._sendExposedVariationTimeoutId = setTimeout(() => {
      sendVisitorExposedVariations(this._exposedVariations)
      this._exposedVariations = {}
    }, DELAY)
  }

  public collectEAIData (currentPage?: Omit<IPageView, 'toApiKeys'>): void {
    this.getStrategy().collectEAIData(currentPage)
  }

  sendEaiVisitorEvent (event: IVisitorEvent):void {
    this.getStrategy().reportEaiVisitorEvent(event)
  }

  sendEaiPageView (pageView: IPageView) {
    this.getStrategy().reportEaiPageView(pageView)
  }

  public onEAICollectStatusChange (callback: (status: boolean) => void): void {
    this.getStrategy().onEAICollectStatusChange(callback)
  }

  public cleanup (): void {
    this.getStrategy().cleanup()
  }

  public async getCachedEAIScore (): Promise<EAIScore|undefined> {
    if (!this.visitorCache) {
      await this.getStrategy().lookupVisitor()
    }
    return this.visitorCache?.data?.eAIScore
  }

  public async setCachedEAIScore (eAIScore: EAIScore): Promise<void> {
    this.getStrategy().cacheVisitor(eAIScore)
  }

  abstract updateContext(key: string, value: primitive):void
  abstract updateContext(context: Record<string, primitive>): void
  abstract updateContext (context: Record<string, primitive> | string, value?:primitive): void
  abstract clearContext(): void

  abstract getFlag(key: string): IFSFlag
  abstract getFlags(): IFSFlagCollection

  abstract sendHit(hit: HitAbstract): Promise<void>;
  abstract sendHit(hit: IHit): Promise<void>;
  abstract sendHit(hit: IHit | HitAbstract): Promise<void>;

  abstract sendHits(hit: HitAbstract[]): Promise<void>;
  abstract sendHits(hit: IHit[]): Promise<void>;
  abstract sendHits(hit: HitAbstract[] | IHit[]): Promise<void>

  abstract authenticate(visitorId: string): void
  abstract unauthenticate(): void

  abstract visitorExposed (param:VisitorExposedParam): Promise<void>
  abstract getFlagValue<T>(param:GetFlagValueParam<T>):T extends null ? unknown : T
  abstract fetchFlags(): Promise<void>
  abstract getFlagMetadata(param:GetFlagMetadataParam):IFSFlagMetadata
}
