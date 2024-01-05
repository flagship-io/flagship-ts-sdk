import { IFlagshipConfig } from '../config/index.ts'
import { CacheStrategy, FlagshipStatus, LogLevel } from '../enum/index.ts'
import {
  CUSTOMER_ENV_ID_API_ITEM,
  DS_API_ITEM,
  SDK_APP,
  SDK_INFO,
  T_API_ITEM,
  VISITOR_ID_API_ITEM
} from '../enum/FlagshipConstant.ts'
import { HitAbstract, IHitAbstract } from './HitAbstract.ts'
import { BucketingDTO } from '../decision/api/bucketingDTO.ts'
import { FlagDTO, TroubleshootingLabel, primitive } from '../types.ts'
import { CampaignDTO } from '../mod.ts'
import { BatchTriggeredBy } from '../enum/BatchTriggeredBy.ts'

export const ERROR_MESSAGE = 'event category and event action are required'

export interface IDiagnostic extends IHitAbstract{
    version?: string
    logLevel: LogLevel
    accountId?:string
    envId?:string
    timestamp?:string
    timeZone?: string
    label: TroubleshootingLabel
    lastInitializationTimestamp?: string
    lastBucketingTimestamp?: string

    stackType?: string
    stackName?: string
    stackVersion?: string
    stackOriginName?: string
    stackOriginVersion?: string

    sdkStatus?: FlagshipStatus
    sdkConfigMode?: string
    sdkConfigCustomLogManager?: boolean
    sdkConfigCustomCacheManager?: boolean
    sdkConfigStatusListener?: boolean
    sdkConfigTimeout?: number
    sdkConfigPollingInterval?: number
    sdkConfigFetchNow?: boolean
    sdkConfigEnableClientCache?: boolean
    sdkConfigInitialBucketing?:BucketingDTO
    sdkConfigDecisionApiUrl?: string
    sdkConfigHitDeduplicationTime?: number
    sdkConfigTrackingManagerConfigStrategy?: CacheStrategy
    sdkConfigTrackingManagerConfigBatchIntervals?: number
    sdkConfigTrackingManagerConfigPoolMaxSize?: number
    sdkBucketingFile?: BucketingDTO
    sdkConfigUsingCustomHitCache?: boolean
    sdkConfigUsingCustomVisitorCache?: boolean
    sdkConfigUsingOnVisitorExposed?: boolean
    sdkConfigFetchThirdPartyData?:boolean
    sdkConfigFetchFlagsBufferingTime?:number
    sdkConfigNextFetchConfig?:Record<string, unknown>
    sdkConfigDisableDeveloperUsageTracking?:boolean
    sdkConfigDisableCache?:boolean

    httpRequestUrl?:string
    httpRequestMethod?:string
    httpRequestHeaders?:Record<string, unknown>
    httpRequestBody?:unknown

    httpResponseUrl?:string
    httpResponseMethod?: string
    httpResponseHeaders?: Record<string, unknown>
    httpResponseCode?: number
    httpResponseBody?: unknown
    httpResponseTime?:number

    visitorStatus?: string
    visitorInstanceType?: string
    visitorContext?: Record<string, primitive>
    visitorConsent?: boolean
    visitorAssignmentHistory?: Record<string, string>
    visitorFlags?: Map<string, FlagDTO>
    visitorCampaigns?: CampaignDTO[] | null
    visitorCampaignFromCache?: CampaignDTO[] | null
    visitorIsAuthenticated?:boolean
    visitorInitialCampaigns?:CampaignDTO[]
    visitorInitialFlagsData? : Map<string, FlagDTO>|FlagDTO[]

    contextKey?:string
    contextValue?: unknown

    flagKey?: string
    flagValue?: string
    flagDefault?: unknown
    visitorExposed?: boolean

    flagMetadataCampaignId?:string
    flagMetadataCampaignName?:string
    flagMetadataVariationGroupId?: string
    flagMetadataVariationGroupName?: string
    flagMetadataVariationId?: string
    flagMetadataVariationName?: string
    flagMetadataCampaignSlug?: string|null
    flagMetadataCampaignType?: string
    flagMetadataCampaignIsReference?: boolean

    hitContent?: Record<string, unknown>
    batchTriggeredBy?: BatchTriggeredBy

  }

