import { IFlagshipConfig } from '../config/index'
import { LogLevel } from '../enum/index'
import {
  CUSTOMER_ENV_ID_API_ITEM,
  DS_API_ITEM,
  SDK_APP,
  SDK_INFO,
  T_API_ITEM,
  VISITOR_ID_API_ITEM
} from '../enum/FlagshipConstant'
import { HitAbstract, IHitAbstract } from './HitAbstract'
import { BucketingDTO } from '../decision/api/bucketingDTO'
import { FlagDTO, primitive } from '../types'
import { CampaignDTO } from '../mod'

export const ERROR_MESSAGE = 'event category and event action are required'

export interface IMonitoring extends IHitAbstract{
    logVersion?: string
    logLevel: LogLevel
    accountId?:string
    envId?:string
    timestamp?:string
    component?: string
    subComponent: string
    message: string
    flagshipInstanceId?: string

    stackType?: string
    stackName?: string
    stackVersion?: string
    stackOriginName?: string
    stackOriginVersion?: string

    sdkStatus?: string
    sdkConfigMode?: string
    sdkConfigCustomLogManager?: boolean
    sdkConfigCustomCacheManager?: boolean
    sdkConfigStatusListener?: boolean
    sdkConfigTimeout?: string
    sdkConfigPollingInterval?: string
    sdkConfigFetchNow?: boolean
    sdkConfigEnableClientCache?: boolean
    sdkConfigInitialBucketing?:BucketingDTO
    sdkConfigDecisionApiUrl?: string
    sdkConfigHitDeduplicationTime?: string
    sdkConfigTrackingManagerConfigStrategy?: string
    sdkConfigTrackingManagerConfigBatchIntervals?: string
    sdkConfigTrackingManagerConfigPoolMaxSize?: string

    httpInstanceId?: string
    httpRequestUrl?:string
    httpRequestMethod?:string
    httpRequestHeaders?:Record<string, unknown>
    httpRequestBody?:unknown
    httpRequestDetails?:string

    httpResponseUrl?:string
    httpResponseMethod?: string
    httpResponseHeaders?: Record<string, unknown>
    httpResponseCode?: number
    httpResponseBody?: unknown
    httpResponseTime?:number
    httpResponseDetails?: string

    visitorStatus?: string
    visitorInstanceType?: string
    visitorContext?: Record<string, primitive>
    visitorConsent?: boolean
    visitorAssignmentHistory?: string
    visitorFlags?: string
    visitorCampaigns?: CampaignDTO[] | null
    visitorCachedCampaigns?: CampaignDTO[] | null
    visitorIsAuthenticated?:boolean
    visitorInitialCampaigns?:CampaignDTO[]
    visitorInitialFlagsData? : Map<string, FlagDTO>|FlagDTO[]

    flagKey?: string
    flagValue?: string
    flagDefault?: unknown

    flagMetadataCampaignId?:string
    flagMetadataVariationGroupId?: string
    flagMetadataVariationId?: string
    flagMetadataCampaignSlug?: string
    flagMetadataCampaignType?: string

    hitContent?: Record<string, unknown>

  }

