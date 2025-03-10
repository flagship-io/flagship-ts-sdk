import {
  AUTHENTICATE,
  CLEAR_CONTEXT,
  CONTEXT_KEY_ERROR,
  CONTEXT_KEY_VALUE_UPDATE,
  CONTEXT_NULL_ERROR,
  CONTEXT_VALUE_ERROR,
  EMIT_READY,
  FETCH_CAMPAIGNS_FROM_CACHE,
  FETCH_CAMPAIGNS_SUCCESS,
  FETCH_FLAGS_BUFFERING_MESSAGE,
  FETCH_FLAGS_FROM_CAMPAIGNS,
  FETCH_FLAGS_STARTED,
  FLAGSHIP_VISITOR_NOT_AUTHENTICATE,
  FLAG_METADATA,
  FLAG_VISITOR_EXPOSED,
  FLAG_VALUE,
  GET_FLAG_CAST_ERROR,
  GET_FLAG_MISSING_ERROR,
  GET_FLAG_VALUE,
  HitType,
  LogLevel,
  NO_FLAG_METADATA,
  PREDEFINED_CONTEXT_TYPE_ERROR,
  PROCESS_CLEAR_CONTEXT,
  PROCESS_FETCHING_FLAGS,
  PROCESS_SEND_HIT,
  PROCESS_UPDATE_CONTEXT,
  SDK_APP,
  UNAUTHENTICATE,
  USER_EXPOSED_CAST_ERROR,
  USER_EXPOSED_FLAG_ERROR,
  VISITOR_AUTHENTICATE,
  VISITOR_AUTHENTICATE_VISITOR_ID_ERROR,
  VISITOR_EXPOSED_VALUE_NOT_CALLED,
  VISITOR_UNAUTHENTICATE,
  VISITOR_ALREADY_AUTHENTICATE
} from '../enum/index.ts'
import {
  IPage,
  IScreen,
  IEvent,
  IItem,
  ITransaction
} from '../hit/index.ts'
import { primitive, IHit, FlagDTO, IFSFlagMetadata, TroubleshootingLabel, VisitorVariations, CampaignDTO } from '../types.ts'
import { deepEqual, errorFormat, hasSameType, logDebug, logDebugSprintf, logError, logErrorSprintf, logInfoSprintf, logWarningSprintf, sprintf } from '../utils/utils.ts'
import { StrategyAbstract } from './StrategyAbstract.ts'
import { FLAGSHIP_CLIENT, FLAGSHIP_CONTEXT, FLAGSHIP_VERSION, FLAGSHIP_VISITOR } from '../enum/FlagshipContext.ts'
import { VisitorDelegate } from './index.ts'
import { FSFlagMetadata } from '../flag/FSFlagMetadata.ts'
import { FSFetchStatus } from '../enum/FSFetchStatus.ts'
import { FSFetchReasons } from '../enum/FSFetchReasons.ts'
import { ActivateConstructorParam, GetFlagMetadataParam, GetFlagValueParam, ImportHitType, VisitorExposedParam } from '../type.local.ts'
import { importHit } from '../hit/importHit.ts'
import { type HitAbstract } from '../hit/HitAbstract.ts'

export const TYPE_HIT_REQUIRED_ERROR = 'property type is required and must '
export const HIT_NULL_ERROR = 'Hit must not be null'

export class DefaultStrategy extends StrategyAbstract {
  private checkPredefinedContext (
    key: string,
    value: primitive
  ): boolean | null {
    const type = FLAGSHIP_CONTEXT[key]
    if (!type) {
      return null
    }

    let check = false

    if (type === 'string') {
      check = typeof value === 'string'
    } else if (type === 'number') {
      check = typeof value === 'number'
    }

    if (!check) {
      logErrorSprintf(this.config, PROCESS_UPDATE_CONTEXT, PREDEFINED_CONTEXT_TYPE_ERROR, this.visitor.visitorId, key, type)
    }
    return check
  }