export abstract class Diagnostic extends HitAbstract implements IDiagnostic {
  private _logVersion? : string
  private _logLevel! : LogLevel
  private _accountId? : string
  private _envId? : string
  private _timestamp? : string
  private _label! : TroubleshootingLabel
  private _stackType? : string
  private _stackName? : string
  private _stackVersion? : string
  private _stackOriginName? : string
  private _stackOriginVersion? : string
  private _sdkStatus? : FlagshipStatus
  private _sdkConfigMode? : string
  private _sdkConfigCustomLogManager? : boolean
  private _sdkConfigCustomCacheManager? : boolean
  private _sdkConfigStatusListener? : boolean
  private _sdkConfigTimeout? : number
  private _sdkConfigPollingTime? : number
  private _sdkConfigTrackingManagerConfigStrategy? : CacheStrategy
  private _sdkConfigTrackingManagerConfigBatchIntervals? : number
  private _sdkConfigTrackingManagerConfigBatchLength? : number
  private _httpRequestUrl? : string
  private _httpRequestMethod? : string
  private _httpRequestHeaders? : Record<string, unknown>
  private _httpRequestBody? : unknown
  private _httpResponseUrl? : string
  private _httpResponseMethod? : string
  private _httpResponseHeaders? : Record<string, unknown>
  private _httpResponseBody? : unknown
  private _visitorStatus? : string
  private _visitorInstanceType? : string
  private _visitorContext? : Record<string, primitive>
  private _visitorConsent? : boolean
  private _visitorAssignmentHistory? : Record<string, string>
  private _visitorFlags? : Map<string, FlagDTO>
  private _visitorIsAuthenticated? : boolean
  private _flagKey? : string
  private _flagValue? : string
  private _flagDefault? : unknown
  private _flagMetadataCampaignId? : string
  private _flagMetadataVariationGroupId? : string
  private _flagMetadataVariationId? : string
  private _flagMetadataCampaignSlug? : string | null | undefined
  private _flagMetadataCampaignType? : string
  private _sdkConfigFetchNow? : boolean
  private _sdkConfigEnableClientCache? : boolean
  private _sdkConfigInitialBucketing? : BucketingDTO
  private _sdkConfigDecisionApiUrl? : string
  private _sdkConfigHitDeduplicationTime? : number
  private _visitorInitialCampaigns? : CampaignDTO[]
  private _visitorInitialFlagsData? : Map<string, FlagDTO>|FlagDTO[]
  private _visitorCampaign? : CampaignDTO[]|null
  private _httRequestTime? : number
  private _hitContent? : Record<string, unknown>
  private _httpInstanceId? : string
  private _lastInitializationTimestamp? : string
  private _lastBucketingTimestamp? : string
  private _batchTriggeredBy? : BatchTriggeredBy
  private _visitorCampaignFromCache? : CampaignDTO[]|null
  private _timeZone? : string
  private _flagMetadataCampaignIsReference : boolean|undefined
  private _contextKey? : string
  private _contextValue? : unknown
  private _sdkBucketingFile? : BucketingDTO
  private _flagMetadataCampaignName? : string
  private _flagMetadataVariationGroupName? : string
  private _flagMetadataVariationName? : string
  private _sdkConfigUsingCustomHitCache? : boolean
  private _sdkConfigUsingCustomVisitorCache? : boolean
  private _sdkConfigUsingOnVisitorExposed? : boolean
  private _sdkConfigFetchThirdPartyData? : boolean
  private _sdkConfigFetchFlagsBufferingTime? : number
  private _sdkConfigNextFetchConfig? : Record<string, unknown>
  private _sdkConfigDisableDeveloperUsageTracking? : boolean
  private _sdkConfigDisableCache? : boolean

  public get sdkConfigDisableCache () : boolean|undefined {
    return this._sdkConfigDisableCache
  }

  public set sdkConfigDisableCache (v : boolean|undefined) {
    this._sdkConfigDisableCache = v
  }

  public get sdkConfigDisableDeveloperUsageTracking () : boolean|undefined {
    return this._sdkConfigDisableDeveloperUsageTracking
  }

  public set sdkConfigDisableDeveloperUsageTracking (v : boolean|undefined) {
    this._sdkConfigDisableDeveloperUsageTracking = v
  }

  public get sdkConfigNextFetchConfig () : Record<string, unknown>|undefined {
    return this._sdkConfigNextFetchConfig
  }

  public set sdkConfigNextFetchConfig (v : Record<string, unknown>|undefined) {
    this._sdkConfigNextFetchConfig = v
  }

  public get sdkConfigFetchFlagsBufferingTime () : number|undefined {
    return this._sdkConfigFetchFlagsBufferingTime
  }

  public set sdkConfigFetchFlagsBufferingTime (v : number|undefined) {
    this._sdkConfigFetchFlagsBufferingTime = v
  }

  public get sdkConfigFetchThirdPartyData () : boolean|undefined {
    return this._sdkConfigFetchThirdPartyData
  }

  public set sdkConfigFetchThirdPartyData (v : boolean|undefined) {
    this._sdkConfigFetchThirdPartyData = v
  }

  public get sdkConfigUsingOnVisitorExposed () : boolean|undefined {
    return this._sdkConfigUsingOnVisitorExposed
  }

  public set sdkConfigUsingOnVisitorExposed (v : boolean|undefined) {
    this._sdkConfigUsingOnVisitorExposed = v
  }

  public get sdkConfigUsingCustomVisitorCache () : boolean|undefined {
    return this._sdkConfigUsingCustomVisitorCache
  }

  public set sdkConfigUsingCustomVisitorCache (v : boolean|undefined) {
    this._sdkConfigUsingCustomVisitorCache = v
  }

  public get sdkConfigUsingCustomHitCache () : boolean|undefined {
    return this._sdkConfigUsingCustomHitCache
  }

  public set sdkConfigUsingCustomHitCache (v : boolean|undefined) {
    this._sdkConfigUsingCustomHitCache = v
  }

  public get flagMetadataVariationName () : string|undefined {
    return this._flagMetadataVariationName
  }

  public set flagMetadataVariationName (v : string|undefined) {
    this._flagMetadataVariationName = v
  }

  public get flagMetadataVariationGroupName () : string|undefined {
    return this._flagMetadataVariationGroupName
  }

  public set flagMetadataVariationGroupName (v : string|undefined) {
    this._flagMetadataVariationGroupName = v
  }

  public get flagMetadataCampaignName () : string|undefined {
    return this._flagMetadataCampaignName
  }

  public set flagMetadataCampaignName (v : string|undefined) {
    this._flagMetadataCampaignName = v
  }

  public get sdkBucketingFile () : BucketingDTO|undefined {
    return this._sdkBucketingFile
  }

  public set sdkBucketingFile (v : BucketingDTO|undefined) {
    this._sdkBucketingFile = v
  }

  public get contextValue () : unknown|undefined {
    return this._contextValue
  }

