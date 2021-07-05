import { FlagshipStatus, LogLevel, REQUEST_TIME_OUT } from "../enum/index.ts";
import { IFlagshipLogManager } from "../utils/FlagshipLogManager.ts";

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
  set envId(value: string | undefined);

  get envId(): string | undefined;

  /**
   * Specify the secure api key provided by Flagship, to use.
   */
  set apiKey(value: string | undefined);

  get apiKey(): string | undefined;

  get timeout(): number;

  /**
   * Specify timeout in Milliseconds for api request.
   * Default is 2000ms.
   */
  set timeout(value: number);

  get logLevel(): LogLevel;

  /**
   * Set the maximum log level to display
   */
  set logLevel(value: LogLevel);

  /**
   * Define a callable in order to get callback when the SDK status has changed.
   */
  set statusChangedCallback(fn: ((status: FlagshipStatus) => void) | undefined);

  get statusChangedCallback(): ((status: FlagshipStatus) => void) | undefined;

  get logManager(): IFlagshipLogManager;

  /**Specify a custom implementation of LogManager in order to receive logs from the SDK. */
  set logManager(value: IFlagshipLogManager);
}

export abstract class FlagshipConfig implements IFlagshipConfig {
  private _envId?: string;
  private _apiKey?: string;
  private _decisionMode = DecisionMode.DECISION_API;
  private _timeout = REQUEST_TIME_OUT;
  private _logLevel: LogLevel = LogLevel.ALL;
  private _statusChangedCallback?: (status: FlagshipStatus) => void;
  private _logManager!: IFlagshipLogManager;

  protected constructor(envId?: string, apiKey?: string) {
    this._envId = envId;
    this._apiKey = apiKey;
  }

  public set envId(value: string | undefined) {
    this._envId = value;
  }

  public get envId(): string | undefined {
    return this._envId;
  }

  public set apiKey(value: string | undefined) {
    this._apiKey = value;
  }

  public get apiKey(): string | undefined {
    return this._apiKey;
  }

  protected get decisionMode(): DecisionMode {
    return this._decisionMode;
  }

  /**
   * Specify the SDK running mode.
   */
  protected set decisionMode(value: DecisionMode) {
    this._decisionMode = value;
  }

  public get timeout(): number {
    return this._timeout;
  }

  public set timeout(value: number) {
    this._timeout = value;
  }

  public get logLevel(): LogLevel {
    return this._logLevel;
  }

  public set logLevel(value: LogLevel) {
    this._logLevel = value;
  }

  public set statusChangedCallback(
    fn: ((status: FlagshipStatus) => void) | undefined
  ) {
    this._statusChangedCallback = fn;
  }

  public get statusChangedCallback():
    | ((status: FlagshipStatus) => void)
    | undefined {
    return this._statusChangedCallback;
  }

  public get logManager(): IFlagshipLogManager {
    return this._logManager;
  }

  public set logManager(value: IFlagshipLogManager) {
    this._logManager = value;
  }
}
