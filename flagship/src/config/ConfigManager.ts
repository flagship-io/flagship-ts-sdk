import {FlagshipConfig} from "./FlagshipConfig";
import {IDecisionManager} from "../decision/IDecisionManager";

export class ConfigManager {
  private _config:FlagshipConfig;
  private _decisionManager:IDecisionManager;
  private _trackingManager:any;

  public constructor(config : FlagshipConfig, decisionManager: IDecisionManager, trackingManager: any) {
    this.config= config;
    this.decisionManager = decisionManager;
    this.trackingManager = trackingManager;
  }

  get config(): FlagshipConfig {
    return this._config;
  }

  set config(value: FlagshipConfig) {
    this._config = value;
  }

  get decisionManager(): IDecisionManager {
    return this._decisionManager;
  }

  set decisionManager(value: IDecisionManager) {
    this._decisionManager = value;
  }

  get trackingManager(): any {
    return this._trackingManager;
  }

  set trackingManager(value: any) {
    this._trackingManager = value;
  }
}