  public set contextValue (v : unknown|undefined) {
    this._contextValue = v
  }

  public get contextKey () : string|undefined {
    return this._contextKey
  }

  public set contextKey (v : string|undefined) {
    this._contextKey = v
  }

  public get flagMetadataCampaignIsReference () : boolean|undefined {
    return this._flagMetadataCampaignIsReference
  }

  public set flagMetadataCampaignIsReference (v : boolean|undefined) {
    this._flagMetadataCampaignIsReference = v
  }

  public get timeZone () : string|undefined {
    return this._timeZone
  }

  public set timeZone (v : string|undefined) {
    this._timeZone = v
  }

  public get visitorCampaignFromCache () : CampaignDTO[]|null|undefined {
    return this._visitorCampaignFromCache
  }

  public set visitorCampaignFromCache (v : CampaignDTO[]|null|undefined) {
    this._visitorCampaignFromCache = v
  }

  public get batchTriggeredBy () : BatchTriggeredBy|undefined {
    return this._batchTriggeredBy
  }

  public set batchTriggeredBy (v : BatchTriggeredBy|undefined) {
    this._batchTriggeredBy = v
  }

  public get lastBucketingTimestamp () : string|undefined {
    return this._lastBucketingTimestamp
  }

  public set lastBucketingTimestamp (v : string|undefined) {
    this._lastBucketingTimestamp = v
  }

  public get lastInitializationTimestamp () : string|undefined {
    return this._lastInitializationTimestamp
  }

  public set lastInitializationTimestamp (v : string|undefined) {
    this._lastInitializationTimestamp = v
  }

  public get hitContent () : Record<string, unknown>|undefined {
    return this._hitContent
  }

  public set hitContent (v : Record<string, unknown>|undefined) {
    this._hitContent = v
  }

  public get httpResponseTime () : number|undefined {
    return this._httRequestTime
  }

  public set httpResponseTime (v : number|undefined) {
    this._httRequestTime = v
  }

  public get visitorCampaigns () : CampaignDTO[]|null|undefined {
    return this._visitorCampaign
  }

  public set visitorCampaigns (v : CampaignDTO[]|null|undefined) {
    this._visitorCampaign = v
  }

  public get visitorInitialFlagsData () : Map<string, FlagDTO>|FlagDTO[]|undefined {
    return this._visitorInitialFlagsData
  }

  public set visitorInitialFlagsData (v : Map<string, FlagDTO>|FlagDTO[]|undefined) {
    this._visitorInitialFlagsData = v
  }

  public get visitorInitialCampaigns () : CampaignDTO[]|undefined {
    return this._visitorInitialCampaigns
  }

  public set visitorInitialCampaigns (v : CampaignDTO[]|undefined) {
    this._visitorInitialCampaigns = v
  }

  public get sdkConfigHitDeduplicationTime () : number|undefined {
    return this._sdkConfigHitDeduplicationTime
  }

  public set sdkConfigHitDeduplicationTime (v : number|undefined) {
    this._sdkConfigHitDeduplicationTime = v
  }

  public get sdkConfigDecisionApiUrl () : string|undefined {
    return this._sdkConfigDecisionApiUrl
  }

  public set sdkConfigDecisionApiUrl (v : string|undefined) {
    this._sdkConfigDecisionApiUrl = v
  }

  public get sdkConfigInitialBucketing () : BucketingDTO|undefined {
    return this._sdkConfigInitialBucketing
  }

  public set sdkConfigInitialBucketing (v : BucketingDTO|undefined) {
    this._sdkConfigInitialBucketing = v
  }

  public get sdkConfigEnableClientCache () : boolean|undefined {
    return this._sdkConfigEnableClientCache
  }

  public set sdkConfigEnableClientCache (v : boolean|undefined) {
    this._sdkConfigEnableClientCache = v
  }

  public get sdkConfigFetchNow () : boolean|undefined {
    return this._sdkConfigFetchNow
  }

  public set sdkConfigFetchNow (v : boolean|undefined) {
    this._sdkConfigFetchNow = v
  }

  public get flagMetadataCampaignType () : string|undefined {
    return this._flagMetadataCampaignType
  }

  public set flagMetadataCampaignType (v : string | undefined) {
    this._flagMetadataCampaignType = v
  }

  public get flagMetadataCampaignSlug () : string | null | undefined {
    return this._flagMetadataCampaignSlug
  }

  public set flagMetadataCampaignSlug (v : string | null | undefined) {
    this._flagMetadataCampaignSlug = v
  }

  public get flagMetadataVariationId () : string|undefined {
    return this._flagMetadataVariationId
  }

  public set flagMetadataVariationId (v : string|undefined) {
    this._flagMetadataVariationId = v
  }

  public get flagMetadataVariationGroupId () : string|undefined {
    return this._flagMetadataVariationGroupId
  }

  public set flagMetadataVariationGroupId (v : string|undefined) {
    this._flagMetadataVariationGroupId = v
  }

  public get flagMetadataCampaignId () : string|undefined {
    return this._flagMetadataCampaignId
  }

  public set flagMetadataCampaignId (v : string|undefined) {
    this._flagMetadataCampaignId = v
  }

  public get flagDefault () : unknown|undefined {
    return this._flagDefault
  }

  public set flagDefault (v : unknown|undefined) {
    this._flagDefault = v
  }

  public get flagValue () : string|undefined {
    return this._flagValue
  }

  public set flagValue (v : string|undefined) {
    this._flagValue = v
  }

  public get flagKey () : string|undefined {
    return this._flagKey
  }

  public set flagKey (v : string|undefined) {
    this._flagKey = v
  }