  private updateContextKeyValue (key: string, value: primitive): void {
    const valueType = typeof value

    if (typeof key !== 'string' || key === '') {
      logErrorSprintf(this.config, PROCESS_UPDATE_CONTEXT, CONTEXT_KEY_ERROR, this.visitor.visitorId, key)
      return
    }

    if (valueType !== 'string' && valueType !== 'number' && valueType !== 'boolean') {
      logErrorSprintf(this.config, PROCESS_UPDATE_CONTEXT, CONTEXT_VALUE_ERROR, this.visitor.visitorId, key)
      return
    }

    if (key === FLAGSHIP_CLIENT || key === FLAGSHIP_VERSION || key === FLAGSHIP_VISITOR) {
      return
    }

    const predefinedContext = this.checkPredefinedContext(key, value)
    if (typeof predefinedContext === 'boolean' && !predefinedContext) {
      return
    }

    this.visitor.context[key] = value
  }

  private checkAndUpdateContext (oldContext: Record<string, primitive>, newContext: Record<string, primitive>, value: unknown): void {
    if (deepEqual(oldContext, newContext)) {
      return
    }

    this.visitor.hasContextBeenUpdated = true

    this.visitor.fetchStatus = {
      status: FSFetchStatus.FETCH_REQUIRED,
      reason: FSFetchReasons.UPDATE_CONTEXT
    }
    logDebugSprintf(this.config, PROCESS_UPDATE_CONTEXT, CONTEXT_KEY_VALUE_UPDATE, this.visitor.visitorId, newContext, value, this.visitor.context)
  }

  updateContext(key: string, value: primitive):void
  updateContext (context: Record<string, primitive>): void
  updateContext (context: Record<string, primitive> | string, value?:primitive): void {
    const oldContext = { ...this.visitor.context }
    if (typeof context === 'string') {
      this.updateContextKeyValue(context, value as primitive)

      const newContext = this.visitor.context

      this.checkAndUpdateContext(oldContext, newContext, value)
      return
    }

    if (!context) {
      logError(this.visitor.config, CONTEXT_NULL_ERROR, PROCESS_UPDATE_CONTEXT)
      return
    }

    for (const key in context) {
      const value = context[key]
      this.updateContextKeyValue(key, value)
    }
    const newContext = this.visitor.context

    this.checkAndUpdateContext(oldContext, newContext, context)
  }

  clearContext (): void {
    const oldContext = { ...this.visitor.context }
    this.visitor.context = {}
    this.visitor.loadPredefinedContext()
    const newContext = this.visitor.context
    if (deepEqual(oldContext, newContext)) {
      return
    }

    this.visitor.hasContextBeenUpdated = true
    this.visitor.fetchStatus = {
      status: FSFetchStatus.FETCH_REQUIRED,
      reason: FSFetchReasons.UPDATE_CONTEXT
    }
    logDebugSprintf(this.config, PROCESS_CLEAR_CONTEXT, CLEAR_CONTEXT, this.visitor.visitorId, this.visitor.context)
  }

  private isDeDuplicated (key:string, deDuplicationTime:number):boolean {
    if (deDuplicationTime === 0) {
      return false
    }

    const deDuplicationCache = this.visitor.deDuplicationCache[key]

    if (deDuplicationCache && (Date.now() - deDuplicationCache) <= (deDuplicationTime * 1000)) {
      return true
    }
    this.visitor.deDuplicationCache[key] = Date.now()

    this.visitor.clearDeDuplicationCache(deDuplicationTime)
    return false
  }

