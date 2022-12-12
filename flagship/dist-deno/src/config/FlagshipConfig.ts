import { BucketingDTO } from '../decision/api/bucketingDTO.ts'
import { BASE_API_URL, DEFAULT_DEDUPLICATION_TIME, FlagshipStatus, LogLevel, REQUEST_TIME_OUT, SDK_INFO, TYPE_ERROR } from '../enum/index.ts'
import { IHitCacheImplementation } from '../cache/IHitCacheImplementation.ts'
import { IFlagshipLogManager } from '../utils/FlagshipLogManager.ts'
import { logError, sprintf } from '../utils/utils.ts'
import { IVisitorCacheImplementation } from '../cache/IVisitorCacheImplementation.ts'
import { ITrackingManagerConfig, TrackingManagerConfig } from './TrackingManagerConfig.ts'
import { UserExposureInfo } from '../types.ts'
import { version as SDK_VERSION } from '../sdkVersion.ts'

export enum DecisionMode {
  /**
   *
   * Flagship SDK mode decision api
   * @deprecated use DECISION_API instead of
   */
  API = 'API',

  /**
   *   /**
   * Flagship SDK mode decision api
   */
  DECISION_API = 'DECISION-API',

  /**
   * Flagship SDK mode bucketing
   */
  BUCKETING = 'BUCKETING',
}

export interface IFlagshipConfig {
  /**
   * Specify the environment id provided by Flagship, to use.
   */
  envId?: string

  /**
   * Specify the secure api key provided by Flagship, to use.
   */
  apiKey?: string

  /**
   * Specify timeout in seconds for api request.
   * Default is 2s.
   */
  timeout?: number;

  /**
   * Set the maximum log level to display
   */
  logLevel?: LogLevel;

  /**
   * Specify the SDK running mode.
   * BUCKETING or DECISION_API
   */
  decisionMode?: DecisionMode

  /**
   * Define a callable in order to get callback when the SDK status has changed.
   */
  statusChangedCallback?: (status: FlagshipStatus) => void;

  /** Specify a custom implementation of LogManager in order to receive logs from the SDK. */
  logManager?: IFlagshipLogManager;

  /**
   * Decide to fetch automatically modifications data when creating a new FlagshipVisitor
   */
  fetchNow?: boolean,

  /**
   * Specify delay between two bucketing polling. Default is 2s.
   *
   * Note: If 0 is given then it should poll only once at start time.
   */
  pollingInterval?: number

  /**
   * Indicates whether enables or disables the client cache manager.
   * By enabling the client cache, it will allow you to keep cross sessions visitor experience.
   */
  enableClientCache?: boolean

  /**
   * Define a callable in order to get callback when the first bucketing polling succeed.
   */
  onBucketingSuccess?: (param: { status: number; payload: BucketingDTO }) => void

  /**
   * Define a callable to get callback when the first bucketing polling failed.
   */
  onBucketingFail?: (error: Error) => void

  /**
   * Define a callable to get callback each time bucketing data from Flagship has updated.
   */
  onBucketingUpdated?: (lastUpdate: Date) => void

  /**
   * This is a set of flag data provided to avoid the SDK to have an empty cache during the first initialization.
   */
  initialBucketing?: BucketingDTO

  decisionApiUrl?: string

  /**
   * Specify delay in seconds of hit deduplication. After a hit is sent, all future sending of this hit will be blocked until the expiration of the delay.
   *
   * Note: if 0 is given, no deduplication process will be used
   */
  hitDeduplicationTime?: number

  /**
   * Define an object that implement the interface visitorCacheImplementation, to handle the visitor cache.
   *
   */
  visitorCacheImplementation?: IVisitorCacheImplementation

  /**
   * Define an object that implement the interface IHitCacheImplementation, to handle the visitor cache.
   */
  hitCacheImplementation?: IHitCacheImplementation

  /**
   * If it's set to true, hit cache and visitor cache will be disabled otherwise will be enabled.
   */
  disableCache?: boolean

  language?: 0 | 1 | 2

  /**
   * Define options to configure hit batching
   */
  trackingMangerConfig?: ITrackingManagerConfig

  /**
   * Define a callable to get callback each time  a Flag have been user exposed (activation hit has been sent) by SDK
   */
  onUserExposure?: (param: UserExposureInfo)=>void
  sdkVersion?: string
  /**
   * Define a callable to get a callback whenever the SDK needs to report a log
   */
  onLog?: (level: LogLevel, tag: string, message: string)=>void
}

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
  private _trackingMangerConfig : ITrackingManagerConfig

  public get trackingMangerConfig () : ITrackingManagerConfig {
    return this._trackingMangerConfig
  }

  private _onLog? : (level: LogLevel, tag: string, message: string)=>void

  public get onLog () : ((level: LogLevel, tag: string, message: string)=>void)|undefined {
    return this._onLog
  }

  public set onLog (v :((level: LogLevel, tag: string, message: string)=>void)|undefined) {
    this._onLog = v
  }

  private _onUserExposure? : (param: UserExposureInfo)=>void
  public get onUserExposure () : ((param: UserExposureInfo)=>void)|undefined {
    return this._onUserExposure
  }

  protected constructor (param: IFlagshipConfig) {
    const {
      envId, apiKey, timeout, logLevel, logManager, statusChangedCallback,
      fetchNow, decisionMode, enableClientCache, initialBucketing, decisionApiUrl,
      hitDeduplicationTime, visitorCacheImplementation, hitCacheImplementation,
      disableCache, language, onUserExposure, sdkVersion, trackingMangerConfig, onLog
    } = param

    this.initSDKInfo(language, sdkVersion)

    if (logManager) {
      this.logManager = logManager
    }

    this._trackingMangerConfig = new TrackingManagerConfig(trackingMangerConfig || {})
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

    if (visitorCacheImplementation) {
      this.visitorCacheImplementation = visitorCacheImplementation
    }
    if (hitCacheImplementation) {
      this.hitCacheImplementation = hitCacheImplementation
    }

    this.statusChangedCallback = statusChangedCallback
    this._onUserExposure = onUserExposure
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