  public get visitorIsAuthenticated () : boolean|undefined {
    return this._visitorIsAuthenticated
  }

  public set visitorIsAuthenticated (v : boolean|undefined) {
    this._visitorIsAuthenticated = v
  }

  public get visitorFlags () : Map<string, FlagDTO>|undefined {
    return this._visitorFlags
  }

  public set visitorFlags (v : Map<string, FlagDTO>|undefined) {
    this._visitorFlags = v
  }

  public get visitorAssignmentHistory () : Record<string, string>|undefined {
    return this._visitorAssignmentHistory
  }

  public set visitorAssignmentHistory (v : Record<string, string>|undefined) {
    this._visitorAssignmentHistory = v
  }

  public get visitorConsent () : boolean|undefined {
    return this._visitorConsent
  }

  public set visitorConsent (v : boolean|undefined) {
    this._visitorConsent = v
  }

  public get visitorContext () : Record<string, primitive>|undefined {
    return this._visitorContext
  }

  public set visitorContext (v : Record<string, primitive>|undefined) {
    this._visitorContext = v
  }

  public get visitorInstanceType () : string|undefined {
    return this._visitorInstanceType
  }

  public set visitorInstanceType (v : string|undefined) {
    this._visitorInstanceType = v
  }

  public get visitorStatus () : string|undefined {
    return this._visitorStatus
  }

  public set visitorStatus (v : string|undefined) {
    this._visitorStatus = v
  }

  public get httpResponseBody () : unknown|undefined {
    return this._httpResponseBody
  }

  public set httpResponseBody (v : unknown|undefined) {
    this._httpResponseBody = v
  }

  private _httpResponseCode? : number
  public get httpResponseCode () : number|undefined {
    return this._httpResponseCode
  }

  public set httpResponseCode (v : number|undefined) {
    this._httpResponseCode = v
  }

  public get httpResponseHeaders () : Record<string, unknown>|undefined {
    return this._httpResponseHeaders
  }

  public set httpResponseHeaders (v : Record<string, unknown>|undefined) {
    this._httpResponseHeaders = v
  }

  public get httpResponseMethod () : string|undefined {
    return this._httpResponseMethod
  }

  public set httpResponseMethod (v : string|undefined) {
    this._httpResponseMethod = v
  }

  public get httpResponseUrl () : string|undefined {
    return this._httpResponseUrl
  }

  public set httpResponseUrl (v : string|undefined) {
    this._httpResponseUrl = v
  }

  public get httpRequestBody () : unknown|undefined {
    return this._httpRequestBody
  }

  public set httpRequestBody (v : unknown|undefined) {
    this._httpRequestBody = v
  }

  public get httpRequestHeaders () : Record<string, unknown>|undefined {
    return this._httpRequestHeaders
  }

  public set httpRequestHeaders (v : Record<string, unknown>|undefined) {
    this._httpRequestHeaders = v
  }

  public get httpRequestMethod () : string|undefined {
    return this._httpRequestMethod
  }

  public set httpRequestMethod (v : string|undefined) {
    this._httpRequestMethod = v
  }

  public get httpRequestUrl () : string|undefined {
    return this._httpRequestUrl
  }

  public set httpRequestUrl (v : string|undefined) {
    this._httpRequestUrl = v
  }

  public get sdkConfigTrackingManagerConfigPoolMaxSize () : number|undefined {
    return this._sdkConfigTrackingManagerConfigBatchLength
  }

  public set sdkConfigTrackingManagerConfigPoolMaxSize (v : number|undefined) {
    this._sdkConfigTrackingManagerConfigBatchLength = v
  }

  public get sdkConfigTrackingManagerConfigBatchIntervals () : number|undefined {
    return this._sdkConfigTrackingManagerConfigBatchIntervals
  }

  public set sdkConfigTrackingManagerConfigBatchIntervals (v : number|undefined) {
    this._sdkConfigTrackingManagerConfigBatchIntervals = v
  }

  public get sdkConfigTrackingManagerConfigStrategy () : CacheStrategy|undefined {
    return this._sdkConfigTrackingManagerConfigStrategy
  }

  public set sdkConfigTrackingManagerConfigStrategy (v : CacheStrategy|undefined) {
    this._sdkConfigTrackingManagerConfigStrategy = v
  }

  public get sdkConfigPollingInterval () : number|undefined {
    return this._sdkConfigPollingTime
  }

  public set sdkConfigPollingInterval (v : number|undefined) {
    this._sdkConfigPollingTime = v
  }

  public get sdkConfigTimeout () : number|undefined {
    return this._sdkConfigTimeout
  }

  public set sdkConfigTimeout (v : number|undefined) {
    this._sdkConfigTimeout = v
  }

  public get sdkConfigStatusListener () : boolean|undefined {
    return this._sdkConfigStatusListener
  }

  public set sdkConfigStatusListener (v : boolean|undefined) {
    this._sdkConfigStatusListener = v
  }

  public get sdkConfigCustomCacheManager () : boolean|undefined {
    return this._sdkConfigCustomCacheManager
  }

  public set sdkConfigCustomCacheManager (v : boolean|undefined) {
    this._sdkConfigCustomCacheManager = v
  }

  public get sdkConfigCustomLogManager () : boolean|undefined {
    return this._sdkConfigCustomLogManager
  }

  public set sdkConfigCustomLogManager (v : boolean|undefined) {
    this._sdkConfigCustomLogManager = v
  }

  public get sdkConfigMode () : string|undefined {
    return this._sdkConfigMode
  }

  public set sdkConfigMode (v : string|undefined) {
    this._sdkConfigMode = v
  }

