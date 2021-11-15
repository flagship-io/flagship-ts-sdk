import { BucketingDTO } from '../decision/api/bucketingDTO'
import { BASE_API_URL, DEFAULT_DEDUPLICATION_TIME, FlagshipStatus, LogLevel, REQUEST_TIME_OUT, TYPE_ERROR } from '../enum/index'
import { IHitCache } from '../hit/IHitCache'
import { IFlagshipLogManager } from '../utils/FlagshipLogManager'
import { logError, sprintf } from '../utils/utils'
import { IVisitorCache } from '../visitor/IVisitorCache'

export enum DecisionMode {
  /**
   * Flagship SDK mode decision api
   */
  DECISION_API='API',
  /**
   * Flagship SDK mode bucketing
   */
  BUCKETING='BUCKETING',
}

export interface IFlagshipConfig {
  /**
   * Specify the environment id provided by Flagship, to use.
   */
  envId?:string

  /**
   * Specify the secure api key provided by Flagship, to use.
   */
  apiKey?:string

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
  statusChangedCallback?:(status: FlagshipStatus) => void;

  /** Specify a custom implementation of LogManager in order to receive logs from the SDK. */
  logManager?: IFlagshipLogManager;

  /**
   * Decide to fetch automatically modifications data when creating a new FlagshipVisitor
   */
  fetchNow?:boolean,

  /**
   * Specify delay between two bucketing polling. Default is 2s.
   *
   * Note: If 0 is given then it should poll only once at start time.
   */
  pollingInterval?:number

  /**
   * Indicates whether enables or disables the client cache manager.
   * By enabling the client cache, it will allow you to keep cross sessions visitor experience.
   */
  enableClientCache?:boolean

  onBucketingSuccess?:(param:{ status: FlagshipStatus; payload: BucketingDTO })=>void

  onBucketingFail?:(error: Error)=>void

  onBucketingUpdated?:(lastUpdate:Date)=>void

  initialBucketing?:BucketingDTO

  decisionApiUrl?: string

  activateDeduplicationTime?: number

  hitDeduplicationTime?:number

  visitorCacheImplementation?: IVisitorCache

  hitCacheImplementation?: IHitCache
}

export const statusChangeError = 'statusChangedCallback must be a function'

export abstract class FlagshipConfig implements IFlagshipConfig {
  private _envId?: string;
  private _apiKey?: string;
  protected _decisionMode:DecisionMode;
  private _timeout! : number;
  private _logLevel!: LogLevel;
  private _statusChangedCallback?: (status: FlagshipStatus) => void;
  private _logManager!: IFlagshipLogManager;
  private _fetchNow! : boolean;
  private _pollingInterval!: number
  private _onBucketingFail?: (error: Error)=>void;
  private _onBucketingSuccess?: (param:{ status: number; payload: BucketingDTO })=>void;
  private _onBucketingUpdated?: (lastUpdate:Date)=>void;
  private _enableClientCache! : boolean;
  private _initialBucketing?:BucketingDTO
  private _decisionApiUrl!: string
  private _activateDeduplicationTime! : number;
  private _hitDeduplicationTime! : number;
  private _visitorCacheImplementation! : IVisitorCache;
  private _hitCacheImplementation! : IHitCache;