  protected async sendActivate (flagDto: FlagDTO, defaultValue?: unknown):Promise<void> {
    const activateHit:ActivateConstructorParam = {
      variationGroupId: flagDto.variationGroupId,
      variationId: flagDto.variationId,
      visitorId: this.visitor.visitorId,
      anonymousId: this.visitor.anonymousId as string,
      flagKey: flagDto.key,
      flagValue: flagDto.value,
      flagDefaultValue: defaultValue,
      visitorContext: this.visitor.context,
      flagMetadata: {
        campaignName: flagDto.campaignName,
        campaignId: flagDto.campaignId,
        campaignType: flagDto.campaignType as string,
        variationGroupId: flagDto.variationGroupId,
        variationGroupName: flagDto.variationGroupName,
        variationId: flagDto.variationId,
        variationName: flagDto.variationName,
        slug: flagDto.slug,
        isReference: flagDto.isReference as boolean
      },
      qaMode: this.config.isQAModeEnabled
    }

    if (this.isDeDuplicated(JSON.stringify(activateHit), this.config.hitDeduplicationTime as number)) {
      const logData = {
        visitorId: this.visitor.visitorId,
        anonymousId: this.visitor.anonymousId,
        flag: flagDto,
        delay: 0
      }
      logDebug(this.config, sprintf('Activate {0} is deduplicated', JSON.stringify(logData)), PROCESS_SEND_HIT)
      return
    }

    await this.trackingManager.activateFlag(activateHit)

    importHit(ImportHitType.Troubleshooting).then(({ Troubleshooting }) => {
      const activateTroubleshooting = new Troubleshooting({

        label: TroubleshootingLabel.VISITOR_SEND_ACTIVATE,
        logLevel: LogLevel.INFO,
        traffic: this.visitor.traffic,
        visitorId: activateHit.visitorId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        visitorSessionId: this.visitor.instanceId,
        anonymousId: activateHit.anonymousId,
        config: this.config,
        hitContent: activateHit
      })

      this.sendTroubleshootingHit(activateTroubleshooting)
    })
  }

  sendHit(hit: HitAbstract): Promise<void>
  sendHit(hit: IHit): Promise<void>
  async sendHit (hit: IHit | HitAbstract): Promise<void> {
    if (!this.hasTrackingManager(PROCESS_SEND_HIT)) {
      return
    }
    await this.prepareAndSendHit(hit)
  }

  sendHits(hits: HitAbstract[]): Promise<void>
  sendHits(hits: IHit[]): Promise<void>
  async sendHits (hits: HitAbstract[] | IHit[]): Promise<void> {
    if (!this.hasTrackingManager(PROCESS_SEND_HIT)) {
      return
    }
    for (const hit of hits) {
      await this.prepareAndSendHit(hit)
    }
  }

  private async getHit (hit: IHit): Promise<HitAbstract|null> {
    let newHit = null
    switch (hit.type.toUpperCase()) {
      case HitType.EVENT:{
        const { Event } = await importHit(ImportHitType.Event)
        newHit = new Event(hit as IEvent)
        break
      }
      case HitType.ITEM:{
        const { Item } = await importHit(ImportHitType.Item)
        newHit = new Item(hit as IItem)
        break
      }
      case HitType.PAGE_VIEW:{
        const { Page } = await importHit(ImportHitType.Page)
        newHit = new Page(hit as IPage)
        break
      }
      case HitType.SCREEN_VIEW:{
        const { Screen } = await importHit(ImportHitType.Screen)
        newHit = new Screen(hit as IScreen)
        break
      }
      case HitType.TRANSACTION:{
        const { Transaction } = await importHit(ImportHitType.Transaction)
        newHit = new Transaction(hit as ITransaction)
        break
      }
    }
    return newHit
  }

