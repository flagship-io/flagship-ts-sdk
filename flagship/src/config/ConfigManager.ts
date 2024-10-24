import { type IFlagshipConfig } from './IFlagshipConfig'
import { type ITrackingManager } from '../api/ITrackingManager'
import { IBucketingPolling } from '../polling/IBucketingPolling'

export interface IConfigManager {
  config: IFlagshipConfig;

  bucketingPolling: IBucketingPolling;

  trackingManager: ITrackingManager;

}
export class ConfigManager implements IConfigManager {
  private _config: IFlagshipConfig
  private _trackingManager: ITrackingManager
  private _bucketingPolling : IBucketingPolling

  public constructor (
    config: IFlagshipConfig,
    bucketingPolling: IBucketingPolling,
    trackingManager: ITrackingManager
  ) {
    this._config = config
    this._bucketingPolling = bucketingPolling
    this._trackingManager = trackingManager
  }

  get config (): IFlagshipConfig {
    return this._config
  }

  set config (value: IFlagshipConfig) {
    this._config = value
  }

  get trackingManager (): ITrackingManager {
    return this._trackingManager
  }

  set trackingManager (value: ITrackingManager) {
    this._trackingManager = value
  }

  public get bucketingPolling () : IBucketingPolling {
    return this._bucketingPolling
  }

  public set bucketingPolling (v : IBucketingPolling) {
    this._bucketingPolling = v
  }
}
