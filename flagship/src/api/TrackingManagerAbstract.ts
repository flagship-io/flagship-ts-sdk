import { IFlagshipConfig } from '../config/FlagshipConfig'
import { HitAbstract } from '../hit/HitAbstract'
import { Modification } from '../model/Modification'
import { IHttpClient } from '../utils/httpClient'
import { VisitorAbstract } from '../visitor/VisitorAbstract'

export interface ITrackingManager {
  /**
   * Send to server that this user has seen this modification
   * @param visitor
   * @param modification
   */
  sendActive(visitor: VisitorAbstract, modification: Modification): Promise<void>;
  /**
   *Send a Hit to Flagship servers for reporting.
   * @param hit
   */
  sendHit(hit: HitAbstract): Promise<void>;

  config:IFlagshipConfig
}

export abstract class TrackingManagerAbstract implements ITrackingManager {
  private _httpClient: IHttpClient;
  private _config: IFlagshipConfig;
  constructor (httpClient: IHttpClient, config: IFlagshipConfig) {
    this._httpClient = httpClient
    this._config = config
  }

  public get httpClient ():IHttpClient {
    return this._httpClient
  }

  public set config (v:IFlagshipConfig) {
    this._config = v
  }

  public get config ():IFlagshipConfig {
    return this._config
  }

  public abstract sendActive(
    visitor: VisitorAbstract,
    modification: Modification
  ): Promise<void>;

  public abstract sendHit(hit: HitAbstract): Promise<void>;
}
