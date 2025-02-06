import { type IFlagshipConfig } from './IFlagshipConfig'
import { type IDecisionManager } from '../decision/IDecisionManager'
import { type ITrackingManager } from '../api/ITrackingManager'
import { ISharedActionTracking } from '../sharedFeature/ISharedActionTracking'

export interface IConfigManager {
  config: IFlagshipConfig;

  decisionManager: IDecisionManager;

  trackingManager: ITrackingManager;

  sharedActionTracking?: ISharedActionTracking;

}
export class ConfigManager implements IConfigManager {
  private _config: IFlagshipConfig
  private _decisionManager: IDecisionManager
  private _trackingManager: ITrackingManager
  private _sharedActionTracking?: ISharedActionTracking

  public constructor (
    config: IFlagshipConfig,
    decisionManager: IDecisionManager,
    trackingManager: ITrackingManager,
    sharedActionTracking?: ISharedActionTracking
  ) {
    this._config = config
    this._decisionManager = decisionManager
    this._trackingManager = trackingManager
    this._sharedActionTracking = sharedActionTracking
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

  get sharedActionTracking (): ISharedActionTracking | undefined {
    return this._sharedActionTracking
  }

  set sharedActionTracking (value: ISharedActionTracking| undefined) {
    this._sharedActionTracking = value
  }
}
