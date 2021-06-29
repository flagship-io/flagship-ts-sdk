import {FlagshipConfig} from "./FlagshipConfig.ts";
import {IDecisionManager} from "../decision/IDecisionManager.ts";

export class ConfigManager {
  private _config:FlagshipConfig;
  private _decisionManager:IDecisionManager;
  private _trackingManager:unknown;

  public constructor(config : FlagshipConfig, decisionManager: IDecisionManager, trackingManager: any) {
    this._config= config;
    this._decisionManager = decisionManager;
    this._trackingManager = trackingManager;
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

  get trackingManager(): unknown {
    return this._trackingManager;
  }

  set trackingManager(value: unknown) {
    this._trackingManager = value;
  }
}