export class Monitoring extends HitAbstract implements IMonitoring {
  private _logVersion? : string
  private _logLevel! : LogLevel
  private _accountId? : string
  private _envId? : string
  private _timestamp? : string
  private _component? : string
  private _subComponent! : string
  private _message! : string
  private _stackType? : string
  private _stackName? : string
  private _stackVersion? : string
  private _stackOriginName? : string
  private _stackOriginVersion? : string
  private _sdkStatus? : string
  private _sdkConfigMode? : string
  private _sdkConfigCustomLogManager? : boolean
  private _sdkConfigCustomCacheManager? : boolean
  private _sdkConfigStatusListener? : boolean
  private _sdkConfigTimeout? : string
  private _sdkConfigPollingTime? : string
  private _sdkConfigTrackingManagerConfigStrategy? : string
  private _sdkConfigTrackingManagerConfigBatchIntervals? : string
  private _sdkConfigTrackingManagerConfigBatchLength? : string
  private _httpRequestUrl? : string
  private _httpRequestMethod? : string
  private _httpRequestHeaders? : Record<string, unknown>
  private _httpRequestBody? : unknown
  private _httpRequestDetails? : string
  private _httpResponseUrl? : string
  private _httpResponseMethod? : string
  private _httpResponseHeaders? : Record<string, unknown>
  private _httpResponseBody? : unknown
  private _httpResponseDetails? : string
  private _visitorStatus? : string
  private _visitorInstanceType? : string
  private _visitorContext? : Record<string, primitive>
  private _visitorConsent? : boolean
  private _visitorAssignmentHistory? : string
  private _visitorFlags? : string
  private _visitorIsAuthenticated? : boolean
  private _flagKey? : string
  private _flagValue? : string
  private _flagDefault? : unknown
  private _flagMetadataCampaignId? : string
  private _flagMetadataVariationGroupId? : string
  private _flagMetadataVariationId? : string
  private _flagMetadataCampaignSlug? : string
  private _flagMetadataCampaignType? : string
  private _sdkConfigFetchNow? : boolean
  private _sdkConfigEnableClientCache? : boolean
  private _sdkConfigInitialBucketing? : BucketingDTO
  private _sdkConfigDecisionApiUrl? : string
  private _sdkConfigHitDeduplicationTime? : string
  private _flagshipInstanceId? : string
  private _visitorInitialCampaigns? : CampaignDTO[]
  private _visitorInitialFlagsData? : Map<string, FlagDTO>|FlagDTO[]
  private _visitorCampaign : CampaignDTO[]|null|undefined
  private _httRequestTime? : number
  private _hitContent? : Record<string, unknown>|undefined
  private _httpInstanceId : string|undefined

  public get httpInstanceId () : string|undefined {
    return this._httpInstanceId
  }

