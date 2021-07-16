import { IFlagshipConfig } from '../config/FlagshipConfig.ts'
import { HitAbstract } from '../hit/HitAbstract.ts'
import { Modification } from '../model/Modification.ts'
import { IHttpClient } from '../utils/httpClient.ts'
import { Visitor } from '../visitor/Visitor.ts'
import { IFlagshipConfig } from '../config/FlagshipConfig.ts'
import { HitAbstract } from '../hit/HitAbstract.ts'
import { Modification } from '../model/Modification.ts'
import { IHttpClient } from '../utils/httpClient.ts'
import { Visitor } from '../visitor/Visitor.ts'
import { IFlagshipConfig } from '../config/FlagshipConfig.ts'
import { HitAbstract } from '../hit/HitAbstract.ts'
import { Modification } from '../model/Modification.ts'
import { IHttpClient } from '../utils/httpClient.ts'
import { Visitor } from '../visitor/Visitor.ts'
import { IFlagshipConfig } from '../config/FlagshipConfig.ts'
import { HitAbstract } from '../hit/HitAbstract.ts'
import { Modification } from '../model/Modification.ts'
import { IHttpClient } from '../utils/httpClient.ts'
import { Visitor } from '../visitor/Visitor.ts'
import { IFlagshipConfig } from '../config/FlagshipConfig.ts'
import { HitAbstract } from '../hit/HitAbstract.ts'
import { Modification } from '../model/Modification.ts'
import { IHttpClient } from '../utils/httpClient.ts'
import { Visitor } from '../visitor/Visitor.ts'

export interface ITrackingManager {
  /**
   * Send to server that this user has seen this modification
   * @param visitor
   * @param modification
   */
  sendActive(visitor: Visitor, modification: Modification): Promise<void>;
  /**
   *Send a Hit to Flagship servers for reporting.
   * @param hit
   */
  sendHit(hit: HitAbstract): Promise<void>;
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
    visitor: Visitor,
    modification: Modification
  ): Promise<void>;

  public abstract sendHit(hit: HitAbstract): Promise<void>;
}
