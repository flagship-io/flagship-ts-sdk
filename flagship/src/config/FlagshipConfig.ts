import { BucketingDTO } from '../decision/api/bucketingDTO'
import { BASE_API_URL, DEFAULT_DEDUPLICATION_TIME, FETCH_FLAG_BUFFERING_DEFAULT_TIME, FlagshipStatus, LogLevel, REQUEST_TIME_OUT, SDK_INFO, TYPE_ERROR } from '../enum/index'
import { IHitCacheImplementation } from '../cache/IHitCacheImplementation'
import { IFlagshipLogManager } from '../utils/FlagshipLogManager'
import { logError, sprintf } from '../utils/utils'
import { IVisitorCacheImplementation } from '../cache/IVisitorCacheImplementation'
import { ITrackingManagerConfig, TrackingManagerConfig } from './TrackingManagerConfig'
import { OnVisitorExposed, UserExposureInfo } from '../types'
import { version as SDK_VERSION } from '../sdkVersion'
import { IFlagshipConfig } from './IFlagshipConfig'
import { DecisionMode } from './DecisionMode'

export const statusChangeError = 'statusChangedCallback must be a function'

export abstract class FlagshipConfig implements IFlagshipConfig {
  private _envId?: string
  private _apiKey?: string
  protected _decisionMode: DecisionMode
  private _timeout!: number
  private _logLevel!: LogLevel
  private _statusChangedCallback?: (status: FlagshipStatus) => void
  private _logManager!: IFlagshipLogManager
  private _fetchNow!: boolean
  private _pollingInterval!: number
  private _onBucketingFail?: (error: Error) => void
  private _onBucketingSuccess?: (param: { status: number; payload: BucketingDTO }) => void
  private _onBucketingUpdated?: (lastUpdate: Date) => void
  private _enableClientCache!: boolean
  private _initialBucketing?: BucketingDTO
  private _decisionApiUrl!: string
  private _hitDeduplicationTime!: number
  private _visitorCacheImplementation!: IVisitorCacheImplementation
  private _hitCacheImplementation!: IHitCacheImplementation
  private _disableCache!: boolean
  private _trackingManagerConfig : ITrackingManagerConfig
  private _onUserExposure? : (param: UserExposureInfo)=>void
  private _onVisitorExposed?:(arg: OnVisitorExposed)=> void
  private _fetchThirdPartyData : boolean|undefined
  private _nextFetchConfig? : Record<string, unknown>
  private _fetchFlagsBufferingTime? : number
  private _enableAnalytics? : boolean

  public get disableDeveloperUsageTracking () : boolean|undefined {
    return this._enableAnalytics
  }

  public set disableDeveloperUsageTracking (v : boolean|undefined) {
    this._enableAnalytics = v
  }

  public get fetchFlagsBufferingTime () : number|undefined {
    return this._fetchFlagsBufferingTime
  }

  public set fetchFlagsBufferingTime (v : number|undefined) {
    this._fetchFlagsBufferingTime = v
  }

  public get nextFetchConfig () : Record<string, unknown>|undefined {
    return this._nextFetchConfig
  }

  public set nextFetchConfig (v : Record<string, unknown>|undefined) {
    this._nextFetchConfig = v
  }

  public get fetchThirdPartyData () : boolean|undefined {
    return this._fetchThirdPartyData
  }

  public set fetchThirdPartyData (v : boolean|undefined) {
    this._fetchThirdPartyData = v
  }

  public get trackingManagerConfig () : ITrackingManagerConfig {
    return this._trackingManagerConfig
  }

  private _onLog? : (level: LogLevel, tag: string, message: string)=>void

  public get onLog () : ((level: LogLevel, tag: string, message: string)=>void)|undefined {
    return this._onLog
  }

  public set onLog (v :((level: LogLevel, tag: string, message: string)=>void)|undefined) {
    this._onLog = v
  }

  public get onUserExposure () : ((param: UserExposureInfo)=>void)|undefined {
    return this._onUserExposure
  }

  public get onVisitorExposed (): ((arg: OnVisitorExposed) => void) | undefined {
    return this._onVisitorExposed
  }

  protected constructor (param: IFlagshipConfig) {
    const {
      envId, apiKey, timeout, logLevel, logManager, statusChangedCallback,
      fetchNow, decisionMode, enableClientCache, initialBucketing, decisionApiUrl,
      hitDeduplicationTime, visitorCacheImplementation, hitCacheImplementation,
      disableCache, language, onUserExposure, sdkVersion, trackingMangerConfig, trackingManagerConfig, onLog,
      onVisitorExposed, nextFetchConfig, fetchFlagsBufferingTime, disableDeveloperUsageTracking
    } = param

    this.initSDKInfo(language, sdkVersion)

    if (logManager) {
      this.logManager = logManager
    }

    this.fetchFlagsBufferingTime = fetchFlagsBufferingTime ?? FETCH_FLAG_BUFFERING_DEFAULT_TIME
    this.nextFetchConfig = nextFetchConfig || { revalidate: 20 }
    this._trackingManagerConfig = new TrackingManagerConfig(trackingManagerConfig || trackingMangerConfig || {})
    this.onLog = onLog
    this.decisionApiUrl = decisionApiUrl || BASE_API_URL
    this._envId = envId
    this._apiKey = apiKey
    this.logLevel = logLevel ?? LogLevel.ALL
    this.timeout = timeout || REQUEST_TIME_OUT
    this.fetchNow = typeof fetchNow === 'undefined' || fetchNow
    this.enableClientCache = typeof enableClientCache === 'undefined' || enableClientCache
    this._decisionMode = decisionMode || DecisionMode.DECISION_API
    this._initialBucketing = initialBucketing
    this.hitDeduplicationTime = hitDeduplicationTime ?? DEFAULT_DEDUPLICATION_TIME
    this.disableCache = !!disableCache
    this.disableDeveloperUsageTracking = disableDeveloperUsageTracking || false

    if (visitorCacheImplementation) {
      this.visitorCacheImplementation = visitorCacheImplementation
    }
    if (hitCacheImplementation) {
      this.hitCacheImplementation = hitCacheImplementation
    }

    this.statusChangedCallback = statusChangedCallback
    this._onUserExposure = onUserExposure
    this._onVisitorExposed = onVisitorExposed
  }

