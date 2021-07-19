import { IDecisionManager } from './IDecisionManager.ts'
import { Modification } from '../model/Modification.ts'
import { IFlagshipConfig } from '../config/FlagshipConfig.ts'
import { IHttpClient } from '../utils/httpClient.ts'
import { Visitor } from '../visitor/Visitor.ts'

export abstract class DecisionManager implements IDecisionManager {
  protected _config: IFlagshipConfig;
  protected _panic = false;
  protected _httpClient: IHttpClient;

  public get config ():IFlagshipConfig {
    return this._config
  }

  // eslint-disable-next-line accessor-pairs
  protected set panic (v: boolean) {
    this._panic = v
  }

  public constructor (httpClient: IHttpClient, config: IFlagshipConfig) {
    this._config = config
    this._httpClient = httpClient
  }

  abstract getCampaignsModificationsAsync(
    visitor: Visitor
  ): Promise<Map<string, Modification>>;

  public isPanic (): boolean {
    return this._panic
  }
}