  protected constructor (param: IFlagshipConfig) {
    const {
      envId, apiKey, timeout, logLevel, logManager, statusChangedCallback,
      fetchNow, decisionMode, enableClientCache, initialBucketing, decisionApiUrl,
      activateDeduplicationTime, hitDeduplicationTime, visitorCacheImplementation, hitCacheImplementation
    } = param

    this.decisionApiUrl = decisionApiUrl || BASE_API_URL
    this._envId = envId
    this._apiKey = apiKey
    this.logLevel = logLevel || LogLevel.ALL
    this.timeout = timeout || REQUEST_TIME_OUT
    this.fetchNow = typeof fetchNow === 'undefined' || fetchNow
    this.enableClientCache = typeof enableClientCache === 'undefined' || enableClientCache
    this._decisionMode = decisionMode || DecisionMode.DECISION_API
    this._initialBucketing = initialBucketing
    this.activateDeduplicationTime = activateDeduplicationTime ?? DEFAULT_DEDUPLICATION_TIME
    this.hitDeduplicationTime = hitDeduplicationTime ?? DEFAULT_DEDUPLICATION_TIME
    if (visitorCacheImplementation) {
      this.visitorCacheImplementation = visitorCacheImplementation
    }
    if (hitCacheImplementation) {
      this.hitCacheImplementation = hitCacheImplementation
    }

    if (logManager) {
      this.logManager = logManager
    }
    this.statusChangedCallback = statusChangedCallback
  }

  public get initialBucketing () : BucketingDTO|undefined {
    return this._initialBucketing
  }

  public set initialBucketing (v : BucketingDTO|undefined) {
    this._initialBucketing = v
  }

  public get enableClientCache () : boolean {
    return this._enableClientCache
  }

  public set enableClientCache (v : boolean) {
    this._enableClientCache = v
  }

  public get onBucketingSuccess () : ((param:{ status: number; payload: BucketingDTO })=>void)| undefined {
    return this._onBucketingSuccess
  }

  public set onBucketingSuccess (v : ((param:{ status: number; payload: BucketingDTO })=>void)| undefined) {
    this._onBucketingSuccess = v
  }

  public get onBucketingFail () : ((error: Error)=>void)| undefined {
    return this._onBucketingFail
  }

  public set onBucketingFail (v : ((error: Error)=>void)| undefined) {
    this._onBucketingFail = v
  }

  public get onBucketingUpdated () : ((lastUpdate:Date)=>void)|undefined {
    return this._onBucketingUpdated
  }

  public set onBucketingUpdated (v : ((lastUpdate:Date)=>void)|undefined) {
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

  public get fetchNow () : boolean {
    return this._fetchNow
  }

  public set fetchNow (v : boolean) {
    this._fetchNow = v
  }

  public get pollingInterval () : number {
    return this._pollingInterval
  }

  public set pollingInterval (v : number) {
    this._pollingInterval = v
  }

  public get activateDeduplicationTime () : number {
    return this._activateDeduplicationTime
  }

  public set activateDeduplicationTime (v : number) {
    if (typeof v !== 'number') {
      logError(this, sprintf(TYPE_ERROR, 'activateDeduplicationTime', 'number'), 'activateDeduplicationTime')
      return
    }
    this._activateDeduplicationTime = v
  }

  public get hitDeduplicationTime () : number {
    return this._hitDeduplicationTime
  }

  public set hitDeduplicationTime (v : number) {
    if (typeof v !== 'number') {
      logError(this, sprintf(TYPE_ERROR, 'hitDeduplicationTime', 'number'), 'hitDeduplicationTime')
      return
    }
    this._hitDeduplicationTime = v
  }

  public get visitorCacheImplementation () : IVisitorCache {
    return this._visitorCacheImplementation
  }

  public set visitorCacheImplementation (v : IVisitorCache) {
    this._visitorCacheImplementation = v
  }

  public get hitCacheImplementation () : IHitCache {
    return this._hitCacheImplementation
  }

  public set hitCacheImplementation (v : IHitCache
  ) {
    this._hitCacheImplementation = v
  }

  public get statusChangedCallback () :((status: FlagshipStatus) => void)|undefined {
    return this._statusChangedCallback
  }

  public set statusChangedCallback (fn : ((status: FlagshipStatus) => void) | undefined) {
    if (typeof fn !== 'function') {
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

  public get decisionApiUrl () : string {
    return this._decisionApiUrl
  }

  public set decisionApiUrl (v : string) {
    if (typeof v !== 'string') {
      logError(this, sprintf(TYPE_ERROR, 'decisionApiUrl', 'string'), 'decisionApiUrl')
      return
    }
    this._decisionApiUrl = v
  }
}
