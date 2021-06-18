import { Status } from "./Flagship.ts";
import { Mode } from "../Enum/FlagshipMode.ts";
import { IDecisionManager } from "../decision/IDecisionManager.ts";

export interface OnStatusChangedListener {
  onStatusChanged?(newStatus: Status): void;
}

export class FlagshipConfig {
  protected _flagshipMode: Mode = Mode.DECISION_API;
  protected _timeOut = 2000;
  protected _logManager: any;
  protected _decisionManager?: IDecisionManager = undefined;
  protected _trackingManager: any;
  protected _onStatusChangedListener?: OnStatusChangedListener = undefined;

  constructor() {}

  public getFlagshipMode(): Mode {
    return this._flagshipMode;
  }

  public withFlagshipMode(flagshipMode: Mode): FlagshipConfig {
    this._flagshipMode = flagshipMode;
    return this;
  }

  public get decisionManager(): IDecisionManager | undefined {
    return this._decisionManager;
  }

  public withStatusChangeListener(listener: OnStatusChangedListener) {
    if (listener != null) {
      this._onStatusChangedListener = listener;
    }
    return this;
  }

  public getOnStatusChangedListener(): OnStatusChangedListener | undefined {
    return this._onStatusChangedListener;
  }

  public getTimeOut(): number {
    return this._timeOut;
  }

  public withTimeOut(timeOut: number): FlagshipConfig {
    this._timeOut = timeOut;
    return this;
  }
}
