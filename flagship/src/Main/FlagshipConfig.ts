import { FlagshipMode } from "../Enum/FlagshipMode.ts";
import { Status } from "./Flagship.ts";
import { Mode } from "../Enum/FlagshipMode.ts";
import { IDecisionManager } from "../decision/IDecisionManager.ts";

export interface OnStatusChangedListener {
  onStatusChanged?(newStatus: Status): void;
}

export class FlagshipConfig {
  private _envId: string;
  private _apiKey: string;
  private _flagshipMode: FlagshipMode = FlagshipMode.DECISION_API;
  private _timeOut: number = 2000;
  private _logManager;
  private _decisionManager: IDecisionManager;
  private _trackingManager;
  private _onStatusChangedListener: OnStatusChangedListener;

  constructor(envId?: string, apiKey?: string) {
    if (!envId && !apiKey) {
      return;
    }
    this._envId = envId;
    this._apiKey = apiKey;
  }

  public getEnvId(): string {
    return this._envId;
  }

  public withEnvId(envId: string): FlagshipConfig {
    this._envId = envId;
    return this;
  }

  public getApiKey(): string {
    return this._apiKey;
  }

  public withApiKey(apiKey: string): FlagshipConfig {
    this._apiKey = apiKey;
    return this;
  }

  public getFlagshipMode(): FlagshipMode {
    return this._flagshipMode;
  }

  public withFlagshipMode(flagshipMode: Mode): FlagshipConfig {
    if (FlagshipMode.isFlagshipMode(flagshipMode)) {
      this._flagshipMode = FlagshipMode;
      return this;
    }
  }

  public withStatusChangeListener(listener: OnStatusChangedListener) {
    if (listener != null) {
      this._onStatusChangedListener = listener;
    }
    return this;
  }

  public getOnStatusChangedListener() {
    return this._onStatusChangedListener;
  }

  public getTimeOut(): number {
    return this._timeOut;
  }

  public withTimeOut(timeOut: number): FlagshipConfig {
    this._timeOut = timeOut;
    return this;
  }

  public toString(): string {
    return (
      "FlagshipConfig{" +
      "envId='" +
      this._envId +
      "'" +
      ", apiKey='" +
      this._apiKey +
      "'" +
      ", mode=" +
      this._flagshipMode +
      "}"
    );
  }
}
