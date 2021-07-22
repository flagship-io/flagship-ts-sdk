import { IFlagshipConfig } from './FlagshipConfig'
import { IDecisionManager } from '../decision/IDecisionManager'
import { ITrackingManager } from '../api/TrackingManagerAbstract'

export interface IConfigManager {
  config: IFlagshipConfig;

  decisionManager: IDecisionManager;

  trackingManager: ITrackingManager;

}
export class ConfigManager implements IConfigManager {
  private _config: IFlagshipConfig;
  private _decisionManager: IDecisionManager;
  private _trackingManager: ITrackingManager;

  public constructor (
    config: IFlagshipConfig,
    decisionManager: IDecisionManager,
    trackingManager: ITrackingManager
  ) {
    this._config = config
    this._decisionManager = decisionManager
    this._trackingManager = trackingManager
  }

  get config (): IFlagshipConfig {
    return this._config
  }

  set config (value: IFlagshipConfig) {
    this._config = value
  }

  get decisionManager (): IDecisionManager {
    return this._decisionManager
  }

  set decisionManager (value: IDecisionManager) {
    this._decisionManager = value
  }

  get trackingManager (): ITrackingManager {
    return this._trackingManager
  }

  set trackingManager (value: ITrackingManager) {
    this._trackingManager = value
  }
}
