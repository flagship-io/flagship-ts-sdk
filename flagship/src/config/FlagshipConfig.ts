import { FlagshipStatus, LogLevel } from "../enum/index.ts";
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
  set envId(value: string | undefined);

  get envId(): string | undefined;

  set apiKey(value: string | undefined);

  get apiKey(): string | undefined;

  get decisionMode(): DecisionMode;

  set decisionMode(value: DecisionMode);

  get timeout(): number;

  set timeout(value: number);

  get logLevel(): LogLevel;

  set logLevel(value: LogLevel);

  set statusChangedCallback(fn: ((status: FlagshipStatus) => void) | undefined);

  get statusChangedCallback(): ((status: FlagshipStatus) => void) | undefined;

  get logManager(): IFlagshipLogManager;

  set logManager(value: unknown);
}

export abstract class FlagshipConfig implements IFlagshipConfig {
  private _envId?: string;
  private _apiKey?: string;
  private _decisionMode = DecisionMode.DECISION_API;
  private _timeout = 2000;
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

  public get decisionMode(): DecisionMode {
    return this._decisionMode;
  }

  public set decisionMode(value: DecisionMode) {
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
