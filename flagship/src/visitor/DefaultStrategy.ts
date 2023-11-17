import {
  ACTIVATE_MODIFICATION_ERROR,
  ACTIVATE_MODIFICATION_KEY_ERROR,
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
  GET_MODIFICATION_CAST_ERROR,
  GET_MODIFICATION_ERROR,
  GET_MODIFICATION_KEY_ERROR,
  GET_MODIFICATION_MISSING_ERROR,
  HitType,
  LogLevel,
  PREDEFINED_CONTEXT_TYPE_ERROR,
  PROCESS_ACTIVE_MODIFICATION,
  PROCESS_CLEAR_CONTEXT,
  PROCESS_FETCHING_FLAGS,
  PROCESS_GET_MODIFICATION,
  PROCESS_GET_MODIFICATION_INFO,
  PROCESS_SEND_HIT,
  PROCESS_SYNCHRONIZED_MODIFICATION,
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
  Transaction,
  IHitAbstract
} from '../hit/index'
import { HitShape, ItemHit } from '../hit/Legacy'
import { primitive, modificationsRequested, IHit, FlagDTO, VisitorCacheDTO, IFlagMetadata, VisitorVariations } from '../types'
import { errorFormat, hasSameType, logDebug, logDebugSprintf, logError, logErrorSprintf, logInfo, logInfoSprintf, logWarningSprintf, sprintf } from '../utils/utils'
import { VisitorStrategyAbstract } from './VisitorStrategyAbstract'
import { CampaignDTO } from '../decision/api/models'
import { FLAGSHIP_CONTEXT } from '../enum/FlagshipContext'
import { VisitorDelegate } from './index'
import { FlagMetadata } from '../flag/FlagMetadata'
import { Activate } from '../hit/Activate'
import { Troubleshooting } from '../hit/Troubleshooting'
import { FlagSynchStatus } from '../enum/FlagSynchStatus'
import { Analytic } from '../hit/Analytic'
import { DefaultHitCache } from '../cache/DefaultHitCache'
import { DefaultVisitorCache } from '../cache/DefaultVisitorCache'
import { sendVisitorAllocatedVariations } from '../qaAssistant/messages'

export const TYPE_HIT_REQUIRED_ERROR = 'property type is required and must '
export const HIT_NULL_ERROR = 'Hit must not be null'

export class DefaultStrategy extends VisitorStrategyAbstract {
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

