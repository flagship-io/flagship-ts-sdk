import { IFlagshipConfig } from '../config/index'
import { LogLevel } from '../enum/index'
import {
  EVENT_ACTION_API_ITEM,
  EVENT_CATEGORY_API_ITEM,
  SDK_APP,
  SDK_INFO
} from '../enum/FlagshipConstant'
import { HitAbstract, IHitAbstract } from './HitAbstract'
import { BucketingDTO } from '../decision/api/bucketingDTO'

export const ERROR_MESSAGE = 'event category and event action are required'
export const CATEGORY_ERROR =
    'The category value must be either EventCategory::ACTION_TRACKING or EventCategory::ACTION_TRACKING'
export const VALUE_FIELD_ERROR = 'value must be an integer and be >= 0'
export enum EventCategory {
    ACTION_TRACKING = 'Action Tracking',
    USER_ENGAGEMENT = 'User Engagement',
  }

export interface IMonitoring extends IHitAbstract{
    category: EventCategory
    action: string
    logVersion?: string
    logLevel: LogLevel
    accountId?:string
    envId?:string
    timestamp?:string
    component?: string
    subComponent: string
    message: string

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

    httpRequestUrl?:string
    httpRequestMethod?:string
    httpRequestHeaders?: string
    httpRequestBody?:string
    httpRequestDetails?:string

    httpResponseUrl?:string
    httpResponseMethod?: string
    httpResponseHeaders?: string
    httpResponseCode?: string
    httpResponseBody?: string
    httpResponseDetails?: string

    visitorStatus?: string
    visitorInstanceType?: string
    visitorContext?: string
    visitorConsent?: boolean
    visitorAssignmentHistory?: string
    visitorFlags?: string
    visitorIsAuthenticated?:boolean

    flagKey?: string
    flagValue?: string
    flagDefault?: string

    flagMetadataCampaignId?:string
    flagMetadataVariationGroupId?: string
    flagMetadataVariationId?: string
    flagMetadataCampaignSlug?: string
    flagMetadataCampaignType?: string

  }

export class Monitoring extends HitAbstract implements IMonitoring {
  private _category: EventCategory
  private _action!: string

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
  private _httpRequestHeaders? : string
  private _httpRequestBody? : string
  private _httpRequestDetails? : string
  private _httpResponseUrl? : string
  private _httpResponseMethod? : string
  private _httpResponseHeaders? : string
  private _httpResponseBody? : string
  private _httpResponseDetails? : string
  private _visitorStatus? : string
  private _visitorInstanceType? : string
  private _visitorContext? : string
  private _visitorConsent? : boolean
  private _visitorAssignmentHistory? : string
  private _visitorFlags? : string
  private _visitorIsAuthenticated? : boolean
  private _flagKey? : string
  private _flagValue? : string
  private _flagDefault? : string
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

  public get flagDefault () : string|undefined {
    return this._flagDefault
  }