  public get sdkStatus () : FlagshipStatus|undefined {
    return this._sdkStatus
  }

  public set sdkStatus (v : FlagshipStatus|undefined) {
    this._sdkStatus = v
  }

  public get stackOriginVersion () : string|undefined {
    return this._stackOriginVersion
  }

  public set stackOriginVersion (v : string|undefined) {
    this._stackOriginVersion = v
  }

  public get stackOriginName () : string|undefined {
    return this._stackOriginName
  }

  public set stackOriginName (v : string|undefined) {
    this._stackOriginName = v
  }

  public get stackVersion () : string|undefined {
    return this._stackVersion
  }

  public set stackVersion (v : string|undefined) {
    this._stackVersion = v
  }

  public get stackName () : string|undefined {
    return this._stackName
  }

  public set stackName (v : string|undefined) {
    this._stackName = v
  }

  public get stackType () : string|undefined {
    return this._stackType
  }

  public set stackType (v : string|undefined) {
    this._stackType = v
  }

  public get label () : TroubleshootingLabel {
    return this._label
  }

  public set label (v : TroubleshootingLabel) {
    this._label = v
  }

  public get timestamp () : string|undefined {
    return this._timestamp
  }

  public set timestamp (v : string|undefined) {
    this._timestamp = v
  }

  public get envId () : string|undefined {
    return this._envId
  }

  public set envId (v : string|undefined) {
    this._envId = v
  }

  public get accountId () : string|undefined {
    return this._accountId
  }

  public set accountId (v : string|undefined) {
    this._accountId = v
  }

  public get logLevel () : LogLevel {
    return this._logLevel
  }

  public set logLevel (v : LogLevel) {
    this._logLevel = v
  }

  public get version () : string|undefined {
    return this._logVersion
  }

  public set version (v : string|undefined) {
    this._logVersion = v
  }

