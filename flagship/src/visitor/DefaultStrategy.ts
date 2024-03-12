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
  FLAG_USER_EXPOSED,
  FLAG_VALUE,
  GET_FLAG_CAST_ERROR,
  GET_FLAG_MISSING_ERROR,
  GET_FLAG_VALUE,
  GET_METADATA_CAST_ERROR,
  HitType,
  LogLevel,
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
import { primitive, IHit, FlagDTO, VisitorCacheDTO, IFlagMetadata, TroubleshootingLabel } from '../types'
import { errorFormat, hasSameType, logDebug, logDebugSprintf, logError, logErrorSprintf, logInfoSprintf, logWarningSprintf, sprintf } from '../utils/utils'
import { StrategyAbstract } from './StrategyAbstract'
import { CampaignDTO } from '../decision/api/models'
import { FLAGSHIP_CONTEXT } from '../enum/FlagshipContext'
import { VisitorDelegate } from './index'
import { FlagMetadata } from '../flag/FlagMetadata'
import { Activate } from '../hit/Activate'
import { Troubleshooting } from '../hit/Troubleshooting'
import { FlagSynchStatus } from '../enum/FlagSynchStatus'

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

    if (key.match(/^fs_/i)) {
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
      this.visitor.flagSynchStatus = FlagSynchStatus.CONTEXT_UPDATED
      logDebugSprintf(this.config, PROCESS_UPDATE_CONTEXT, CONTEXT_KEY_VALUE_UPDATE, this.visitor.visitorId, context, value, this.visitor.context)
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
    this.visitor.flagSynchStatus = FlagSynchStatus.CONTEXT_UPDATED
    logDebugSprintf(this.config, PROCESS_UPDATE_CONTEXT, CONTEXT_OBJET_PARAM_UPDATE, this.visitor.visitorId, context, this.visitor.context)
  }

  clearContext (): void {
    this.visitor.context = {}
    this.visitor.loadPredefinedContext()
    logDebugSprintf(this.config, PROCESS_CLEAR_CONTEXT, CLEAR_CONTEXT, this.visitor.visitorId, this.visitor.context)
  }

  protected fetchVisitorCampaigns (visitor: VisitorDelegate) :CampaignDTO[]|null {
    if (!Array.isArray(visitor?.visitorCache?.data.campaigns)) {
      return null
    }
    visitor.updateContext((visitor.visitorCache as VisitorCacheDTO).data.context || {})
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

  protected async globalFetchFlags (functionName:string): Promise<void> {
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
      const flagSyncStatus = this.visitor.flagSynchStatus === FlagSynchStatus.FLAGS_FETCHED

      if (flagSyncStatus && this.visitor.isFlagFetching) {
        return
      }

      const fetchFlagBufferingTime = (this.config.fetchFlagsBufferingTime as number * 1000)

      if (flagSyncStatus && time < fetchFlagBufferingTime) {
        logInfoSprintf(this.config, functionName, FETCH_FLAGS_BUFFERING_MESSAGE, this.visitor.visitorId, fetchFlagBufferingTime - time)
        return
      }

      logDebugSprintf(this.config, functionName, FETCH_FLAGS_STARTED, this.visitor.visitorId)

      this.visitor.isFlagFetching = true
      campaigns = await this.decisionManager.getCampaignsAsync(this.visitor)
      this.visitor.lastFetchFlagsTimestamp = Date.now()
      this.visitor.flagSynchStatus = FlagSynchStatus.FLAGS_FETCHED
      this.visitor.isFlagFetching = false

      this.configManager.trackingManager.troubleshootingData = this.decisionManager.troubleshooting

      logDebugSprintf(this.config, functionName, FETCH_CAMPAIGNS_SUCCESS,
        this.visitor.visitorId, this.visitor.anonymousId, this.visitor.context, campaigns, (Date.now() - now)
      )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      this.visitor.isFlagFetching = false
      logError(this.config, error.message, functionName)
      fetchCampaignError = error
    }
    try {
      if (!campaigns) {
        campaigns = this.fetchVisitorCampaigns(this.visitor)
        logData.isFromCache = true
        if (campaigns) {
          logDebugSprintf(this.config, functionName, FETCH_CAMPAIGNS_FROM_CACHE,
            this.visitor.visitorId, this.visitor.anonymousId, this.visitor.context, campaigns, (Date.now() - now)
          )
        }
      }

      campaigns = campaigns || []

      this.visitor.campaigns = campaigns
      this.visitor.flagsData = this.decisionManager.getModifications(this.visitor.campaigns)
      this.visitor.emit(EMIT_READY, fetchCampaignError)

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
    this.visitor.flagSynchStatus = FlagSynchStatus.AUTHENTICATED
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
    this.visitor.flagSynchStatus = FlagSynchStatus.UNAUTHENTICATED
    logDebugSprintf(this.config, UNAUTHENTICATE, VISITOR_UNAUTHENTICATE, this.visitor.visitorId)
  }

  async fetchFlags (): Promise<void> {
    return this.globalFetchFlags(PROCESS_FETCHING_FLAGS)
  }

  async visitorExposed <T> (param:{key:string, flag?:FlagDTO, defaultValue:T}): Promise<void> {
    const { key, flag, defaultValue } = param

    const functionName = 'visitorExposed'
    if (!flag) {
      logWarningSprintf(
        this.visitor.config,
        FLAG_USER_EXPOSED,
        USER_EXPOSED_FLAG_ERROR, this.visitor.visitorId, key
      )
      const monitoring = new Troubleshooting({

        label: TroubleshootingLabel.VISITOR_EXPOSED_FLAG_NOT_FOUND,
        logLevel: LogLevel.WARNING,
        visitorId: this.visitor.visitorId,
        anonymousId: this.visitor.anonymousId,
        visitorSessionId: this.visitor.instanceId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        traffic: this.visitor.traffic,
        config: this.config,
        visitorContext: this.visitor.context,
        flagKey: key,
        flagDefault: defaultValue
      })

      this.sendTroubleshootingHit(monitoring)
      return
    }

    if (defaultValue !== null && defaultValue !== undefined && flag.value !== null && !hasSameType(flag.value, defaultValue)) {
      logWarningSprintf(
        this.visitor.config,
        FLAG_USER_EXPOSED,
        USER_EXPOSED_CAST_ERROR, this.visitor.visitorId, key
      )

      const monitoring = new Troubleshooting({

        label: TroubleshootingLabel.VISITOR_EXPOSED_TYPE_WARNING,
        logLevel: LogLevel.WARNING,
        visitorId: this.visitor.visitorId,
        anonymousId: this.visitor.anonymousId,
        visitorSessionId: this.visitor.instanceId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        traffic: this.visitor.traffic,
        config: this.config,
        visitorContext: this.visitor.context,
        flagKey: key,
        flagDefault: defaultValue
      })

      this.sendTroubleshootingHit(monitoring)
      return
    }

    if (!this.hasTrackingManager(functionName)) {
      return
    }

    await this.sendActivate(flag, defaultValue)
  }

  getFlagValue<T> (param:{ key:string, defaultValue: T, flag?:FlagDTO, userExposed?: boolean}): T {
    const { key, defaultValue, flag, userExposed } = param

    if (!flag) {
      logWarningSprintf(this.config, FLAG_VALUE, GET_FLAG_MISSING_ERROR, this.visitor.visitorId, key, defaultValue)
      const monitoring = new Troubleshooting({

        label: TroubleshootingLabel.GET_FLAG_VALUE_FLAG_NOT_FOUND,
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
        visitorExposed: userExposed
      })

      this.sendTroubleshootingHit(monitoring)
      return defaultValue
    }

    if (flag.value === null) {
      if (userExposed) {
        this.visitorExposed({ key, flag, defaultValue })
      }
      return defaultValue
    }

    if (defaultValue !== null && defaultValue !== undefined && !hasSameType(flag.value, defaultValue)) {
      logWarningSprintf(this.config, FLAG_VALUE, GET_FLAG_CAST_ERROR, this.visitor.visitorId, key, defaultValue)
      const monitoring = new Troubleshooting({

        label: TroubleshootingLabel.GET_FLAG_VALUE_TYPE_WARNING,
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
        visitorExposed: userExposed
      })

      this.sendTroubleshootingHit(monitoring)

      return defaultValue
    }

    if (userExposed) {
      this.visitorExposed({ key, flag, defaultValue })
    }

    logDebugSprintf(this.config, FLAG_VALUE, GET_FLAG_VALUE, this.visitor.visitorId, key, flag.value)

    return flag.value
  }

  getFlagMetadata (param:{metadata:IFlagMetadata, key?:string, hasSameType:boolean}):IFlagMetadata {
    const { metadata, hasSameType: checkType, key } = param
    if (!checkType) {
      logWarningSprintf(
        this.visitor.config,
        FLAG_METADATA,
        GET_METADATA_CAST_ERROR, key
      )
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
        flagKey: key,
        flagMetadataCampaignId: metadata.campaignId,
        flagMetadataCampaignSlug: metadata.slug,
        flagMetadataCampaignType: metadata.campaignType,
        flagMetadataVariationGroupId: metadata.variationGroupId,
        flagMetadataVariationId: metadata.variationGroupId,
        flagMetadataCampaignIsReference: metadata.isReference
      })

      this.sendTroubleshootingHit(monitoring)
      return FlagMetadata.Empty()
    }

    return metadata
  }
}
