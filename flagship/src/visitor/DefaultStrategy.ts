import {
  AUTHENTICATE,
  CLEAR_CONTEXT,
  CONTEXT_KEY_ERROR,
  CONTEXT_KEY_VALUE_UPDATE,
  CONTEXT_NULL_ERROR,
  CONTEXT_OBJET_PARAM_UPDATE,
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
} from '../enum/index'
import {
  HitAbstract,
  IPage,
  IScreen,
  IEvent,
  Event,
  Screen,
  IItem,
  ITransaction,
  Item,
  Page,
  Transaction
} from '../hit/index'
import {
  primitive,
  IHit,
  FlagDTO,
  IFSFlagMetadata,
  TroubleshootingLabel,
  VisitorVariations,
  CampaignDTO
} from '../types'
import {
  errorFormat,
  hasSameType,
  logDebug,
  logDebugSprintf,
  logError,
  logErrorSprintf,
  logInfoSprintf,
  logWarningSprintf,
  sprintf
} from '../utils/utils'
import { StrategyAbstract } from './StrategyAbstract'
import {
  FLAGSHIP_CLIENT,
  FLAGSHIP_CONTEXT,
  FLAGSHIP_VERSION,
  FLAGSHIP_VISITOR
} from '../enum/FlagshipContext'
import { VisitorDelegate } from './index'
import { FSFlagMetadata } from '../flag/FSFlagMetadata'
import { Activate } from '../hit/Activate'
import { Troubleshooting } from '../hit/Troubleshooting'
import { FSFetchStatus } from '../enum/FSFetchStatus'
import { FSFetchReasons } from '../enum/FSFetchReasons'
import {
  GetFlagMetadataParam,
  GetFlagValueParam,
  SdkMethodBehavior,
  VisitorExposedParam
} from '../type.local'
import { sendVisitorAllocatedVariations } from '../qaAssistant/messages/index'

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
      logErrorSprintf(
        this.config,
        PROCESS_UPDATE_CONTEXT,
        PREDEFINED_CONTEXT_TYPE_ERROR,
        this.visitor.visitorId,
        key,
        type
      )
    }
    return check
  }

  private updateContextKeyValue (key: string, value: primitive): void {
    const valueType = typeof value

    if (typeof key !== 'string' || key === '') {
      logErrorSprintf(
        this.config,
        PROCESS_UPDATE_CONTEXT,
        CONTEXT_KEY_ERROR,
        this.visitor.visitorId,
        key
      )
      return
    }

    if (
      valueType !== 'string' &&
      valueType !== 'number' &&
      valueType !== 'boolean'
    ) {
      logErrorSprintf(
        this.config,
        PROCESS_UPDATE_CONTEXT,
        CONTEXT_VALUE_ERROR,
        this.visitor.visitorId,
        key
      )
      return
    }

    if (
      key === FLAGSHIP_CLIENT ||
      key === FLAGSHIP_VERSION ||
      key === FLAGSHIP_VISITOR
    ) {
      return
    }

    const predefinedContext = this.checkPredefinedContext(key, value)
    if (typeof predefinedContext === 'boolean' && !predefinedContext) {
      return
    }

    this.visitor.context[key] = value
  }

  updateContextCollection (
    context: Record<string, primitive>,
    isInitializing?: boolean
  ): void {
    const oldContext = this.visitor.context
    if (!context) {
      logError(this.visitor.config, CONTEXT_NULL_ERROR, PROCESS_UPDATE_CONTEXT)
      this.sendDiagnosticHitUpdateContext(SdkMethodBehavior.CONTEXT_NULL_ERROR, oldContext, context)
      return
    }

    for (const key in context) {
      const value = context[key]
      this.updateContextKeyValue(key, value)
    }
    if (!isInitializing) {
      this.visitor.fetchStatus = {
        status: FSFetchStatus.FETCH_REQUIRED,
        reason: FSFetchReasons.UPDATE_CONTEXT
      }
      const newContext = { ...oldContext, ...context }
      this.sendDiagnosticHitUpdateContext(SdkMethodBehavior.NONE, oldContext, newContext)
      logDebugSprintf(
        this.config,
        PROCESS_UPDATE_CONTEXT,
        CONTEXT_OBJET_PARAM_UPDATE,
        this.visitor.visitorId,
        context,
        this.visitor.context
      )
    }
  }

  updateContext(key: string, value: primitive): void;
  updateContext(context: Record<string, primitive>): void;
  updateContext (
    context: Record<string, primitive> | string,
    value?: primitive
  ): void {
    const oldContext = this.visitor.context
    if (typeof context === 'string') {
      this.updateContextKeyValue(context, value as primitive)
      logDebugSprintf(
        this.config,
        PROCESS_UPDATE_CONTEXT,
        CONTEXT_KEY_VALUE_UPDATE,
        this.visitor.visitorId,
        context,
        value,
        this.visitor.context
      )
      this.visitor.fetchStatus = {
        status: FSFetchStatus.FETCH_REQUIRED,
        reason: FSFetchReasons.UPDATE_CONTEXT
      }
      const newContext = { ...oldContext, [context]: value as primitive }
      this.sendDiagnosticHitUpdateContext(SdkMethodBehavior.NONE, oldContext, newContext)
      return
    }

    this.updateContextCollection(context)
  }

  clearContext (): void {
    this.visitor.context = {}
    this.visitor.loadPredefinedContext()
    this.visitor.fetchStatus = {
      status: FSFetchStatus.FETCH_REQUIRED,
      reason: FSFetchReasons.UPDATE_CONTEXT
    }
    this.sendDiagnosticHitClearContext()
    logDebugSprintf(
      this.config,
      PROCESS_CLEAR_CONTEXT,
      CLEAR_CONTEXT,
      this.visitor.visitorId,
      this.visitor.context
    )
  }

  protected fetchCampaignsFromCache (
    visitor: VisitorDelegate
  ): CampaignDTO[] | null {
    if (!Array.isArray(visitor?.visitorCache?.data.campaigns)) {
      return null
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (visitor.visitorCache as any).data.campaigns.map((campaign: any) => {
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

  private isDeDuplicated (key: string, deDuplicationTime: number): boolean {
    if (deDuplicationTime === 0) {
      return false
    }

    const deDuplicationCache = this.visitor.deDuplicationCache[key]

    if (
      deDuplicationCache &&
      Date.now() - deDuplicationCache <= deDuplicationTime * 1000
    ) {
      return true
    }
    this.visitor.deDuplicationCache[key] = Date.now()

    this.visitor.clearDeDuplicationCache(deDuplicationTime)
    return false
  }

  protected async sendActivate (
    flagDto: FlagDTO,
    defaultValue?: unknown
  ): Promise<void> {
    const activateHit = new Activate({
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
      }
    })
    activateHit.config = this.config
    activateHit.qaMode = this.config.isQAModeEnabled

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt, ...hitInstanceItem } = activateHit.toObject()
    if (
      this.isDeDuplicated(
        JSON.stringify(hitInstanceItem),
        this.config.hitDeduplicationTime as number
      )
    ) {
      const logData = {
        visitorId: this.visitor.visitorId,
        anonymousId: this.visitor.anonymousId,
        flag: flagDto,
        delay: 0
      }
      logDebug(
        this.config,
        sprintf('Activate {0} is deduplicated', JSON.stringify(logData)),
        PROCESS_SEND_HIT
      )
      return
    }

    await this.trackingManager.activateFlag(activateHit)

    const activateTroubleshooting = new Troubleshooting({
      label: TroubleshootingLabel.VISITOR_SEND_ACTIVATE,
      logLevel: LogLevel.INFO,
      traffic: this.visitor.traffic,
      visitorId: activateHit.visitorId,
      flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
      visitorSessionId: this.visitor.instanceId,
      anonymousId: activateHit.anonymousId,
      config: this.config,
      hitContent: activateHit.toApiKeys()
    })

    this.sendTroubleshootingHit(activateTroubleshooting)
  }

  async sendHit (hit: HitAbstract): Promise<void>
  async sendHit (hit: IHit): Promise<void>
  async sendHit (hit: HitAbstract | IHit): Promise<void> {
    await this.prepareAndSendHit(hit)
  }

  async sendHits (hits: IHit[]): Promise<void> {
    for (const hit of hits) {
      await this.prepareAndSendHit(hit)
    }
  }

  private getHit (hit: IHit): HitAbstract | undefined {
    let newHit
    switch (hit?.type?.toUpperCase()) {
      case HitType.EVENT:
        newHit = new Event(hit as IEvent)
        break
      case HitType.ITEM:
        newHit = new Item(hit as IItem)
        break
      case HitType.PAGE_VIEW:
        newHit = new Page(hit as IPage)
        break
      case HitType.SCREEN_VIEW:
        newHit = new Screen(hit as IScreen)
        break
      case HitType.TRANSACTION:
        newHit = new Transaction(hit as ITransaction)
        break
    }
    return newHit
  }

  private async prepareAndSendHit (hit: HitAbstract | IHit, functionName = PROCESS_SEND_HIT) {
    const hitInstance = hit instanceof HitAbstract ? hit : this.getHit(hit)
    if (!hitInstance) {
      logError(this.config, TYPE_HIT_REQUIRED_ERROR, functionName)
      this.sendDiagnosticHitSendHit(
        SdkMethodBehavior.HIT_TYPE_ERROR,
        hitInstance
      )
      return
    }
    hitInstance.visitorId = this.visitor.visitorId
    hitInstance.ds = SDK_APP
    hitInstance.config = this.config
    hitInstance.anonymousId = this.visitor.anonymousId as string
    hitInstance.qaMode = this.config.isQAModeEnabled

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt, ...hitInstanceItem } = hitInstance.toObject()
    if (
      this.isDeDuplicated(
        JSON.stringify(hitInstanceItem),
        this.config.hitDeduplicationTime as number
      )
    ) {
      return
    }
    if (!hitInstance.isReady()) {
      const errorMessage = hitInstance.getErrorMessage()
      logError(this.config, errorMessage, functionName)
      this.sendDiagnosticHitSendHit(
        SdkMethodBehavior.HIT_NOT_SENT_ERROR,
        hitInstance,
        errorMessage
      )
      return
    }

    try {
      await this.trackingManager.addHit(hitInstance)

      this.sendDiagnosticHitSendHit(SdkMethodBehavior.NONE, hitInstance)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logError(this.config, error.message || error, functionName)
    }
  }

  authenticate (visitorId: string): void {
    if (!visitorId) {
      logErrorSprintf(
        this.config,
        AUTHENTICATE,
        VISITOR_AUTHENTICATE_VISITOR_ID_ERROR,
        this.visitor.visitorId
      )
      this.sendDiagnosticHitAuthenticate(
        SdkMethodBehavior.VISITOR_AUTHENTICATE_VISITOR_ID_ERROR,
        this.visitor.visitorId,
        this.visitor.anonymousId
      )
      return
    }

    if (this.visitor.anonymousId) {
      logWarningSprintf(
        this.config,
        AUTHENTICATE,
        VISITOR_ALREADY_AUTHENTICATE,
        this.visitor.visitorId,
        this.visitor.anonymousId
      )
      this.sendDiagnosticHitAuthenticate(
        SdkMethodBehavior.VISITOR_ALREADY_AUTHENTICATED_WARNING,
        this.visitor.visitorId,
        this.visitor.anonymousId
      )
      return
    }

    this.visitor.anonymousId = this.visitor.visitorId
    this.visitor.visitorId = visitorId

    this.sendDiagnosticHitAuthenticate(
      SdkMethodBehavior.NONE,
      this.visitor.visitorId,
      this.visitor.anonymousId
    )

    this.visitor.fetchStatus = {
      status: FSFetchStatus.FETCH_REQUIRED,
      reason: FSFetchReasons.AUTHENTICATE
    }

    logDebugSprintf(
      this.config,
      AUTHENTICATE,
      VISITOR_AUTHENTICATE,
      this.visitor.visitorId,
      this.visitor.anonymousId
    )
  }

  unauthenticate (): void {
    if (!this.visitor.anonymousId) {
      logErrorSprintf(
        this.config,
        UNAUTHENTICATE,
        FLAGSHIP_VISITOR_NOT_AUTHENTICATE,
        this.visitor.visitorId
      )
      this.sendDiagnosticHitUnauthenticate(
        SdkMethodBehavior.VISITOR_NOT_AUTHENTICATED_WARNING,
        this.visitor.visitorId,
        this.visitor.anonymousId
      )
      return
    }
    this.visitor.visitorId = this.visitor.anonymousId
    this.visitor.anonymousId = null

    this.sendDiagnosticHitUnauthenticate(
      SdkMethodBehavior.NONE,
      this.visitor.visitorId,
      this.visitor.anonymousId
    )

    this.visitor.fetchStatus = {
      status: FSFetchStatus.FETCH_REQUIRED,
      reason: FSFetchReasons.UNAUTHENTICATE
    }

    logDebugSprintf(
      this.config,
      UNAUTHENTICATE,
      VISITOR_UNAUTHENTICATE,
      this.visitor.visitorId
    )
  }

  async getCampaigns (now: number): Promise<{
    campaigns: CampaignDTO[] | null;
    error?: string;
    isFetching?: boolean;
    isBuffered?: boolean;
  }> {
    let campaigns: CampaignDTO[] | null = null
    try {
      const time = Date.now() - this.visitor.lastFetchFlagsTimestamp
      const fetchStatus = this.visitor.fetchStatus.status

      if (fetchStatus === FSFetchStatus.FETCHING) {
        await this.visitor.getCampaignsPromise
        return { campaigns, isFetching: true }
      }

      const fetchFlagBufferingTime =
        (this.config.fetchFlagsBufferingTime as number) * 1000

      if (
        fetchStatus === FSFetchStatus.FETCHED &&
        time < fetchFlagBufferingTime
      ) {
        logInfoSprintf(
          this.config,
          PROCESS_FETCHING_FLAGS,
          FETCH_FLAGS_BUFFERING_MESSAGE,
          this.visitor.visitorId,
          fetchFlagBufferingTime - time
        )
        return { campaigns, isBuffered: true }
      }

      logDebugSprintf(
        this.config,
        PROCESS_FETCHING_FLAGS,
        FETCH_FLAGS_STARTED,
        this.visitor.visitorId
      )

      this.visitor.fetchStatus = {
        status: FSFetchStatus.FETCHING,
        reason: FSFetchReasons.NONE
      }

      this.visitor.getCampaignsPromise = this.decisionManager.getCampaignsAsync(
        this.visitor
      )

      campaigns = await this.visitor.getCampaignsPromise

      this.visitor.lastFetchFlagsTimestamp = Date.now()

      if (this.decisionManager.isPanic()) {
        this.visitor.fetchStatus = {
          status: FSFetchStatus.PANIC,
          reason: FSFetchReasons.NONE
        }
      }

      this.configManager.trackingManager.troubleshootingData =
        this.decisionManager.troubleshooting

      logDebugSprintf(
        this.config,
        PROCESS_FETCHING_FLAGS,
        FETCH_CAMPAIGNS_SUCCESS,
        this.visitor.visitorId,
        this.visitor.anonymousId,
        this.visitor.context,
        campaigns,
        Date.now() - now
      )
      return { campaigns }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logError(this.config, error.message, PROCESS_FETCHING_FLAGS)

      this.visitor.fetchStatus = {
        status: FSFetchStatus.FETCH_REQUIRED,
        reason: FSFetchReasons.FETCH_ERROR
      }
      return { error: error as string, campaigns }
    }
  }

  getFetchFlagSdkMethodBehavior (reason: FSFetchReasons): SdkMethodBehavior {
    switch (reason) {
      case FSFetchReasons.READ_FROM_CACHE:
        return SdkMethodBehavior.FETCH_FLAGS_FROM_CACHE
      case FSFetchReasons.FETCH_ERROR:
        return SdkMethodBehavior.FETCH_FLAGS_ERROR
      default:
        return SdkMethodBehavior.NONE
    }
  }

  handleNoCampaigns (now:number) {
    const campaigns = this.fetchCampaignsFromCache(this.visitor)
    if (campaigns) {
      this.visitor.fetchStatus = {
        status: FSFetchStatus.FETCH_REQUIRED,
        reason: FSFetchReasons.READ_FROM_CACHE
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
    const visitorAllocatedVariations: Record<string, VisitorVariations> = {}

    this.visitor.flagsData.forEach((item) => {
      visitorAllocatedVariations[item.campaignId] = {
        variationId: item.variationId,
        variationGroupId: item.variationGroupId,
        campaignId: item.campaignId
      }
    })

    sendVisitorAllocatedVariations(visitorAllocatedVariations)
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
      reason: FSFetchReasons.FETCH_ERROR
    }

    this.sendDiagnosticHitFetchFlags({
      campaigns,
      now,
      sdkMethodBehavior: SdkMethodBehavior.FETCH_FLAGS_ERROR,
      errorMessage
    })
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
      this.visitor.flagsData = this.decisionManager.getModifications(
        this.visitor.campaigns
      )
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

      this.sendDiagnosticHitQueue()
      this.sendDiagnosticHitFetchFlags({
        campaigns,
        now,
        sdkMethodBehavior: this.getFetchFlagSdkMethodBehavior(this.visitor.fetchStatus.reason),
        errorMessage: fetchCampaignError
      })
    } catch (error: unknown) {
      this.handleFetchFlagsError(error, now, campaigns)
    }
  }

  async visitorExposed (param: VisitorExposedParam): Promise<void> {
    const { key, flag, defaultValue, hasGetValueBeenCalled } = param

    if (!flag) {
      logWarningSprintf(
        this.visitor.config,
        FLAG_VISITOR_EXPOSED,
        USER_EXPOSED_FLAG_ERROR,
        this.visitor.visitorId,
        key
      )
      this.sendDiagnosticHitFlagVisitorExposed(
        SdkMethodBehavior.FLAG_NOT_FOUND_WARNING,
        defaultValue,
        flag
      )
      return
    }

    if (!hasGetValueBeenCalled) {
      logWarningSprintf(
        this.visitor.config,
        FLAG_VISITOR_EXPOSED,
        VISITOR_EXPOSED_VALUE_NOT_CALLED,
        this.visitor.visitorId,
        key
      )
      this.sendDiagnosticHitFlagVisitorExposed(
        SdkMethodBehavior.FLAG_VALUE_NOT_CALLED_WARNING,
        defaultValue,
        flag
      )
    }

    if (
      defaultValue !== null &&
      defaultValue !== undefined &&
      flag.value !== null &&
      !hasSameType(flag.value, defaultValue)
    ) {
      logWarningSprintf(
        this.visitor.config,
        FLAG_VISITOR_EXPOSED,
        USER_EXPOSED_CAST_ERROR,
        this.visitor.visitorId,
        key
      )
      this.sendDiagnosticHitFlagVisitorExposed(
        SdkMethodBehavior.FLAG_TYPE_WARNING,
        defaultValue,
        flag
      )
    }

    this.sendDiagnosticHitFlagVisitorExposed(
      SdkMethodBehavior.NONE,
      defaultValue,
      flag
    )

    await this.sendActivate(flag, defaultValue)
  }

  getFlagValue<T> (param: GetFlagValueParam<T>): T extends null ? unknown : T {
    const { key, defaultValue, flag, visitorExposed } = param

    if (!flag) {
      logWarningSprintf(
        this.config,
        FLAG_VALUE,
        GET_FLAG_MISSING_ERROR,
        this.visitor.visitorId,
        key,
        defaultValue
      )
      this.sendDiagnosticHitFlagGetValue(
        SdkMethodBehavior.FLAG_NOT_FOUND_WARNING,
        defaultValue,
        !!visitorExposed,
        flag
      )

      return defaultValue as T extends null ? unknown : T
    }

    if (visitorExposed) {
      this.sendActivate(flag, defaultValue)
    }

    if (flag.value === null) {
      this.sendDiagnosticHitFlagGetValue(
        SdkMethodBehavior.NONE,
        defaultValue,
        !!visitorExposed,
        flag
      )
      return defaultValue as T extends null ? unknown : T
    }

    if (
      defaultValue !== null &&
      defaultValue !== undefined &&
      !hasSameType(flag.value, defaultValue)
    ) {
      logWarningSprintf(
        this.config,
        FLAG_VALUE,
        GET_FLAG_CAST_ERROR,
        this.visitor.visitorId,
        key,
        defaultValue
      )
      this.sendDiagnosticHitFlagGetValue(
        SdkMethodBehavior.FLAG_TYPE_WARNING,
        defaultValue,
        !!visitorExposed,
        flag
      )
      return defaultValue as T extends null ? unknown : T
    }

    logDebugSprintf(
      this.config,
      FLAG_VALUE,
      GET_FLAG_VALUE,
      this.visitor.visitorId,
      key,
      flag.value
    )
    this.sendDiagnosticHitFlagGetValue(
      SdkMethodBehavior.NONE,
      defaultValue,
      !!visitorExposed,
      flag
    )

    return flag.value as T extends null ? unknown : T
  }

  getFlagMetadata (param: GetFlagMetadataParam): IFSFlagMetadata {
    const { key, flag } = param

    if (!flag) {
      logWarningSprintf(
        this.config,
        FLAG_METADATA,
        NO_FLAG_METADATA,
        this.visitor.visitorId,
        key
      )
      this.sendDiagnosticHitFlagGetMetadata(
        SdkMethodBehavior.FLAG_NOT_FOUND_WARNING,
        flag
      )
      return FSFlagMetadata.Empty()
    }

    this.sendDiagnosticHitFlagGetMetadata(SdkMethodBehavior.NONE, flag)

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
