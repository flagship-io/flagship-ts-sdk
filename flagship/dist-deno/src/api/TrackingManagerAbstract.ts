import { IFlagshipConfig } from '../config/FlagshipConfig.ts'
import { HitAbstract } from '../hit/HitAbstract.ts'
import { FlagDTO, primitive } from '../types.ts'
import { IHttpClient } from '../utils/HttpClient.ts'
import { VisitorAbstract } from '../visitor/VisitorAbstract.ts'

export interface ITrackingManager {
 /**
  * Send to server that this user has seen this modification
  * @param flagData 
  */
  sendActive(flagData: Record<string, primitive | null>): Promise<void>;
  /**
   *Send a Hit to Flagship servers for reporting.
   * @param hit
   */
  sendHit(hit: HitAbstract): Promise<void>;

  sendConsentHit(visitor: VisitorAbstract):Promise<void>;

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

  public get config ():IFlagshipConfig {
    return this._config
  }

  public abstract sendActive(
    flagData: Record<string, primitive | null>
  ): Promise<void>;

  public abstract sendHit(hit: HitAbstract): Promise<void>;

  public abstract sendConsentHit(visitor: VisitorAbstract): Promise<void>;
}
