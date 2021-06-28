import { DecisionMode } from "../Enum/DecisionMode";
import { LogLevel } from "../Enum/LogLevel";
import { FlagshipStatus } from "../Enum/FlagshipStatus";

export abstract class FlagshipConfig {
  private _envId: string;
  private _apiKey: string;
  private _decisionMode = DecisionMode.DECISION_API;
  private _timeout = 2000;
  private _logLevel: LogLevel;
  private _statusChangedCallback: (status: FlagshipStatus) => void;
  private _logManager: any;

  protected constructor(envId?: string, apiKey?: string) {
    this._envId = envId;
    this._apiKey = apiKey;
  }

  public set envId(value: string) {
    this._envId = value;
  }

  public get envId(): string {
    return this._envId;
  }

  public set apiKey(value: string) {
    this._apiKey = value;
  }

  public get apiKey(): string {
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

  public set statusChangedCallback(fn: (status: FlagshipStatus) => void) {
    this._statusChangedCallback = fn;
  }

  public get statusChangedCallback():(status: FlagshipStatus) => void{
    return this._statusChangedCallback;
  }

  public get logManager(): any {
    return this._logManager;
  }

  public set logManager(value: any) {
    this.logManager = value;
  }


  public toString(): string {
    return (
      "FlagshipConfig{" +
      "envId='" +
      this.envId +
      "'" +
      ", apiKey='" +
      this.apiKey +
      "'" +
      ", mode=" +
      this.decisionMode +
      "}"
    );
  }
}
