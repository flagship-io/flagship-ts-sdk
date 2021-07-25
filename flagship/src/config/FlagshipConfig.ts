import { FlagshipStatus, LogLevel, REQUEST_TIME_OUT } from '../enum/index'
import { IFlagshipLogManager } from '../utils/FlagshipLogManager'
import { logError } from '../utils/utils'

export enum DecisionMode {
  /**
   * Flagship SDK mode decision api
   */
  DECISION_API,
  /**
   * Flagship SDK mode bucketing
   */
  BUCKETING,
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
   * Specify timeout in Milliseconds for api request.
   * Default is 2000ms.
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
  decisionMode: DecisionMode

  /**
   * Define a callable in order to get callback when the SDK status has changed.
   */
  statusChangedCallback?:(status: FlagshipStatus) => void;

  /** Specify a custom implementation of LogManager in order to receive logs from the SDK. */
  logManager?: IFlagshipLogManager;

  /**
   * Decide to fetch automatically modifications data when creating a new FlagshipVisitor
   */
  fetchNow?:boolean
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

  protected constructor (param: IFlagshipConfig) {
    const {
      envId, apiKey, timeout, logLevel, logManager, statusChangedCallback,
      fetchNow, decisionMode
    } = param
    this._envId = envId
    this._apiKey = apiKey
    this.logLevel = logLevel || LogLevel.ALL
    this.timeout = timeout || REQUEST_TIME_OUT
    this.fetchNow = typeof fetchNow === 'undefined' || fetchNow
    this._decisionMode = decisionMode || DecisionMode.DECISION_API
    if (logManager) {
      this.logManager = logManager
    }
    this.statusChangedCallback = statusChangedCallback
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
}