  public constructor (param:Omit<IDiagnostic & {config: IFlagshipConfig},
        'createdAt'|'category'>) {
    super({
      type: param.type,
      userIp: param.userIp,
      screenResolution: param.screenResolution,
      locale: param.locale,
      sessionNumber: param.sessionNumber,
      visitorId: param.visitorId,
      anonymousId: param.anonymousId,
      visitorSessionId: param.visitorSessionId
    })
    const {
      version: logVersion, logLevel, accountId, envId, timestamp, label, stackType,
      stackName, stackVersion, stackOriginName, stackOriginVersion, sdkStatus, sdkConfigMode, sdkConfigCustomLogManager,
      sdkConfigCustomCacheManager, sdkConfigStatusListener, sdkConfigTimeout, sdkConfigPollingInterval, sdkConfigTrackingManagerConfigStrategy, sdkConfigTrackingManagerConfigBatchIntervals,
      sdkConfigTrackingManagerConfigPoolMaxSize, httpRequestUrl, httpRequestMethod,
      httpRequestHeaders, httpRequestBody, httpResponseTime,
      httpResponseUrl, httpResponseMethod, httpResponseHeaders, httpResponseCode, httpResponseBody, visitorStatus, visitorInstanceType, visitorContext,
      visitorConsent, visitorAssignmentHistory, visitorFlags, visitorIsAuthenticated, config, flagKey, flagValue, flagDefault,
      flagMetadataCampaignId, flagMetadataVariationGroupId, flagMetadataVariationId, flagMetadataCampaignSlug, flagMetadataCampaignType, sdkConfigFetchNow, sdkConfigEnableClientCache,
      sdkConfigInitialBucketing, sdkConfigDecisionApiUrl, sdkConfigHitDeduplicationTime, flagshipInstanceId, hitContent, traffic,
      lastInitializationTimestamp, lastBucketingTimestamp, batchTriggeredBy, visitorCampaigns, visitorCampaignFromCache, visitorInitialCampaigns,
      visitorInitialFlagsData, flagMetadataCampaignIsReference, contextKey, contextValue, sdkBucketingFile, flagMetadataCampaignName, flagMetadataVariationGroupName,
      flagMetadataVariationName, sdkConfigUsingCustomHitCache, sdkConfigUsingCustomVisitorCache, sdkConfigUsingOnVisitorExposed, sdkConfigFetchThirdPartyData,
      sdkConfigFetchFlagsBufferingTime, sdkConfigDisableDeveloperUsageTracking, sdkConfigNextFetchConfig, sdkConfigDisableCache
    } = param
    this.sdkConfigDisableCache = sdkConfigDisableCache
    this.sdkConfigDisableDeveloperUsageTracking = sdkConfigDisableDeveloperUsageTracking
    this.sdkConfigNextFetchConfig = sdkConfigNextFetchConfig
    this.sdkConfigFetchFlagsBufferingTime = sdkConfigFetchFlagsBufferingTime
    this.sdkConfigFetchThirdPartyData = sdkConfigFetchThirdPartyData
    this.sdkConfigUsingCustomHitCache = sdkConfigUsingCustomHitCache
    this.sdkConfigUsingCustomVisitorCache = sdkConfigUsingCustomVisitorCache
    this.sdkConfigUsingOnVisitorExposed = sdkConfigUsingOnVisitorExposed
    this.flagMetadataCampaignName = flagMetadataCampaignName
    this.flagMetadataVariationGroupName = flagMetadataVariationGroupName
    this.flagMetadataVariationName = flagMetadataVariationName
    this.traffic = traffic
    this.sdkBucketingFile = sdkBucketingFile
    this.contextKey = contextKey
    this.contextValue = contextValue
    this.lastBucketingTimestamp = lastBucketingTimestamp
    this.lastInitializationTimestamp = lastInitializationTimestamp
    this.batchTriggeredBy = batchTriggeredBy
    this.visitorCampaigns = visitorCampaigns
    this.visitorAssignmentHistory = visitorAssignmentHistory
    this.visitorInitialCampaigns = visitorInitialCampaigns
    this.visitorInitialFlagsData = visitorInitialFlagsData
    this.visitorCampaignFromCache = visitorCampaignFromCache
    this.flagMetadataCampaignIsReference = flagMetadataCampaignIsReference
    this.config = config
    this.version = logVersion || '1'
    this.logLevel = logLevel
    this.flagshipInstanceId = flagshipInstanceId
    this.accountId = accountId
    this.envId = envId || config.envId
    this.timestamp = timestamp || new Date(Date.now()).toISOString()
    this.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    this.label = label
    this.stackType = stackType || 'SDK'
    this.stackName = stackName || SDK_INFO.name
    this.stackVersion = stackVersion || SDK_INFO.version
    this.stackOriginName = stackOriginName
    this.stackOriginVersion = stackOriginVersion
    this.sdkStatus = sdkStatus
    this.sdkConfigMode = sdkConfigMode
    this.sdkConfigCustomLogManager = sdkConfigCustomLogManager
    this.sdkConfigCustomCacheManager = sdkConfigCustomCacheManager
    this.sdkConfigStatusListener = sdkConfigStatusListener
    this.sdkConfigTimeout = sdkConfigTimeout
    this.sdkConfigPollingInterval = sdkConfigPollingInterval
    this.sdkConfigTrackingManagerConfigStrategy = sdkConfigTrackingManagerConfigStrategy
    this.sdkConfigTrackingManagerConfigBatchIntervals = sdkConfigTrackingManagerConfigBatchIntervals
    this.sdkConfigTrackingManagerConfigPoolMaxSize = sdkConfigTrackingManagerConfigPoolMaxSize
    this.sdkConfigFetchNow = sdkConfigFetchNow
    this.sdkConfigEnableClientCache = sdkConfigEnableClientCache
    this.sdkConfigInitialBucketing = sdkConfigInitialBucketing
    this.sdkConfigDecisionApiUrl = sdkConfigDecisionApiUrl
    this.sdkConfigHitDeduplicationTime = sdkConfigHitDeduplicationTime
    this.httpRequestUrl = httpRequestUrl
    this.httpRequestMethod = httpRequestMethod
    this.httpRequestHeaders = httpRequestHeaders
    this.httpRequestBody = httpRequestBody
    this.httpResponseUrl = httpResponseUrl
    this.httpResponseMethod = httpResponseMethod
    this.httpResponseHeaders = httpResponseHeaders
    this.httpResponseCode = httpResponseCode
    this.httpResponseBody = httpResponseBody
    this.httpResponseTime = httpResponseTime
    this.visitorStatus = visitorStatus
    this.visitorInstanceType = visitorInstanceType
    this.visitorContext = visitorContext
    this.visitorConsent = visitorConsent
    this.visitorAssignmentHistory = visitorAssignmentHistory
    this.visitorFlags = visitorFlags
    this.visitorIsAuthenticated = visitorIsAuthenticated
    this.flagKey = flagKey
    this.flagValue = flagValue
    this.flagDefault = flagDefault
    this.flagMetadataCampaignId = flagMetadataCampaignId
    this.flagMetadataVariationGroupId = flagMetadataVariationGroupId
    this.flagMetadataVariationId = flagMetadataVariationId
    this.flagMetadataCampaignSlug = flagMetadataCampaignSlug
    this.flagMetadataCampaignType = flagMetadataCampaignType
    this.hitContent = hitContent
    this.ds = SDK_APP
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, complexity
  public toApiKeys (): any {
    const apiKeys:Record<string, unknown> = {
      [VISITOR_ID_API_ITEM]: this.visitorId,
      [DS_API_ITEM]: this.ds,
      [CUSTOMER_ENV_ID_API_ITEM]: `${this.config?.envId}`,
      [T_API_ITEM]: this.type,
      cv: {}
    }
    const customVariable:Record<string, unknown> = {
      version: `${this.version}`,
      logLevel: `${LogLevel[this.logLevel]}`,
      timestamp: `${this.timestamp}`,
      timeZone: `${this.timeZone}`,
      label: `${this.label}`,
      'stack.type': `${this.stackType}`,
      'stack.name': `${this.stackName}`,
      'stack.version': `${this.stackVersion}`
    }

    if (this.lastBucketingTimestamp !== undefined) {
      customVariable.lastBucketingTimestamp = `${this.lastBucketingTimestamp}`
    }

    if (this.lastInitializationTimestamp !== undefined) {
      customVariable.lastInitializationTimestamp = `${this.lastInitializationTimestamp}`
    }

    if (this.flagshipInstanceId !== undefined) {
      customVariable.flagshipInstanceId = `${this.flagshipInstanceId}`
    }

    if (this.accountId) {
      customVariable.accountId = `${this.accountId}`
    }

    if (this.envId) {
      customVariable.envId = `${this.envId}`
    }

    if (this.sdkBucketingFile !== undefined) {
      customVariable.sdkBucketingFile = JSON.stringify(this.sdkBucketingFile)
    }

    if (this.stackOriginName !== undefined) {
      customVariable['stack.origin.name'] = `${this.stackOriginName}`
    }
    if (this.stackOriginVersion !== undefined) {
      customVariable['stack.origin.version'] = `${this.stackOriginVersion}`
    }
    if (this.sdkStatus !== undefined) {
      customVariable['sdk.status'] = `${FlagshipStatus[this.sdkStatus]}`
    }
    if (this.sdkConfigMode !== undefined) {
      customVariable['sdk.config.mode'] = `${this.sdkConfigMode}`
    }
    if (this.sdkConfigCustomLogManager !== undefined) {
      customVariable['sdk.config.customLogManager'] = `${this.sdkConfigCustomLogManager}`
    }
    if (this.sdkConfigCustomCacheManager !== undefined) {
      customVariable['sdk.config.customCacheManager'] = `${this.sdkConfigCustomCacheManager}`
    }
    if (this.sdkConfigStatusListener !== undefined) {
      customVariable['sdk.config.custom.StatusListener'] = `${this.sdkConfigStatusListener}`
    }
    if (this.sdkConfigTimeout !== undefined) {
      customVariable['sdk.config.timeout'] = `${this.sdkConfigTimeout}`
    }
    if (this.sdkConfigPollingInterval !== undefined) {
      customVariable['sdk.config.pollingTime'] = `${this.sdkConfigPollingInterval}`
    }
    if (this.sdkConfigTrackingManagerConfigStrategy !== undefined) {
      customVariable['sdk.config.trackingManager.strategy'] = `${CacheStrategy[this.sdkConfigTrackingManagerConfigStrategy]}`
    }
    if (this.sdkConfigTrackingManagerConfigBatchIntervals !== undefined) {
      customVariable['sdk.config.trackingManager.batchIntervals'] = `${this.sdkConfigTrackingManagerConfigBatchIntervals}`
    }
    if (this.sdkConfigTrackingManagerConfigPoolMaxSize !== undefined) {
      customVariable['sdk.config.trackingManager.poolMaxSize'] = `${this.sdkConfigTrackingManagerConfigPoolMaxSize}`
    }
    if (this.sdkConfigFetchNow !== undefined) {
      customVariable['sdk.config.fetchNow'] = `${this.sdkConfigFetchNow}`
    }
    if (this.sdkConfigEnableClientCache !== undefined) {
      customVariable['sdk.config.enableClientCache'] = `${this.sdkConfigEnableClientCache}`
    }
    if (this.sdkConfigInitialBucketing !== undefined) {
      customVariable['sdk.config.initialBucketing'] = JSON.stringify(this.sdkConfigInitialBucketing)
    }
    if (this.sdkConfigDecisionApiUrl !== undefined) {
      customVariable['sdk.config.decisionApiUrl'] = `${this.sdkConfigDecisionApiUrl}`
    }
    if (this.sdkConfigHitDeduplicationTime !== undefined) {
      customVariable['sdk.config.hitDeduplicationTime'] = `${this.sdkConfigHitDeduplicationTime}`
    }
    if (this.sdkConfigUsingCustomHitCache !== undefined) {
      customVariable['sdk.config.usingCustomHitCache'] = JSON.stringify(this.sdkConfigUsingCustomHitCache)
    }
    if (this.sdkConfigUsingCustomVisitorCache !== undefined) {
      customVariable['sdk.config.usingCustomVisitorCache'] = JSON.stringify(this.sdkConfigUsingCustomVisitorCache)
    }
    if (this.sdkConfigUsingOnVisitorExposed !== undefined) {
      customVariable['sdk.config.usingOnVisitorExposed'] = JSON.stringify(this.sdkConfigUsingOnVisitorExposed)
    }
    if (this.sdkConfigFetchThirdPartyData !== undefined) {
      customVariable['sdk.config.fetchThirdPartyData'] = JSON.stringify(this.sdkConfigFetchThirdPartyData)
    }
    if (this.sdkConfigFetchFlagsBufferingTime !== undefined) {
      customVariable['sdk.config.fetchFlagsBufferingTime'] = JSON.stringify(this.sdkConfigFetchFlagsBufferingTime)
    }
    if (this.sdkConfigNextFetchConfig !== undefined) {
      customVariable['sdk.config.nextFetchConfig'] = JSON.stringify(this.sdkConfigNextFetchConfig)
    }
    if (this.sdkConfigDisableDeveloperUsageTracking !== undefined) {
      customVariable['sdk.config.disableDeveloperUsageTracking'] = JSON.stringify(this.sdkConfigDisableDeveloperUsageTracking)
    }
    if (this.sdkConfigDisableCache !== undefined) {
      customVariable['sdk.config.disableCache'] = JSON.stringify(this.sdkConfigDisableCache)
    }
    if (this.httpRequestUrl !== undefined) {
      customVariable['http.request.url'] = `${this.httpRequestUrl}`
    }
    if (this.httpRequestMethod !== undefined) {
      customVariable['http.request.method'] = `${this.httpRequestMethod}`
    }
    if (this.httpRequestHeaders !== undefined) {
      customVariable['http.request.headers'] = JSON.stringify(this.httpRequestHeaders)
    }
    if (this.httpRequestBody !== undefined) {
      customVariable['http.request.body'] = JSON.stringify(this.httpRequestBody)
    }
    if (this.httpResponseUrl !== undefined) {
      customVariable['http.response.url'] = `${this.httpResponseUrl}`
    }
    if (this.httpResponseMethod !== undefined) {
      customVariable['http.response.method'] = `${this.httpResponseMethod}`
    }
    if (this.httpResponseHeaders !== undefined) {
      customVariable['http.response.headers'] = JSON.stringify(this.httpResponseHeaders)
    }
    if (this.httpResponseCode !== undefined) {
      customVariable['http.response.code'] = `${this.httpResponseCode}`
    }
    if (this.httpResponseBody !== undefined) {
      customVariable['http.response.body'] = JSON.stringify(this.httpResponseBody)
    }
    if (this.httpResponseTime !== undefined) {
      customVariable['http.response.time'] = `${this.httpResponseTime}`
    }

    if (this.visitorId !== undefined) {
      customVariable['visitor.visitorId'] = `${this.visitorId}`
    }

    if (this.anonymousId !== undefined) {
      customVariable['visitor.anonymousId'] = `${this.anonymousId}`
    }

    if (this.visitorSessionId !== undefined) {
      customVariable['visitor.sessionId'] = `${this.visitorSessionId}`
    }
    if (this.visitorStatus !== undefined) {
      customVariable['visitor.status'] = `${this.visitorStatus}`
    }
    if (this.visitorInstanceType !== undefined) {
      customVariable['visitor.instanceType'] = `${this.visitorInstanceType}`
    }
    if (this.visitorContext !== undefined) {
      for (const key in this.visitorContext) {
        const element = this.visitorContext[key]
        customVariable[`visitor.context.${key}`] = `${element}`
      }
    }
    if (this.visitorConsent !== undefined) {
      customVariable['visitor.consent'] = `${this.visitorConsent}`
    }
    if (this.visitorAssignmentHistory !== undefined) {
      for (const key in this.visitorAssignmentHistory) {
        const element = this.visitorAssignmentHistory[key]
        customVariable[`visitor.assignments.[${key}]`] = element
      }
    }
    if (this.visitorFlags !== undefined) {
      this.visitorFlags.forEach((item, flagKey) => {
        for (const itemKey in item) {
          const itemValue = item[itemKey as keyof typeof item]
          const hasMetadataKey = itemKey === 'value' || itemKey === 'key'
          const value = typeof itemValue === 'string' ? itemValue : JSON.stringify(itemValue)
          customVariable[`visitor.flags.[${flagKey}]${hasMetadataKey ? '' : '.metadata'}.${itemKey}`] = value
        }
      })
    }

    if (this.visitorIsAuthenticated !== undefined) {
      customVariable['visitor.isAuthenticated'] = `${this.visitorIsAuthenticated}`
    }

    if (this.visitorInitialCampaigns !== undefined) {
      customVariable['visitor.initialCampaigns'] = JSON.stringify(this.visitorInitialCampaigns)
    }

    if (this.visitorInitialFlagsData !== undefined) {
      customVariable['visitor.initialFlagsData'] = JSON.stringify(Array.isArray(this.visitorInitialFlagsData) ? this.visitorInitialFlagsData : Array.from(this.visitorInitialFlagsData))
    }

    if (this.visitorCampaigns !== undefined) {
      customVariable['visitor.campaigns'] = JSON.stringify(this.visitorCampaigns)
    }

    if (this.visitorCampaignFromCache !== undefined) {
      customVariable['visitor.campaignFromCache'] = JSON.stringify(this.visitorCampaignFromCache)
    }

    if (this.contextKey !== undefined) {
      customVariable.contextKey = `${this.contextKey}`
    }

    if (this.contextValue !== undefined) {
      customVariable.contextValue = `${this.contextValue}`
    }

    if (this.flagKey !== undefined) {
      customVariable['flag.key'] = `${this.flagKey}`
    }
    if (this.flagValue !== undefined) {
      customVariable['flag.value'] = `${this.flagValue}`
    }
    if (this.flagDefault !== undefined) {
      customVariable['flag.default'] = JSON.stringify(this.flagDefault)
    }
    if (this.flagMetadataCampaignId !== undefined) {
      customVariable['flag.metadata.campaignId'] = `${this.flagMetadataCampaignId}`
    }
    if (this.flagMetadataCampaignName !== undefined) {
      customVariable['flag.metadata.campaignName'] = `${this.flagMetadataCampaignName}`
    }
    if (this.flagMetadataVariationGroupId !== undefined) {
      customVariable['flag.metadata.variationGroupId'] = `${this.flagMetadataVariationGroupId}`
    }
    if (this.flagMetadataVariationGroupName !== undefined) {
      customVariable['flag.metadata.variationGroupName'] = `${this.flagMetadataVariationGroupName}`
    }
    if (this.flagMetadataVariationId !== undefined) {
      customVariable['flag.metadata.variationId'] = `${this.flagMetadataVariationId}`
    }
    if (this.flagMetadataVariationName !== undefined) {
      customVariable['flag.metadata.variationName'] = `${this.flagMetadataVariationName}`
    }
    if (this.flagMetadataCampaignSlug !== undefined) {
      customVariable['flag.metadata.campaignSlug'] = `${this.flagMetadataCampaignSlug}`
    }
    if (this.flagMetadataCampaignType !== undefined) {
      customVariable['flag.metadata.campaignType'] = `${this.flagMetadataCampaignType}`
    }
    if (this.flagMetadataCampaignIsReference !== undefined) {
      customVariable['flag.metadata.isReference'] = `${this.flagMetadataCampaignIsReference}`
    }

    if (this.hitContent !== undefined) {
      for (const key in this.hitContent) {
        const element = this.hitContent[key]
        customVariable[`hit.${key}`] = typeof element === 'string' ? element : JSON.stringify(element)
      }
    }
    if (this.batchTriggeredBy !== undefined) {
      customVariable.batchTriggeredBy = `${BatchTriggeredBy[this.batchTriggeredBy]}`
    }

    apiKeys.cv = customVariable
    return apiKeys
  }

  public isReady (checkParent = true): boolean {
    return !!((!checkParent || super.isReady()))
  }

  public getErrorMessage (): string {
    return ERROR_MESSAGE
  }
}