  private async prepareAndSendHit (hit: IHit | HitAbstract, functionName = PROCESS_SEND_HIT) {
    let hitInstance: HitAbstract

    if (!hit?.type) {
      logError(this.config, HIT_NULL_ERROR, functionName)
      return
    }

    const { HitAbstract } = await importHit(ImportHitType.HitAbstract)

    if (hit instanceof HitAbstract) {
      hitInstance = hit
    } else {
      const hitFromInt = await this.getHit(hit)
      if (!hitFromInt) {
        logError(this.config, TYPE_HIT_REQUIRED_ERROR, functionName)
        return
      }
      hitInstance = hitFromInt
    }
    hitInstance.visitorId = this.visitor.visitorId
    hitInstance.ds = SDK_APP
    hitInstance.config = this.config
    hitInstance.anonymousId = this.visitor.anonymousId as string
    hitInstance.qaMode = this.config.isQAModeEnabled

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt, ...hitInstanceItem } = hitInstance.toObject()
    if (this.isDeDuplicated(JSON.stringify(hitInstanceItem), this.config.hitDeduplicationTime as number)) {
      return
    }
    if (!hitInstance.isReady()) {
      logError(this.config, hitInstance.getErrorMessage(), functionName)
      return
    }
    try {
      await this.trackingManager.addHit(hitInstance)

      if (hitInstance.type === 'SEGMENT') {
        return
      }

      importHit(ImportHitType.Troubleshooting).then(({ Troubleshooting }) => {
        const sendHitTroubleshooting = new Troubleshooting({

          label: TroubleshootingLabel.VISITOR_SEND_HIT,
          logLevel: LogLevel.INFO,
          traffic: this.visitor.traffic,
          visitorId: hitInstance.visitorId,
          flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
          visitorSessionId: this.visitor.instanceId,
          anonymousId: hitInstance.anonymousId,
          config: this.config,
          hitContent: hitInstance.toApiKeys()
        })
        this.sendTroubleshootingHit(sendHitTroubleshooting)
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logError(this.config, error.message || error, functionName)
    }
  }

  authenticate (visitorId: string): void {
    if (!visitorId) {
      logErrorSprintf(this.config, AUTHENTICATE, VISITOR_AUTHENTICATE_VISITOR_ID_ERROR, this.visitor.visitorId)
      return
    }

    if (this.visitor.anonymousId) {
      logWarningSprintf(this.config, AUTHENTICATE, VISITOR_ALREADY_AUTHENTICATE, this.visitor.visitorId, this.visitor.anonymousId)
      return
    }

    this.visitor.anonymousId = this.visitor.visitorId
    this.visitor.visitorId = visitorId

    importHit(ImportHitType.Troubleshooting).then(({ Troubleshooting }) => {
      const monitoring = new Troubleshooting({

        label: TroubleshootingLabel.VISITOR_AUTHENTICATE,
        logLevel: LogLevel.INFO,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        visitorId: this.visitor.visitorId,
        anonymousId: this.visitor.anonymousId,
        visitorContext: this.visitor.context,
        traffic: this.visitor.traffic,
        config: this.config
      })

      this.sendTroubleshootingHit(monitoring)
    })

    this.visitor.fetchStatus = {
      status: FSFetchStatus.FETCH_REQUIRED,
      reason: FSFetchReasons.AUTHENTICATE
    }

    logDebugSprintf(this.config, AUTHENTICATE, VISITOR_AUTHENTICATE, this.visitor.visitorId, this.visitor.anonymousId)
  }

  unauthenticate (): void {
    if (!this.visitor.anonymousId) {
      logErrorSprintf(this.config, UNAUTHENTICATE, FLAGSHIP_VISITOR_NOT_AUTHENTICATE, this.visitor.visitorId)
      return
    }
    this.visitor.visitorId = this.visitor.anonymousId
    this.visitor.anonymousId = null

    importHit(ImportHitType.Troubleshooting).then(({ Troubleshooting }) => {
      const monitoring = new Troubleshooting({

        label: TroubleshootingLabel.VISITOR_UNAUTHENTICATE,
        logLevel: LogLevel.INFO,
        visitorId: this.visitor.visitorId,
        anonymousId: this.visitor.anonymousId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        visitorContext: this.visitor.context,
        traffic: this.visitor.traffic,
        config: this.config
      })

      this.sendTroubleshootingHit(monitoring)
    })

    this.visitor.fetchStatus = {
      status: FSFetchStatus.FETCH_REQUIRED,
      reason: FSFetchReasons.UNAUTHENTICATE
    }

    logDebugSprintf(this.config, UNAUTHENTICATE, VISITOR_UNAUTHENTICATE, this.visitor.visitorId)
  }

  handleFetchFlagsError (error: unknown, now: number, campaigns: CampaignDTO[] | null) {
    this.visitor.emit(EMIT_READY, error)

    const message = error instanceof Error ? error.message : error as string

    const errorMessage = errorFormat(message, {
      visitorId: this.visitor.visitorId,
      anonymousId: this.visitor.anonymousId,
      context: this.visitor.context,
      statusReason: this.visitor.fetchStatus.reason,
      duration: Date.now() - now
    })

    logError(
      this.config,
      errorMessage,
      PROCESS_FETCHING_FLAGS
    )

    this.visitor.fetchStatus = {
      status: FSFetchStatus.FETCH_REQUIRED,
      reason: FSFetchReasons.FLAGS_FETCHING_ERROR
    }

    importHit(ImportHitType.Troubleshooting).then(({ Troubleshooting }) => {
      const troubleshootingHit = new Troubleshooting({

        label: TroubleshootingLabel.VISITOR_FETCH_CAMPAIGNS_ERROR,
        logLevel: LogLevel.INFO,
        visitorId: this.visitor.visitorId,
        anonymousId: this.visitor.anonymousId,
        visitorSessionId: this.visitor.instanceId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        traffic: this.visitor.traffic,
        config: this.config,
        visitorContext: this.visitor.context,
        sdkStatus: this.visitor.getSdkStatus(),
        visitorCampaigns: campaigns,
        visitorConsent: this.visitor.hasConsented,
        visitorIsAuthenticated: !!this.visitor.anonymousId,
        visitorFlags: this.visitor.flagsData,
        visitorInitialCampaigns: this.visitor.sdkInitialData?.initialCampaigns,
        visitorInitialFlagsData: this.visitor.sdkInitialData?.initialFlagsData,
        lastBucketingTimestamp: this.configManager.decisionManager.lastBucketingTimestamp,
        lastInitializationTimestamp: this.visitor.sdkInitialData?.lastInitializationTimestamp,
        httpResponseTime: Date.now() - now,
        sdkConfigMode: this.getSdkConfigDecisionMode(),
        sdkConfigTimeout: this.config.timeout,
        sdkConfigPollingInterval: this.config.pollingInterval,
        sdkConfigTrackingManagerStrategy: this.config.trackingManagerConfig?.cacheStrategy,
        sdkConfigTrackingManagerBatchIntervals: this.config.trackingManagerConfig?.batchIntervals,
        sdkConfigTrackingManagerPoolMaxSize: this.config.trackingManagerConfig?.poolMaxSize,
        sdkConfigFetchNow: this.config.fetchNow,
        sdkConfigReuseVisitorIds: this.config.reuseVisitorIds,
        sdkConfigInitialBucketing: this.config.initialBucketing,
        sdkConfigDecisionApiUrl: this.config.decisionApiUrl,
        sdkConfigHitDeduplicationTime: this.config.hitDeduplicationTime
      })

      this.trackingManager.addTroubleshootingHit(troubleshootingHit)
    })
  }

  async getCampaigns (now: number): Promise<{
    campaigns: CampaignDTO[] | null;
    error?: string;
    isFetching?: boolean;
    isBuffered?: boolean;
  }> {
    let campaigns: CampaignDTO[] | null = null
    const functionName = PROCESS_FETCHING_FLAGS
    try {
      const time = Date.now() - this.visitor.lastFetchFlagsTimestamp
      const fetchStatus = this.visitor.fetchStatus.status

      if (fetchStatus === FSFetchStatus.FETCHING) {
        await this.visitor.getCampaignsPromise
        return { campaigns, isFetching: true }
      }

      const fetchFlagBufferingTime = (this.config.fetchFlagsBufferingTime as number * 1000)

      if (fetchStatus === FSFetchStatus.FETCHED && time < fetchFlagBufferingTime) {
        logInfoSprintf(this.config, functionName, FETCH_FLAGS_BUFFERING_MESSAGE, this.visitor.visitorId, fetchFlagBufferingTime - time)
        return { campaigns, isBuffered: true }
      }

      logDebugSprintf(this.config, functionName, FETCH_FLAGS_STARTED, this.visitor.visitorId)

      this.visitor.fetchStatus = {
        status: FSFetchStatus.FETCHING,
        reason: FSFetchReasons.NONE
      }

      await this.lookupVisitor()

      await this.visitor.emotionAi.fetchEAIScore()

      this.visitor.getCampaignsPromise = this.decisionManager.getCampaignsAsync(this.visitor)

      campaigns = await this.visitor.getCampaignsPromise

      this.visitor.lastFetchFlagsTimestamp = Date.now()

      if (this.decisionManager.isPanic()) {
        this.visitor.fetchStatus = {
          status: FSFetchStatus.PANIC,
          reason: FSFetchReasons.NONE
        }
      }

      this.configManager.trackingManager.troubleshootingData = this.decisionManager.troubleshooting

      logDebugSprintf(this.config, functionName, FETCH_CAMPAIGNS_SUCCESS,
        this.visitor.visitorId, this.visitor.anonymousId, this.visitor.context, campaigns, (Date.now() - now)
      )
      return { campaigns }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logError(this.config, error.message, PROCESS_FETCHING_FLAGS)

      this.visitor.fetchStatus = {
        status: FSFetchStatus.FETCH_REQUIRED,
        reason: FSFetchReasons.FLAGS_FETCHING_ERROR
      }
      return { error: error as string, campaigns }
    }
  }

  protected fetchCampaignsFromCache (visitor: VisitorDelegate) :CampaignDTO[]|null {
    if (!Array.isArray(visitor?.visitorCache?.data.campaigns)) {
      return null
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (visitor.visitorCache as any).data.campaigns.map((campaign:any) => {
      return {
        id: campaign.campaignId,
        variationGroupId: campaign.variationGroupId,
        slug: campaign.slug,
        variation: {
          id: campaign.variationId,
          reference: !!campaign.isReference,
          modifications: {
            type: campaign.type,
            value: campaign.flags
          }
        }
      }
    })
  }

  handleNoCampaigns (now:number) {
    const campaigns = this.fetchCampaignsFromCache(this.visitor)
    if (campaigns) {
      this.visitor.fetchStatus = {
        status: FSFetchStatus.FETCH_REQUIRED,
        reason: FSFetchReasons.FLAGS_FETCHED_FROM_CACHE
      }

      logDebugSprintf(
        this.config,
        PROCESS_FETCHING_FLAGS,
        FETCH_CAMPAIGNS_FROM_CACHE,
        this.visitor.visitorId,
        this.visitor.anonymousId,
        this.visitor.context,
        campaigns,
        Date.now() - now
      )
    }
    return campaigns
  }

  sendVisitorAllocatedVariations () {
    if (__fsWebpackIsBrowser__) {
      const visitorAllocatedVariations: Record<string, VisitorVariations> = {}

      this.visitor.flagsData.forEach((item) => {
        visitorAllocatedVariations[item.campaignId] = {
          variationId: item.variationId,
          variationGroupId: item.variationGroupId,
          campaignId: item.campaignId
        }
      })
      import(/* webpackMode: "lazy" */ '../qaAssistant/messages/index').then(({ sendVisitorAllocatedVariations }) => {
        sendVisitorAllocatedVariations(visitorAllocatedVariations)
      })
    }
  }

  private extractFlags (campaigns: CampaignDTO[]): Map<string, FlagDTO> {
    const flags = new Map<string, FlagDTO>()
    campaigns.forEach((campaign) => {
      const object = campaign.variation.modifications.value
      for (const key in object) {
        const value = object[key]
        flags.set(
          key,
          {
            key,
            campaignId: campaign.id,
            campaignName: campaign.name || '',
            variationGroupId: campaign.variationGroupId,
            variationGroupName: campaign.variationGroupName || '',
            variationId: campaign.variation.id,
            variationName: campaign.variation.name || '',
            isReference: !!campaign.variation.reference,
            campaignType: campaign.type,
            slug: campaign.slug,
            value
          }
        )
      }
    })
    return flags
  }

  async fetchFlags (): Promise<void> {
    const now = Date.now()

    let campaigns: CampaignDTO[] | null = null

    const {
      campaigns: fetchedCampaigns,
      error: fetchCampaignError,
      isFetching, isBuffered
    } = await this.getCampaigns(now)

    if (isFetching || isBuffered) {
      return
    }

    campaigns = fetchedCampaigns

    try {
      if (!campaigns) {
        campaigns = this.handleNoCampaigns(now)
      }

      campaigns = campaigns || []

      this.visitor.campaigns = campaigns
      this.visitor.flagsData = this.extractFlags(
        this.visitor.campaigns
      )

      this.cacheVisitor()

      this.visitor.emit(EMIT_READY, fetchCampaignError)

      if (this.visitor.fetchStatus.status === FSFetchStatus.FETCHING) {
        this.visitor.fetchStatus = {
          status: FSFetchStatus.FETCHED,
          reason: FSFetchReasons.NONE
        }
      }

      this.sendVisitorAllocatedVariations()

      logDebugSprintf(
        this.config,
        PROCESS_FETCHING_FLAGS,
        FETCH_FLAGS_FROM_CAMPAIGNS,
        this.visitor.visitorId,
        this.visitor.anonymousId,
        this.visitor.context,
        this.visitor.flagsData
      )

      if (this.decisionManager.troubleshooting) {
        this.sendFetchFlagsTroubleshooting({
          campaigns,
          now,
          isFromCache: this.visitor.fetchStatus.reason === FSFetchReasons.FLAGS_FETCHED_FROM_CACHE
        })
        this.sendConsentHitTroubleshooting()
        this.sendSegmentHitTroubleshooting()
      }

      this.sendSdkConfigAnalyticHit()
    } catch (error: unknown) {
      this.handleFetchFlagsError(error, now, campaigns)
    }
  }

  async visitorExposed (param:VisitorExposedParam): Promise<void> {
    const { key, flag, defaultValue, hasGetValueBeenCalled } = param

    if (!flag) {
      logWarningSprintf(
        this.visitor.config,
        FLAG_VISITOR_EXPOSED,
        USER_EXPOSED_FLAG_ERROR, this.visitor.visitorId, key
      )
      this.sendFlagTroubleshooting(TroubleshootingLabel.VISITOR_EXPOSED_FLAG_NOT_FOUND, key, defaultValue)
      return
    }

    if (!hasGetValueBeenCalled) {
      logWarningSprintf(
        this.visitor.config,
        FLAG_VISITOR_EXPOSED,
        VISITOR_EXPOSED_VALUE_NOT_CALLED, this.visitor.visitorId, key
      )
      this.sendFlagTroubleshooting(TroubleshootingLabel.FLAG_VALUE_NOT_CALLED, key, defaultValue, true)
      return
    }

    if (defaultValue !== null && defaultValue !== undefined && flag.value !== null && !hasSameType(flag.value, defaultValue)) {
      logWarningSprintf(
        this.visitor.config,
        FLAG_VISITOR_EXPOSED,
        USER_EXPOSED_CAST_ERROR, this.visitor.visitorId, key
      )

      this.sendFlagTroubleshooting(TroubleshootingLabel.VISITOR_EXPOSED_TYPE_WARNING, key, defaultValue)
      return
    }

    await this.sendActivate(flag, defaultValue)
  }

  private sendFlagTroubleshooting (label: TroubleshootingLabel, key: string, defaultValue: unknown, visitorExposed?: boolean) {
    importHit(ImportHitType.Troubleshooting).then(({ Troubleshooting }) => {
      const troubleshooting = new Troubleshooting({
        label,
        logLevel: LogLevel.WARNING,
        visitorId: this.visitor.visitorId,
        anonymousId: this.visitor.anonymousId,
        visitorSessionId: this.visitor.instanceId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        traffic: this.visitor.traffic,
        config: this.config,
        visitorContext: this.visitor.context,
        flagKey: key,
        flagDefault: defaultValue,
        visitorExposed
      })

      this.sendTroubleshootingHit(troubleshooting)
    })
  }

  getFlagValue<T> (param:GetFlagValueParam<T>): T extends null ? unknown : T {
    const { key, defaultValue, flag, visitorExposed } = param

    if (!flag) {
      logWarningSprintf(this.config, FLAG_VALUE, GET_FLAG_MISSING_ERROR, this.visitor.visitorId, key, defaultValue)
      this.sendFlagTroubleshooting(TroubleshootingLabel.GET_FLAG_VALUE_FLAG_NOT_FOUND, key, defaultValue, visitorExposed)

      return defaultValue as T extends null ? unknown : T
    }

    if (visitorExposed) {
      this.sendActivate(flag, defaultValue)
    }

    if (flag.value === null) {
      return defaultValue as T extends null ? unknown : T
    }

    if (defaultValue !== null && defaultValue !== undefined && !hasSameType(flag.value, defaultValue)) {
      logWarningSprintf(this.config, FLAG_VALUE, GET_FLAG_CAST_ERROR, this.visitor.visitorId, key, defaultValue)
      this.sendFlagTroubleshooting(TroubleshootingLabel.GET_FLAG_VALUE_TYPE_WARNING, key, defaultValue, visitorExposed)
      return defaultValue as T extends null ? unknown : T
    }

    logDebugSprintf(this.config, FLAG_VALUE, GET_FLAG_VALUE, this.visitor.visitorId, key, flag.value)

    return flag.value as T extends null ? unknown : T
  }

  private SendFlagMetadataTroubleshooting (key: string) {
    logWarningSprintf(this.config, FLAG_METADATA, NO_FLAG_METADATA, this.visitor.visitorId, key)
    importHit(ImportHitType.Troubleshooting).then(({ Troubleshooting }) => {
      const monitoring = new Troubleshooting({
        label: TroubleshootingLabel.GET_FLAG_METADATA_TYPE_WARNING,
        logLevel: LogLevel.WARNING,
        visitorId: this.visitor.visitorId,
        anonymousId: this.visitor.anonymousId,
        visitorSessionId: this.visitor.instanceId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        traffic: this.visitor.traffic,
        config: this.config,
        visitorContext: this.visitor.context,
        flagKey: key
      })

      this.sendTroubleshootingHit(monitoring)
    })
  }

  getFlagMetadata (param:GetFlagMetadataParam):IFSFlagMetadata {
    const { key, flag } = param

    if (!flag) {
      logWarningSprintf(this.config, FLAG_METADATA, NO_FLAG_METADATA, this.visitor.visitorId, key)
      this.SendFlagMetadataTroubleshooting(key)
      return FSFlagMetadata.Empty()
    }

    const metadata = new FSFlagMetadata({
      campaignId: flag.campaignId,
      campaignName: flag.campaignName,
      variationGroupId: flag.variationGroupId,
      variationGroupName: flag.variationGroupName,
      variationId: flag.variationId,
      variationName: flag.variationName,
      isReference: !!flag.isReference,
      campaignType: flag.campaignType as string,
      slug: flag.slug
    })

    return metadata
  }
}