  protected initSDKInfo (language?:number, sdkVersion?:string) {
    switch (language) {
      case 1:
        SDK_INFO.name = 'ReactJS'
        SDK_INFO.version = sdkVersion ?? SDK_VERSION
        break
      case 2:
        SDK_INFO.name = 'React-Native'
        SDK_INFO.version = sdkVersion ?? SDK_VERSION
        break
      default:
        SDK_INFO.name = (typeof window !== 'undefined' && 'Deno' in window) ? 'Deno' : 'Typescript'
        SDK_INFO.version = SDK_VERSION
        break
    }
  }

  public get initialBucketing (): BucketingDTO | undefined {
    return this._initialBucketing
  }

  public set initialBucketing (v: BucketingDTO | undefined) {
    this._initialBucketing = v
  }

  public get enableClientCache (): boolean {
    return this._enableClientCache
  }

  public set enableClientCache (v: boolean) {
    this._enableClientCache = v
  }

  public get onBucketingSuccess (): ((param: { status: number; payload: BucketingDTO }) => void) | undefined {
    return this._onBucketingSuccess
  }

  public set onBucketingSuccess (v: ((param: { status: number; payload: BucketingDTO }) => void) | undefined) {
    this._onBucketingSuccess = v
  }

  public get onBucketingFail (): ((error: Error) => void) | undefined {
    return this._onBucketingFail
  }

  public set onBucketingFail (v: ((error: Error) => void) | undefined) {
    this._onBucketingFail = v
  }

  public get onBucketingUpdated (): ((lastUpdate: Date) => void) | undefined {
    return this._onBucketingUpdated
  }

  public set onBucketingUpdated (v: ((lastUpdate: Date) => void) | undefined) {
    this._onBucketingUpdated = v
  }

  public set envId (value: string | undefined) {
    this._envId = value
  }

  public get envId (): string | undefined {
    return this._envId
  }

  public set apiKey (value: string | undefined) {
    this._apiKey = value
  }

  public get apiKey (): string | undefined {
    return this._apiKey
  }

  public get decisionMode (): DecisionMode {
    return this._decisionMode
  }

  public get timeout (): number {
    return this._timeout
  }

  public set timeout (value: number) {
    this._timeout = value
  }

  public get logLevel (): LogLevel {
    return this._logLevel
  }

  public set logLevel (value: LogLevel) {
    this._logLevel = value
  }

  public get fetchNow (): boolean {
    return this._fetchNow
  }

  public set fetchNow (v: boolean) {
    this._fetchNow = v
  }

  public get pollingInterval (): number {
    return this._pollingInterval
  }

  public set pollingInterval (v: number) {
    this._pollingInterval = v
  }

  public get hitDeduplicationTime (): number {
    return this._hitDeduplicationTime
  }

  public set hitDeduplicationTime (v: number) {
    if (typeof v !== 'number') {
      logError(this, sprintf(TYPE_ERROR, 'hitDeduplicationTime', 'number'), 'hitDeduplicationTime')
      return
    }
    this._hitDeduplicationTime = v
  }

  public get visitorCacheImplementation (): IVisitorCacheImplementation {
    return this._visitorCacheImplementation
  }

  public set visitorCacheImplementation (v: IVisitorCacheImplementation) {
    this._visitorCacheImplementation = v
  }

  public get hitCacheImplementation (): IHitCacheImplementation {
    return this._hitCacheImplementation
  }

  public set hitCacheImplementation (v: IHitCacheImplementation) {
    this._hitCacheImplementation = v
  }

  public get disableCache (): boolean {
    return this._disableCache
  }

  public set disableCache (v: boolean) {
    this._disableCache = v
  }

  public get statusChangedCallback (): ((status: FlagshipStatus) => void) | undefined {
    return this._statusChangedCallback
  }

  public set statusChangedCallback (fn: ((status: FlagshipStatus) => void) | undefined) {
    if (fn && typeof fn !== 'function') {
      logError(this, statusChangeError, 'statusChangedCallback')
      return
    }
    this._statusChangedCallback = fn
  }

  public get logManager (): IFlagshipLogManager {
    return this._logManager
  }

  public set logManager (value: IFlagshipLogManager) {
    this._logManager = value
  }

  public get decisionApiUrl (): string {
    return this._decisionApiUrl
  }

  public set decisionApiUrl (v: string) {
    if (typeof v !== 'string') {
      logError(this, sprintf(TYPE_ERROR, 'decisionApiUrl', 'string'), 'decisionApiUrl')
      return
    }
    this._decisionApiUrl = v
  }
}