  public set flagDefault (v : string|undefined) {
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

  public get visitorContext () : string|undefined {
    return this._visitorContext
  }

  public set visitorContext (v : string|undefined) {
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

  public get httpResponseBody () : string|undefined {
    return this._httpResponseBody
  }

  public set httpResponseBody (v : string|undefined) {
    this._httpResponseBody = v
  }

  private _httpResponseCode? : string
  public get httpResponseCode () : string|undefined {
    return this._httpResponseCode
  }

  public set httpResponseCode (v : string|undefined) {
    this._httpResponseCode = v
  }

  public get httpResponseHeaders () : string|undefined {
    return this._httpResponseHeaders
  }

  public set httpResponseHeaders (v : string|undefined) {
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

  public get httpRequestBody () : string|undefined {
    return this._httpRequestBody
  }

  public set httpRequestBody (v : string|undefined) {
    this._httpRequestBody = v
  }

  public get httpRequestHeaders () : string|undefined {
    return this._httpRequestHeaders
  }

  public set httpRequestHeaders (v : string|undefined) {
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

  public get category (): EventCategory {
    return this._category
  }

  public get action (): string {
    return this._action
  }

  /**
     * Specify Event name that will also serve as the KPI
     * that you will have inside your reporting
     */
  public set action (v: string) {
    if (!this.isNotEmptyString(v, 'action')) {
      return
    }
    this._action = v
  }

  public constructor (param:Omit<IMonitoring & {config: IFlagshipConfig},
        'type'|'createdAt'|'category'|'visitorId'>) {
    super({
      type: 'MONITORING',
      userIp: param.userIp,
      screenResolution: param.screenResolution,
      locale: param.locale,
      sessionNumber: param.sessionNumber,
      visitorId: '',
      anonymousId: param.anonymousId
    })
    const {
      action, logVersion, logLevel, accountId, envId, timestamp, component, subComponent, message, stackType,
      stackName, stackVersion, stackOriginName, stackOriginVersion, sdkStatus, sdkConfigMode, sdkConfigCustomLogManager,
      sdkConfigCustomCacheManager, sdkConfigStatusListener, sdkConfigTimeout, sdkConfigPollingInterval: sdkConfigPollingTime, sdkConfigTrackingManagerConfigStrategy, sdkConfigTrackingManagerConfigBatchIntervals,
      sdkConfigTrackingManagerConfigPoolMaxSize: sdkConfigTrackingManagerConfigBatchLength, httpRequestUrl: httRequestUrl, httpRequestMethod: httRequestMethod, httpRequestHeaders, httpRequestBody, httpRequestDetails,
      httpResponseUrl, httpResponseMethod, httpResponseHeaders, httpResponseCode, httpResponseBody, httpResponseDetails, visitorStatus, visitorInstanceType, visitorContext,
      visitorConsent, visitorAssignmentHistory, visitorFlags, visitorIsAuthenticated, config, flagKey, flagValue, flagDefault,
      flagMetadataCampaignId, flagMetadataVariationGroupId, flagMetadataVariationId, flagMetadataCampaignSlug, flagMetadataCampaignType, sdkConfigFetchNow, sdkConfigEnableClientCache,
      sdkConfigInitialBucketing, sdkConfigDecisionApiUrl, sdkConfigHitDeduplicationTime
    } = param
    this.config = config
    this._category = 'monitoring' as EventCategory
    this.action = action
    this.logVersion = logVersion || '1'
    this.logLevel = logLevel
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
    this.sdkConfigPollingInterval = sdkConfigPollingTime
    this.sdkConfigTrackingManagerConfigStrategy = sdkConfigTrackingManagerConfigStrategy
    this.sdkConfigTrackingManagerConfigBatchIntervals = sdkConfigTrackingManagerConfigBatchIntervals
    this.sdkConfigTrackingManagerConfigPoolMaxSize = sdkConfigTrackingManagerConfigBatchLength
    this.sdkConfigFetchNow = sdkConfigFetchNow
    this.sdkConfigEnableClientCache = sdkConfigEnableClientCache
    this.sdkConfigInitialBucketing = sdkConfigInitialBucketing
    this.sdkConfigDecisionApiUrl = sdkConfigDecisionApiUrl
    this.sdkConfigHitDeduplicationTime = sdkConfigHitDeduplicationTime
    this.httpRequestUrl = httRequestUrl
    this.httpRequestMethod = httRequestMethod
    this.httpRequestHeaders = httpRequestHeaders
    this.httpRequestBody = httpRequestBody
    this.httpRequestDetails = httpRequestDetails
    this.httpResponseUrl = httpResponseUrl
    this.httpResponseMethod = httpResponseMethod
    this.httpResponseHeaders = httpResponseHeaders
    this.httpResponseCode = httpResponseCode
    this.httpResponseBody = httpResponseBody
    this.httpResponseDetails = httpResponseDetails
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
    this.ds = SDK_APP
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, complexity
  public toApiKeys (): any {
    const apiKeys = super.toApiKeys()
    apiKeys[EVENT_CATEGORY_API_ITEM] = this.category
    apiKeys[EVENT_ACTION_API_ITEM] = this.action
    const customVariable:Record<number, string> = {
      0: `logVersion, ${this.logVersion}`,
      1: `LogLevel, ${LogLevel[this.logLevel]}`,
      4: `timestamp, ${this.timestamp}`,
      5: `component, ${this.component}`,
      6: `subComponents, ${this.subComponent}`,
      7: `message, ${this.message}`,
      20: `stack.type, ${this.stackType} `,
      21: `stack.name, ${this.stackName}`,
      22: `stack.version, ${this.stackVersion}`
    }

    if (this.accountId) {
      customVariable[2] = `accountId, ${this.accountId}`
    }

    if (this.envId) {
      customVariable[3] = `envId, ${this.envId}`
    }

    if (this.stackOriginName) {
      customVariable[23] = `stack.origin.name, ${this.stackOriginName}`
    }
    if (this.stackOriginVersion) {
      customVariable[24] = `stack.origin.version, ${this.stackOriginVersion}`
    }
    if (this.sdkStatus) {
      customVariable[30] = `sdk.status, ${this.sdkStatus}`
    }
    if (this.sdkConfigMode) {
      customVariable[31] = `sdk.config.mode, ${this.sdkConfigMode}`
    }
    if (this.sdkConfigCustomLogManager !== undefined) {
      customVariable[32] = `sdk.config.customLogManager, ${this.sdkConfigCustomLogManager}`
    }
    if (this.sdkConfigCustomCacheManager !== undefined) {
      customVariable[33] = `sdk.config.customCacheManager, ${this.sdkConfigCustomCacheManager}`
    }
    if (this.sdkConfigStatusListener !== undefined) {
      customVariable[34] = `sdk.config.custom.StatusListener, ${this.sdkConfigStatusListener}`
    }
    if (this.sdkConfigTimeout !== undefined) {
      customVariable[35] = `sdk.config.timeout, ${this.sdkConfigTimeout}`
    }
    if (this.sdkConfigPollingInterval !== undefined) {
      customVariable[36] = `sdk.config.pollingTime, ${this.sdkConfigPollingInterval}`
    }
    if (this.sdkConfigTrackingManagerConfigStrategy) {
      customVariable[37] = `sdk.config.trackingManager.config.strategy, ${this.sdkConfigTrackingManagerConfigStrategy}`
    }
    if (this.sdkConfigTrackingManagerConfigBatchIntervals !== undefined) {
      customVariable[38] = `sdk.config.trackingManager.config.batchIntervals, ${this.sdkConfigTrackingManagerConfigBatchIntervals}`
    }
    if (this.sdkConfigTrackingManagerConfigPoolMaxSize !== undefined) {
      customVariable[39] = `sdk.config.trackingManager.config.poolMaxSize, ${this.sdkConfigTrackingManagerConfigPoolMaxSize}`
    }
    if (this.sdkConfigFetchNow !== undefined) {
      customVariable[40] = `sdk.config.trackingManager.config.fetchNow, ${this.sdkConfigFetchNow}`
    }
    if (this.sdkConfigEnableClientCache !== undefined) {
      customVariable[41] = `sdk.config.trackingManager.config.enableClientCache, ${this.sdkConfigEnableClientCache}`
    }
    if (this.sdkConfigInitialBucketing !== undefined) {
      customVariable[42] = `sdk.config.trackingManager.config.initialBucketing, ${JSON.stringify(this.sdkConfigInitialBucketing)}`
    }
    if (this.sdkConfigDecisionApiUrl !== undefined) {
      customVariable[43] = `sdk.config.trackingManager.config.decisionApiUrl, ${this.sdkConfigDecisionApiUrl}`
    }
    if (this.sdkConfigHitDeduplicationTime !== undefined) {
      customVariable[44] = `sdk.config.trackingManager.config.deduplicationTime, ${this.sdkConfigHitDeduplicationTime}`
    }

    if (this.httpRequestUrl) {
      customVariable[50] = `http.request.url, ${this.httpRequestUrl}`
    }
    if (this.httpRequestMethod) {
      customVariable[51] = `http.request.method, ${this.httpRequestMethod}`
    }
    if (this.httpRequestHeaders) {
      customVariable[52] = `http.request.headers, ${this.httpRequestHeaders}`
    }
    if (this.httpRequestBody) {
      customVariable[53] = `http.request.body, ${this.httpRequestBody}`
    }
    if (this.httpRequestDetails) {
      customVariable[54] = `http.request.details, ${this.httpRequestDetails}`
    }
    if (this.httpResponseUrl) {
      customVariable[60] = `http.response.url, ${this.httpResponseUrl}`
    }
    if (this.httpResponseMethod) {
      customVariable[61] = `http.response.method, ${this.httpResponseMethod}`
    }
    if (this.httpResponseHeaders) {
      customVariable[62] = `http.response.headers, ${this.httpResponseHeaders}`
    }
    if (this.httpResponseCode) {
      customVariable[63] = `http.response.code, ${this.httpResponseCode}`
    }
    if (this.httpResponseBody) {
      customVariable[64] = `http.response.body, ${this.httpResponseBody}`
    }
    if (this.httpResponseDetails) {
      customVariable[65] = `http.response.details, ${this.httpResponseDetails}`
    }
    if (this.visitorStatus) {
      customVariable[80] = `visitor.status, ${this.visitorStatus}`
    }
    if (this.visitorInstanceType) {
      customVariable[81] = `visitor.instanceType, ${this.visitorInstanceType}`
    }
    if (this.visitorContext) {
      customVariable[82] = `visitor.context, ${this.visitorContext}`
    }
    if (this.visitorConsent) {
      customVariable[83] = `visitor.consent, ${this.visitorConsent}`
    }
    if (this.visitorAssignmentHistory) {
      customVariable[84] = `visitor.assignmentsHistory, ${this.visitorAssignmentHistory}`
    }
    if (this.visitorFlags) {
      customVariable[85] = `visitor.flags, ${this.visitorFlags}`
    }
    if (this.visitorIsAuthenticated !== undefined) {
      customVariable[86] = `visitor.isAuthenticated, ${this.visitorIsAuthenticated}`
    }
    if (this.flagKey) {
      customVariable[100] = `flag.key, ${this.flagKey}`
    }
    if (this.flagValue) {
      customVariable[101] = `flag.value, ${this.flagValue}`
    }
    if (this.flagDefault) {
      customVariable[102] = `flag.default, ${this.flagDefault}`
    }
    if (this.flagMetadataCampaignId) {
      customVariable[103] = `flag.metadata.campaignId, ${this.flagMetadataCampaignId}`
    }
    if (this.flagMetadataVariationGroupId) {
      customVariable[104] = `flag.metadata.variationGroupId, ${this.flagMetadataVariationGroupId}`
    }
    if (this.flagMetadataVariationId) {
      customVariable[105] = `flag.metadata.variationId, ${this.flagMetadataVariationId}`
    }
    if (this.flagMetadataCampaignSlug) {
      customVariable[106] = `flag.metadata.campaignSlug, ${this.flagMetadataCampaignSlug}`
    }
    if (this.flagMetadataCampaignType) {
      customVariable[107] = `flag.metadata.campaignType, ${this.flagMetadataCampaignType}`
    }
    apiKeys.cv = customVariable
    return apiKeys
  }

  public toObject ():Record<string, unknown> {
    return {
      ...super.toObject(),
      category: this.category,
      action: this.action,
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
    return !!((!checkParent || super.isReady()) && this.category && this.action)
  }

  public getErrorMessage (): string {
    return ERROR_MESSAGE
  }
}