  public set httpInstanceId (v : string|undefined) {
    this._httpInstanceId = v
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

  public get flagshipInstanceId () : string|undefined {
    return this._flagshipInstanceId
  }

  public set flagshipInstanceId (v : string|undefined) {
    this._flagshipInstanceId = v
  }

  public get sdkConfigHitDeduplicationTime () : string|undefined {
    return this._sdkConfigHitDeduplicationTime
  }

  public set sdkConfigHitDeduplicationTime (v : string|undefined) {
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

  public set flagMetadataCampaignType (v : string|undefined) {
    this._flagMetadataCampaignType = v
  }

  public get flagMetadataCampaignSlug () : string|undefined {
    return this._flagMetadataCampaignSlug
  }

  public set flagMetadataCampaignSlug (v : string|undefined) {
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

  public get visitorFlags () : string|undefined {
    return this._visitorFlags
  }

  public set visitorFlags (v : string|undefined) {
    this._visitorFlags = v
  }

  public get visitorAssignmentHistory () : string|undefined {
    return this._visitorAssignmentHistory
  }

  public set visitorAssignmentHistory (v : string|undefined) {
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

  public get httpResponseDetails () : string|undefined {
    return this._httpResponseDetails
  }

  public set httpResponseDetails (v : string|undefined) {
    this._httpResponseDetails = v
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

  public get httpRequestDetails () : string|undefined {
    return this._httpRequestDetails
  }

  public set httpRequestDetails (v : string|undefined) {
    this._httpRequestDetails = v
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

  public get sdkConfigTrackingManagerConfigPoolMaxSize () : string|undefined {
    return this._sdkConfigTrackingManagerConfigBatchLength
  }

  public set sdkConfigTrackingManagerConfigPoolMaxSize (v : string|undefined) {
    this._sdkConfigTrackingManagerConfigBatchLength = v
  }

  public get sdkConfigTrackingManagerConfigBatchIntervals () : string|undefined {
    return this._sdkConfigTrackingManagerConfigBatchIntervals
  }

  public set sdkConfigTrackingManagerConfigBatchIntervals (v : string|undefined) {
    this._sdkConfigTrackingManagerConfigBatchIntervals = v
  }

  public get sdkConfigTrackingManagerConfigStrategy () : string|undefined {
    return this._sdkConfigTrackingManagerConfigStrategy
  }

  public set sdkConfigTrackingManagerConfigStrategy (v : string|undefined) {
    this._sdkConfigTrackingManagerConfigStrategy = v
  }

  public get sdkConfigPollingInterval () : string|undefined {
    return this._sdkConfigPollingTime
  }

  public set sdkConfigPollingInterval (v : string|undefined) {
    this._sdkConfigPollingTime = v
  }

  public get sdkConfigTimeout () : string|undefined {
    return this._sdkConfigTimeout
  }

  public set sdkConfigTimeout (v : string|undefined) {
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

  public get sdkStatus () : string|undefined {
    return this._sdkStatus
  }

  public set sdkStatus (v : string|undefined) {
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

  public get message () : string {
    return this._message
  }

  public set message (v : string) {
    this._message = v
  }

  public get subComponent () : string {
    return this._subComponent
  }

  public set subComponent (v : string) {
    this._subComponent = v
  }

  public get component () : string|undefined {
    return this._component
  }

  public set component (v : string|undefined) {
    this._component = v
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

  public get logVersion () : string|undefined {
    return this._logVersion
  }

  public set logVersion (v : string|undefined) {
    this._logVersion = v
  }

  public constructor (param:Omit<IMonitoring & {config: IFlagshipConfig},
        'createdAt'|'category'>) {
    super({
      type: param.type,
      userIp: param.userIp,
      screenResolution: param.screenResolution,
      locale: param.locale,
      sessionNumber: param.sessionNumber,
      visitorId: param.visitorId,
      anonymousId: param.anonymousId
    })
    const {
      logVersion, logLevel, accountId, envId, timestamp, component, subComponent, message, stackType,
      stackName, stackVersion, stackOriginName, stackOriginVersion, sdkStatus, sdkConfigMode, sdkConfigCustomLogManager,
      sdkConfigCustomCacheManager, sdkConfigStatusListener, sdkConfigTimeout, sdkConfigPollingInterval, sdkConfigTrackingManagerConfigStrategy, sdkConfigTrackingManagerConfigBatchIntervals,
      sdkConfigTrackingManagerConfigPoolMaxSize, httpRequestUrl, httpRequestMethod,
      httpRequestHeaders, httpRequestBody, httpRequestDetails, httpResponseTime,
      httpResponseUrl, httpResponseMethod, httpResponseHeaders, httpResponseCode, httpResponseBody, httpResponseDetails, visitorStatus, visitorInstanceType, visitorContext,
      visitorConsent, visitorAssignmentHistory, visitorFlags, visitorIsAuthenticated, config, flagKey, flagValue, flagDefault,
      flagMetadataCampaignId, flagMetadataVariationGroupId, flagMetadataVariationId, flagMetadataCampaignSlug, flagMetadataCampaignType, sdkConfigFetchNow, sdkConfigEnableClientCache,
      sdkConfigInitialBucketing, sdkConfigDecisionApiUrl, sdkConfigHitDeduplicationTime, flagshipInstanceId, hitContent, visitorInstanceId, traffic, httpInstanceId
    } = param
    this.traffic = traffic
    this.config = config
    this.logVersion = logVersion || '1'
    this.logLevel = logLevel
    this.flagshipInstanceId = flagshipInstanceId
    this.accountId = accountId
    this.envId = envId || config.envId
    this.timestamp = timestamp || new Date(Date.now()).toISOString()
    this.component = component || `Flagship SDK ${SDK_INFO.name}`
    this.subComponent = subComponent
    this.message = message
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
    this.httpInstanceId = httpInstanceId
    this.httpRequestUrl = httpRequestUrl
    this.httpRequestMethod = httpRequestMethod
    this.httpRequestHeaders = httpRequestHeaders
    this.httpRequestBody = httpRequestBody
    this.httpRequestDetails = httpRequestDetails
    this.httpResponseUrl = httpResponseUrl
    this.httpResponseMethod = httpResponseMethod
    this.httpResponseHeaders = httpResponseHeaders
    this.httpResponseCode = httpResponseCode
    this.httpResponseBody = httpResponseBody
    this.httpResponseDetails = httpResponseDetails
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
    this.visitorInstanceId = visitorInstanceId
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
    const customVariable:Record<string, string> = {
      logVersion: `${this.logVersion}`,
      LogLevel: `${LogLevel[this.logLevel]}`,
      timestamp: `${this.timestamp}`,
      component: `${this.component}`,
      subComponents: `${this.subComponent}`,
      message: `${this.message}`,
      'stack.type': `${this.stackType}`,
      'stack.name': `${this.stackName}`,
      'stack.version': `${this.stackVersion}`
    }

    if (this.flagshipInstanceId !== undefined) {
      customVariable.flagshipInstanceId = this.flagshipInstanceId
    }

    if (this.accountId) {
      customVariable.accountId = `${this.accountId}`
    }

    if (this.envId) {
      customVariable.envId = `${this.envId}`
    }

    if (this.visitorInstanceId !== undefined) {
      customVariable['visitor.instanceId'] = this.visitorInstanceId
    }
    if (this.stackOriginName !== undefined) {
      customVariable['stack.origin.name'] = `${this.stackOriginName}`
    }
    if (this.stackOriginVersion !== undefined) {
      customVariable['stack.origin.version'] = `${this.stackOriginVersion}`
    }
    if (this.sdkStatus !== undefined) {
      customVariable['sdk.status'] = `${this.sdkStatus}`
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
      customVariable['sdk.config.trackingManager.config.strategy'] = `${this.sdkConfigTrackingManagerConfigStrategy}`
    }
    if (this.sdkConfigTrackingManagerConfigBatchIntervals !== undefined) {
      customVariable['sdk.config.trackingManager.config.batchIntervals'] = `${this.sdkConfigTrackingManagerConfigBatchIntervals}`
    }
    if (this.sdkConfigTrackingManagerConfigPoolMaxSize !== undefined) {
      customVariable['sdk.config.trackingManager.config.poolMaxSize'] = `${this.sdkConfigTrackingManagerConfigPoolMaxSize}`
    }
    if (this.sdkConfigFetchNow !== undefined) {
      customVariable['sdk.config.trackingManager.config.fetchNow'] = `${this.sdkConfigFetchNow}`
    }
    if (this.sdkConfigEnableClientCache !== undefined) {
      customVariable['sdk.config.trackingManager.config.enableClientCache'] = `${this.sdkConfigEnableClientCache}`
    }
    if (this.sdkConfigInitialBucketing !== undefined) {
      customVariable['sdk.config.trackingManager.config.initialBucketing'] = JSON.stringify(this.sdkConfigInitialBucketing)
    }
    if (this.sdkConfigDecisionApiUrl !== undefined) {
      customVariable['sdk.config.trackingManager.config.decisionApiUrl'] = `${this.sdkConfigDecisionApiUrl}`
    }
    if (this.sdkConfigHitDeduplicationTime !== undefined) {
      customVariable['sdk.config.trackingManager.config.deduplicationTime'] = `${this.sdkConfigHitDeduplicationTime}`
    }

    if (this.httpInstanceId) {
      customVariable['http.instanceId'] = this.httpInstanceId
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
    if (this.httpRequestDetails !== undefined) {
      customVariable['http.request.details'] = `${this.httpRequestDetails}`
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
    if (this.httpResponseDetails !== undefined) {
      customVariable['http.response.details'] = `${this.httpResponseDetails}`
    }
    if (this.httpResponseTime !== undefined) {
      customVariable['http.response.time'] = `${this.httpResponseTime}`
    }
    if (this.visitorStatus !== undefined) {
      customVariable['visitor.status'] = `${this.visitorStatus}`
    }
    if (this.visitorInstanceType !== undefined) {
      customVariable['visitor.instanceType'] = `${this.visitorInstanceType}`
    }
    if (this.visitorContext !== undefined) {
      customVariable['visitor.context'] = JSON.stringify(this.visitorContext)
    }
    if (this.visitorConsent !== undefined) {
      customVariable['visitor.consent'] = `${this.visitorConsent}`
    }
    if (this.visitorAssignmentHistory !== undefined) {
      customVariable['visitor.assignmentsHistory'] = `${this.visitorAssignmentHistory}`
    }
    if (this.visitorFlags !== undefined) {
      customVariable['visitor.flags'] = `${this.visitorFlags}`
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

    if (this.flagKey !== undefined) {
      customVariable['flag.key'] = `${this.flagKey}`
    }
    if (this.flagValue !== undefined) {
      customVariable['flag.value'] = `${this.flagValue}`
    }
    if (this.flagDefault !== undefined) {
      customVariable['flag.default'] = `${this.flagDefault}`
    }
    if (this.flagMetadataCampaignId !== undefined) {
      customVariable['flag.metadata.campaignId'] = `${this.flagMetadataCampaignId}`
    }
    if (this.flagMetadataVariationGroupId !== undefined) {
      customVariable['flag.metadata.variationGroupId'] = `${this.flagMetadataVariationGroupId}`
    }
    if (this.flagMetadataVariationId !== undefined) {
      customVariable['flag.metadata.variationId'] = `${this.flagMetadataVariationId}`
    }
    if (this.flagMetadataCampaignSlug !== undefined) {
      customVariable['flag.metadata.campaignSlug'] = `${this.flagMetadataCampaignSlug}`
    }
    if (this.flagMetadataCampaignType !== undefined) {
      customVariable['flag.metadata.campaignType'] = `${this.flagMetadataCampaignType}`
    }
    if (this.hitContent !== undefined) {
      customVariable['hit.content'] = JSON.stringify(this.hitContent)
    }

    apiKeys.cv = customVariable
    return apiKeys
  }

  public toObject ():Record<string, unknown> {
    return {
      ...super.toObject(),
      logVersion: this.logVersion,
      logLevel: this.logLevel,
      accountId: this.accountId,
      envId: this.envId,
      timestamp: this.timestamp,
      component: this.component,
      subComponent: this.subComponent,
      message: this.message,
      stackType: this.stackType,
      stackName: this.stackName,
      stackVersion: this.stackVersion,
      stackOriginName: this.stackOriginName,
      stackOriginVersion: this.stackOriginVersion,

      sdkStatus: this.sdkStatus,
      sdkConfigMode: this.sdkConfigMode,
      sdkConfigCustomLogManager: this.sdkConfigCustomLogManager,
      sdkConfigCustomCacheManager: this.sdkConfigCustomCacheManager,
      sdkConfigStatusListener: this.sdkConfigStatusListener,
      sdkConfigTimeout: this.sdkConfigTimeout,
      sdkConfigPollingTime: this.sdkConfigPollingInterval,
      sdkConfigTrackingManagerConfigStrategy: this.sdkConfigTrackingManagerConfigStrategy,
      sdkConfigTrackingManagerConfigBatchIntervals: this.sdkConfigTrackingManagerConfigBatchIntervals,
      sdkConfigTrackingManagerConfigBatchLength: this.sdkConfigTrackingManagerConfigPoolMaxSize,

      httpRequestUrl: this.httpRequestUrl,
      httpRequestMethod: this.httpRequestMethod,
      httpRequestHeaders: this.httpRequestHeaders,
      httpRequestBody: this.httpRequestBody,
      httpRequestDetails: this.httpRequestDetails,

      httpResponseUrl: this.httpResponseUrl,
      httpResponseMethod: this.httpResponseMethod,
      httpResponseHeaders: this.httpResponseHeaders,
      httpResponseCode: this.httpResponseCode,
      httpResponseBody: this.httpResponseBody,
      httpResponseDetails: this.httpResponseDetails,

      visitorStatus: this.visitorStatus,
      visitorInstanceType: this.visitorInstanceType,
      visitorContext: this.visitorContext,
      visitorConsent: this.visitorConsent,
      visitorAssignmentHistory: this.visitorAssignmentHistory,
      visitorFlags: this.visitorFlags,
      visitorIsAuthenticated: this.visitorIsAuthenticated,

      flagKey: this.flagKey,
      flagValue: this.flagValue,
      flagDefault: this.flagDefault,
      flagMetadataCampaignId: this.flagMetadataCampaignId,
      flagMetadataVariationGroupId: this.flagMetadataVariationGroupId,
      flagMetadataVariationId: this.flagMetadataVariationId,
      flagMetadataCampaignSlug: this.flagMetadataCampaignSlug,
      flagMetadataCampaignType: this.flagMetadataCampaignType
    }
  }

  public isReady (checkParent = true): boolean {
    return !!((!checkParent || super.isReady()))
  }

  public getErrorMessage (): string {
    return ERROR_MESSAGE
  }
}
