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
  VISITOR_UNAUTHENTICATE
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
import { primitive, IHit, FlagDTO, IFSFlagMetadata, TroubleshootingLabel, VisitorVariations, CampaignDTO } from '../types'
import { errorFormat, hasSameType, logDebug, logDebugSprintf, logError, logErrorSprintf, logInfoSprintf, logWarningSprintf, sprintf } from '../utils/utils'
import { StrategyAbstract } from './StrategyAbstract'
import { FLAGSHIP_CLIENT, FLAGSHIP_CONTEXT, FLAGSHIP_VERSION, FLAGSHIP_VISITOR } from '../enum/FlagshipContext'
import { VisitorDelegate } from './index'
import { FSFlagMetadata } from '../flag/FSFlagMetadata'
import { Activate } from '../hit/Activate'
import { Troubleshooting } from '../hit/Troubleshooting'
import { FSFetchStatus } from '../enum/FSFetchStatus'
import { FSFetchReasons } from '../enum/FSFetchReasons'
import { GetFlagMetadataParam, GetFlagValueParam, VisitorExposedParam } from '../type.local'
import { sendVisitorAllocatedVariations } from '../qaAssistant/messages'

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

  updateContext(key: string, value: primitive):void
  updateContext (context: Record<string, primitive>): void
  updateContext (context: Record<string, primitive> | string, value?:primitive): void {
    if (typeof context === 'string') {
      this.updateContextKeyValue(context, value as primitive)
      logDebugSprintf(this.config, PROCESS_UPDATE_CONTEXT, CONTEXT_KEY_VALUE_UPDATE, this.visitor.visitorId, context, value, this.visitor.context)
      this.visitor.fetchStatus = {
        status: FSFetchStatus.FETCH_REQUIRED,
        reason: FSFetchReasons.UPDATE_CONTEXT
      }
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
    this.visitor.fetchStatus = {
      status: FSFetchStatus.FETCH_REQUIRED,
      reason: FSFetchReasons.UPDATE_CONTEXT
    }
    logDebugSprintf(this.config, PROCESS_UPDATE_CONTEXT, CONTEXT_OBJET_PARAM_UPDATE, this.visitor.visitorId, context, this.visitor.context)
  }

  clearContext (): void {
    this.visitor.context = {}
    this.visitor.loadPredefinedContext()
    this.visitor.fetchStatus = {
      status: FSFetchStatus.FETCH_REQUIRED,
      reason: FSFetchReasons.UPDATE_CONTEXT
    }
    logDebugSprintf(this.config, PROCESS_CLEAR_CONTEXT, CLEAR_CONTEXT, this.visitor.visitorId, this.visitor.context)
  }

  protected fetchVisitorCampaigns (visitor: VisitorDelegate) :CampaignDTO[]|null {
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt, ...hitInstanceItem } = activateHit.toObject()
    if (this.isDeDuplicated(JSON.stringify(hitInstanceItem), this.config.hitDeduplicationTime as number)) {
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

  private getHit (hit: IHit):HitAbstract|null {
    let newHit = null
    switch (hit.type.toUpperCase()) {
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

  private async prepareAndSendHit (hit: IHit | HitAbstract, functionName = PROCESS_SEND_HIT) {
    let hitInstance: HitAbstract

    if (!hit?.type) {
      logError(this.config, HIT_NULL_ERROR, functionName)
      return
    }

    if (hit instanceof HitAbstract) {
      hitInstance = hit
    } else {
      const hitFromInt = this.getHit(hit)
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

    this.visitor.anonymousId = this.visitor.visitorId
    this.visitor.visitorId = visitorId

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

    this.visitor.fetchStatus = {
      status: FSFetchStatus.FETCH_REQUIRED,
      reason: FSFetchReasons.UNAUTHENTICATE
    }

    logDebugSprintf(this.config, UNAUTHENTICATE, VISITOR_UNAUTHENTICATE, this.visitor.visitorId)
  }

  async fetchFlags (): Promise<void> {
    const functionName = PROCESS_FETCHING_FLAGS
    const now = Date.now()
    const logData = {
      visitorId: this.visitor.visitorId,
      anonymousId: this.visitor.anonymousId,
      context: this.visitor.context,
      isFromCache: false,
      duration: 0
    }
    let campaigns: CampaignDTO[] | null = null
    let fetchCampaignError:string|undefined
    try {
      const time = Date.now() - this.visitor.lastFetchFlagsTimestamp
      const fetchStatus = this.visitor.fetchStatus.status

      if (fetchStatus === FSFetchStatus.FETCHING) {
        await this.visitor.getCampaignsPromise
        return
      }

      const fetchFlagBufferingTime = (this.config.fetchFlagsBufferingTime as number * 1000)

      if (fetchStatus === FSFetchStatus.FETCHED && time < fetchFlagBufferingTime) {
        logInfoSprintf(this.config, functionName, FETCH_FLAGS_BUFFERING_MESSAGE, this.visitor.visitorId, fetchFlagBufferingTime - time)
        return
      }

      logDebugSprintf(this.config, functionName, FETCH_FLAGS_STARTED, this.visitor.visitorId)

      this.visitor.fetchStatus = {
        status: FSFetchStatus.FETCHING,
        reason: FSFetchReasons.NONE
      }

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logError(this.config, error.message, functionName)
      fetchCampaignError = error

      this.visitor.fetchStatus = {
        status: FSFetchStatus.FETCH_REQUIRED,
        reason: FSFetchReasons.FETCH_ERROR
      }
    }
    try {
      if (!campaigns) {
        campaigns = this.fetchVisitorCampaigns(this.visitor)
        logData.isFromCache = true
        if (campaigns) {
          this.visitor.fetchStatus = {
            status: FSFetchStatus.FETCH_REQUIRED,
            reason: FSFetchReasons.READ_FROM_CACHE
          }

          logDebugSprintf(this.config, functionName, FETCH_CAMPAIGNS_FROM_CACHE,
            this.visitor.visitorId, this.visitor.anonymousId, this.visitor.context, campaigns, (Date.now() - now)
          )
        }
      }

      campaigns = campaigns || []

      this.visitor.campaigns = campaigns
      this.visitor.flagsData = this.decisionManager.getModifications(this.visitor.campaigns)
      this.visitor.emit(EMIT_READY, fetchCampaignError)

      if (this.visitor.fetchStatus.status === FSFetchStatus.FETCHING) {
        this.visitor.fetchStatus = {
          status: FSFetchStatus.FETCHED,
          reason: FSFetchReasons.NONE
        }
      }

      const visitorAllocatedVariations: Record<string, VisitorVariations> = {}

      this.visitor.flagsData.forEach(item => {
        visitorAllocatedVariations[item.campaignId] = {
          variationId: item.variationId,
          variationGroupId: item.variationGroupId,
          campaignId: item.campaignId
        }
      })

      sendVisitorAllocatedVariations(visitorAllocatedVariations)

      logDebugSprintf(this.config, functionName, FETCH_FLAGS_FROM_CAMPAIGNS,
        this.visitor.visitorId, this.visitor.anonymousId, this.visitor.context, this.visitor.flagsData)
      if (this.decisionManager.troubleshooting) {
        this.sendFetchFlagsTroubleshooting({ campaigns, now, isFromCache: logData.isFromCache })
        this.sendConsentHitTroubleshooting()
        this.sendSegmentHitTroubleshooting()
      }

      this.sendSdkConfigAnalyticHit()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      this.visitor.emit(EMIT_READY, error)
      logData.duration = Date.now() - now
      logError(
        this.config,
        errorFormat(error.message || error, logData),
        functionName
      )

      this.visitor.fetchStatus = {
        status: FSFetchStatus.FETCH_REQUIRED,
        reason: FSFetchReasons.FETCH_ERROR
      }

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
        visitorCampaignFromCache: logData.isFromCache ? campaigns : undefined,
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
    }

    if (defaultValue !== null && defaultValue !== undefined && flag.value !== null && !hasSameType(flag.value, defaultValue)) {
      logWarningSprintf(
        this.visitor.config,
        FLAG_VISITOR_EXPOSED,
        USER_EXPOSED_CAST_ERROR, this.visitor.visitorId, key
      )

      this.sendFlagTroubleshooting(TroubleshootingLabel.VISITOR_EXPOSED_TYPE_WARNING, key, defaultValue)
    }

    await this.sendActivate(flag, defaultValue)
  }

  private sendFlagTroubleshooting (label: TroubleshootingLabel, key: string, defaultValue: unknown, visitorExposed?: boolean) {
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