  private checkAndGetModification<T> (
    params: modificationsRequested<T>,
    activateAll?: boolean
  ): T {
    const { key, defaultValue, activate } = params
    if (!key || typeof key !== 'string') {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_KEY_ERROR, key),
        PROCESS_GET_MODIFICATION
      )
      return defaultValue
    }

    const modification = this.visitor.flagsData.get(key)
    if (!modification) {
      logInfo(
        this.config,
        sprintf(GET_MODIFICATION_MISSING_ERROR, key),
        PROCESS_GET_MODIFICATION
      )
      return defaultValue
    }

    const castError = () => {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_CAST_ERROR, key),
        PROCESS_GET_MODIFICATION
      )

      if (!modification.value && (activate || activateAll)) {
        this.activateModification(key)
      }
    }

    if (
      typeof modification.value === 'object' &&
      typeof defaultValue === 'object' &&
      Array.isArray(modification.value) !== Array.isArray(defaultValue)
    ) {
      castError()
      return defaultValue
    }

    if (typeof modification.value !== typeof defaultValue) {
      castError()
      return defaultValue
    }

    if (activate || activateAll) {
      this.activateModification(key)
    }

    return modification.value
  }

  async getModifications<T> (
    params: modificationsRequested<T>[],
    activateAll?: boolean
  ): Promise<Record<string, T>> {
    return this.getModificationsSync(params, activateAll)
  }

  getModificationsSync<T> (
    params: modificationsRequested<T>[],
    activateAll?: boolean
  ): Record<string, T> {
    const flags: Record<string, T> = {}
    params.forEach((item) => {
      flags[item.key] = this.checkAndGetModification(item, activateAll)
    })
    return flags
  }

  async getModification<T> (params: modificationsRequested<T>): Promise<T> {
    return this.getModificationSync(params)
  }

  getModificationSync<T> (params: modificationsRequested<T>): T {
    return this.checkAndGetModification(params)
  }

  async getModificationInfo (key: string): Promise<FlagDTO | null> {
    return this.getModificationInfoSync(key)
  }

  public getModificationInfoSync (key: string): FlagDTO | null {
    if (!key || typeof key !== 'string') {
      logError(
        this.visitor.config,
        sprintf(GET_MODIFICATION_KEY_ERROR, key),
        PROCESS_GET_MODIFICATION_INFO
      )
      return null
    }

    const modification = this.visitor.flagsData.get(key)

    if (!modification) {
      logError(
        this.visitor.config,
        sprintf(GET_MODIFICATION_ERROR, key),
        PROCESS_GET_MODIFICATION_INFO
      )
      return null
    }
    return modification
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

      const assignmentHistory: Record<string, string> = {}
      const visitorAllocatedVariations: Record<string, VisitorVariations> = {}

      this.visitor.flagsData.forEach(item => {
        assignmentHistory[item.variationGroupId] = item.variationId
        visitorAllocatedVariations[item.campaignId] = {
          variationId: item.variationId,
          variationGroupId: item.variationGroupId,
          campaignId: item.campaignId
        }
      })

      sendVisitorAllocatedVariations(visitorAllocatedVariations)

      const uniqueId = this.visitor.visitorId + this.decisionManager.troubleshooting?.endDate.toUTCString()
      const hash = this._murmurHash.murmurHash3Int32(uniqueId)
      const traffic = hash % 100

      this.visitor.traffic = traffic

      const hitCacheImplementation = this.config.hitCacheImplementation
      const visitorCacheImplementation = this.config.visitorCacheImplementation
      const sdkConfigUsingCustomHitCache = hitCacheImplementation && !(hitCacheImplementation instanceof DefaultHitCache)
      const sdkConfigUsingCustomVisitorCache = visitorCacheImplementation && !(visitorCacheImplementation instanceof DefaultVisitorCache)

      const fetchFlagTroubleshooting = new Troubleshooting({
        label: 'VISITOR_FETCH_CAMPAIGNS',
        logLevel: LogLevel.INFO,
        visitorId: this.visitor.visitorId,
        anonymousId: this.visitor.anonymousId,
        visitorSessionId: this.visitor.instanceId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        traffic,
        config: this.config,
        sdkStatus: this.visitor.getSdkStatus(),
        visitorContext: this.visitor.context,
        visitorCampaigns: campaigns,
        visitorCampaignFromCache: logData.isFromCache ? campaigns : undefined,
        visitorConsent: this.visitor.hasConsented,
        visitorIsAuthenticated: !!this.visitor.anonymousId,
        visitorFlags: this.visitor.flagsData,
        visitorAssignmentHistory: assignmentHistory,
        visitorInitialCampaigns: this.visitor.sdkInitialData?.initialCampaigns,
        visitorInitialFlagsData: this.visitor.sdkInitialData?.initialFlagsData,
        lastBucketingTimestamp: this.configManager.decisionManager.lastBucketingTimestamp,
        lastInitializationTimestamp: this.visitor.sdkInitialData?.lastInitializationTimestamp,
        httpResponseTime: Date.now() - now,

        sdkConfigMode: this.config.decisionMode,
        sdkConfigTimeout: this.config.timeout,
        sdkConfigPollingInterval: this.config.pollingInterval,
        sdkConfigTrackingManagerConfigStrategy: this.config.trackingManagerConfig?.cacheStrategy,
        sdkConfigTrackingManagerConfigBatchIntervals: this.config.trackingManagerConfig?.batchIntervals,
        sdkConfigTrackingManagerConfigPoolMaxSize: this.config.trackingManagerConfig?.poolMaxSize,
        sdkConfigFetchNow: this.config.fetchNow,
        sdkConfigEnableClientCache: this.config.enableClientCache,
        sdkConfigInitialBucketing: this.config.initialBucketing,
        sdkConfigDecisionApiUrl: this.config.decisionApiUrl,
        sdkConfigHitDeduplicationTime: this.config.hitDeduplicationTime,
        sdkConfigUsingOnVisitorExposed: !!this.config.onVisitorExposed,
        sdkConfigUsingCustomHitCache,
        sdkConfigUsingCustomVisitorCache,
        sdkConfigFetchThirdPartyData: this.config.fetchThirdPartyData,
        sdkConfigFetchFlagsBufferingTime: this.config.fetchFlagsBufferingTime,
        sdkConfigDisableDeveloperUsageTracking: this.config.disableDeveloperUsageTracking,
        sdkConfigNextFetchConfig: this.config.nextFetchConfig,
        sdkConfigDisableCache: this.config.disableCache
      })

      this.sendTroubleshootingHit(fetchFlagTroubleshooting)

      const analyticData = new Analytic({
        label: 'SDK_CONFIG',
        logLevel: LogLevel.INFO,
        visitorId: this.visitor.visitorId,
        flagshipInstanceId: this.visitor.sdkInitialData?.instanceId,
        config: this.config,
        sdkStatus: this.visitor.getSdkStatus(),
        lastBucketingTimestamp: this.configManager.decisionManager.lastBucketingTimestamp,
        lastInitializationTimestamp: this.visitor.sdkInitialData?.lastInitializationTimestamp,
        sdkConfigMode: this.config.decisionMode,
        sdkConfigTimeout: this.config.timeout,
        sdkConfigPollingInterval: this.config.pollingInterval,
        sdkConfigTrackingManagerConfigStrategy: this.config.trackingManagerConfig?.cacheStrategy,
        sdkConfigTrackingManagerConfigBatchIntervals: this.config.trackingManagerConfig?.batchIntervals,
        sdkConfigTrackingManagerConfigPoolMaxSize: this.config.trackingManagerConfig?.poolMaxSize,
        sdkConfigFetchNow: this.config.fetchNow,
        sdkConfigEnableClientCache: this.config.enableClientCache,
        sdkConfigInitialBucketing: this.config.initialBucketing,
        sdkConfigDecisionApiUrl: this.config.decisionApiUrl,
        sdkConfigHitDeduplicationTime: this.config.hitDeduplicationTime,
        sdkConfigUsingOnVisitorExposed: !!this.config.onVisitorExposed,
        sdkConfigUsingCustomHitCache,
        sdkConfigUsingCustomVisitorCache,
        sdkConfigFetchThirdPartyData: this.config.fetchThirdPartyData,
        sdkConfigFetchFlagsBufferingTime: this.config.fetchFlagsBufferingTime,
        sdkConfigDisableDeveloperUsageTracking: this.config.disableDeveloperUsageTracking,
        sdkConfigNextFetchConfig: this.config.nextFetchConfig,
        sdkConfigDisableCache: this.config.disableCache
      })

      this.sendAnalyticHit(analyticData)

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

        label: 'VISITOR_FETCH_CAMPAIGNS_ERROR',
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
        sdkConfigMode: this.config.decisionMode,
        sdkConfigTimeout: this.config.timeout,
        sdkConfigPollingInterval: this.config.pollingInterval,
        sdkConfigTrackingManagerConfigStrategy: this.config.trackingManagerConfig?.cacheStrategy,
        sdkConfigTrackingManagerConfigBatchIntervals: this.config.trackingManagerConfig?.batchIntervals,
        sdkConfigTrackingManagerConfigPoolMaxSize: this.config.trackingManagerConfig?.poolMaxSize,
        sdkConfigFetchNow: this.config.fetchNow,
        sdkConfigEnableClientCache: this.config.enableClientCache,
        sdkConfigInitialBucketing: this.config.initialBucketing,
        sdkConfigDecisionApiUrl: this.config.decisionApiUrl,
        sdkConfigHitDeduplicationTime: this.config.hitDeduplicationTime
      })

      this.sendTroubleshootingHit(troubleshootingHit)
    }
  }

  async synchronizeModifications (): Promise<void> {
    return this.globalFetchFlags(PROCESS_SYNCHRONIZED_MODIFICATION)
  }

  async activateModification (params: string): Promise<void> {
    if (!params || typeof params !== 'string') {
      logError(
        this.config,
        sprintf(ACTIVATE_MODIFICATION_KEY_ERROR, params),
        PROCESS_ACTIVE_MODIFICATION
      )
      return
    }
    return this.activate(params)
  }

  activateModifications(keys: { key: string }[]): Promise<void>
  activateModifications(keys: string[]): Promise<void>
  async activateModifications (params: string[] | { key: string }[]): Promise<void> {
    if (!params || !Array.isArray(params)) {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_KEY_ERROR, params),
        PROCESS_ACTIVE_MODIFICATION
      )
      return
    }
    params.forEach((item:string | {key: string}) => {
      if (typeof item === 'string') {
        this.activate(item)
      } else this.activate(item.key)
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

    activateHit.visitorSessionId = this.visitor.instanceId
    activateHit.traffic = this.visitor.traffic
    activateHit.flagshipInstanceId = this.visitor.sdkInitialData?.instanceId

    await this.trackingManager.activateFlag(activateHit)

    const activateTroubleshooting = new Troubleshooting({

      label: 'VISITOR_SEND_ACTIVATE',
      logLevel: LogLevel.INFO,
      traffic: this.visitor.traffic,
      visitorId: activateHit.visitorId,
      flagshipInstanceId: activateHit.flagshipInstanceId,
      visitorSessionId: activateHit.visitorSessionId,
      anonymousId: activateHit.anonymousId,
      config: this.config,
      hitContent: activateHit.toApiKeys()
    })

    this.sendTroubleshootingHit(activateTroubleshooting)
  }

  private async activate (key: string) {
    const flag = this.visitor.flagsData.get(key)

    if (!flag) {
      logError(
        this.visitor.config,
        sprintf(ACTIVATE_MODIFICATION_ERROR, key),
        PROCESS_ACTIVE_MODIFICATION
      )
      return
    }

    if (!this.hasTrackingManager(PROCESS_ACTIVE_MODIFICATION)) {
      return
    }

    await this.sendActivate(flag)
  }

  sendHit(hit: HitAbstract): Promise<void>
  sendHit(hit: IHit): Promise<void>
  sendHit(hit: HitShape): Promise<void>
  async sendHit (hit: IHit | HitAbstract | HitShape): Promise<void> {
    if (!this.hasTrackingManager(PROCESS_SEND_HIT)) {
      return
    }
    await this.prepareAndSendHit(hit)
  }

  sendHits(hits: HitAbstract[]): Promise<void>
  sendHits(hits: IHit[]): Promise<void>
  sendHits(hits: HitShape[]): Promise<void>
  async sendHits (hits: HitAbstract[] | IHit[]|HitShape[]): Promise<void> {
    if (!this.hasTrackingManager(PROCESS_SEND_HIT)) {
      return
    }
    for (const hit of hits) {
      await this.prepareAndSendHit(hit)
    }
  }

  private getHitLegacy (hit: HitShape) {
    let newHit = null
    const hitTypeToEnum: Record<string, HitType> = {
      Screen: HitType.SCREEN_VIEW,
      ScreenView: HitType.SCREEN_VIEW,
      Transaction: HitType.TRANSACTION,
      Page: HitType.PAGE_VIEW,
      PageView: HitType.PAGE_VIEW,
      Item: HitType.ITEM,
      Event: HitType.EVENT
    }
    const commonProperties: Omit<IHitAbstract, 'createdAt'| 'visitorId'|'anonymousId'|'traffic'> = {
      type: hitTypeToEnum[hit.type]
    }

    const hitData: Omit<IHitAbstract, 'createdAt'| 'visitorId'|'anonymousId'|'traffic'> = { ...commonProperties, ...hit.data }

    switch (commonProperties.type?.toUpperCase()) {
      case HitType.EVENT:
        newHit = new Event(hitData as IEvent)
        break
      case HitType.ITEM:
        // eslint-disable-next-line no-case-declarations
        const data = hit.data as ItemHit
        newHit = new Item({
          ...hitData,
          productName: data.name,
          productSku: data.code,
          transactionId: data.transactionId,
          itemCategory: data.category,
          itemPrice: data.price,
          itemQuantity: data.quantity
        } as IItem)
        break
      case HitType.PAGE_VIEW:
        newHit = new Page(hitData as IPage)
        break
      case HitType.SCREEN_VIEW:
        newHit = new Screen(hitData as IScreen)
        break
      case HitType.TRANSACTION:
        newHit = new Transaction(hit.data as ITransaction)
        break
    }
    return newHit
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

  private async prepareAndSendHit (hit: IHit | HitShape | HitAbstract, functionName = PROCESS_SEND_HIT) {
    let hitInstance: HitAbstract

    if (!hit?.type) {
      logError(this.config, HIT_NULL_ERROR, functionName)
      return
    }

    if (hit instanceof HitAbstract) {
      hitInstance = hit
    } else if ('data' in hit) {
      const hitShape = hit as HitShape
      const hitFromInt = this.getHitLegacy(hitShape)
      if (!hitFromInt) {
        logError(this.config, TYPE_HIT_REQUIRED_ERROR, functionName)
        return
      }
      hitInstance = hitFromInt
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
    hitInstance.visitorSessionId = this.visitor.instanceId
    hitInstance.traffic = this.visitor.traffic
    hitInstance.flagshipInstanceId = this.visitor.sdkInitialData?.instanceId

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

      if (this.visitor.traffic === undefined || hitInstance.type === 'SEGMENT') {
        return
      }
      const sendHitTroubleshooting = new Troubleshooting({

        label: 'VISITOR_SEND_HIT',
        logLevel: LogLevel.INFO,
        traffic: this.visitor.traffic,
        visitorId: hitInstance.visitorId,
        flagshipInstanceId: hitInstance.flagshipInstanceId,
        visitorSessionId: hitInstance.visitorSessionId,
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

  /**
   * returns a Promise<object> containing all the data for all the campaigns associated with the current visitor.
   *@deprecated
   */
  public async getAllModifications (activate = false): Promise<{
    visitorId: string
    campaigns: CampaignDTO[]
  }> {
    return this.getAllFlagsData(activate)
  }

  async getAllFlagsData (activate: boolean): Promise<{ visitorId: string; campaigns: CampaignDTO[] }> {
    if (activate) {
      this.visitor.flagsData.forEach((_, key) => {
        this.activateModification(key)
      })
    }
    return {
      visitorId: this.visitor.visitorId,
      campaigns: this.visitor.campaigns
    }
  }

  /**
   * Get data for a specific campaign.
   * @param campaignId Identifies the campaign whose modifications you want to retrieve.
   * @param activate
   * @deprecated
   * @returns
   */
  public async getModificationsForCampaign (campaignId: string, activate = false): Promise<{ visitorId: string; campaigns: CampaignDTO[]}> {
    return this.getFlatsDataForCampaign(campaignId, activate)
  }

  async getFlatsDataForCampaign (campaignId: string, activate: boolean): Promise<{ visitorId: string; campaigns: CampaignDTO[] }> {
    if (activate) {
      this.visitor.flagsData.forEach((value) => {
        if (value.campaignId === campaignId) {
          this.visitorExposed({ key: value.key, flag: value, defaultValue: value.value })
        }
      })
    }

    return {
      visitorId: this.visitor.visitorId,
      campaigns: this.visitor.campaigns.filter((x) => x.id === campaignId)
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

      label: 'VISITOR_AUTHENTICATE',
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

      label: 'VISITOR_UNAUTHENTICATE',
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

    const functionName = 'userExposed'
    if (!flag) {
      logWarningSprintf(
        this.visitor.config,
        FLAG_USER_EXPOSED,
        USER_EXPOSED_FLAG_ERROR, this.visitor.visitorId, key
      )
      const monitoring = new Troubleshooting({

        label: 'VISITOR_EXPOSED_FLAG_NOT_FOUND',
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

        label: 'VISITOR_EXPOSED_TYPE_WARNING',
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

        label: 'GET_FLAG_VALUE_FLAG_NOT_FOUND',
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

        label: 'GET_FLAG_VALUE_TYPE_WARNING',
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
        label: 'GET_FLAG_METADATA_TYPE_WARNING',
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
