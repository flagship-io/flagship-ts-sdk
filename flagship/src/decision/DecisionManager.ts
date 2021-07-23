import { IDecisionManager } from './IDecisionManager'
import { Modification } from '../model/Modification'
import { IFlagshipConfig } from '../config/FlagshipConfig'
import { IHttpClient } from '../utils/httpClient'
import { Visitor } from '../visitor/Visitor'
import { CampaignDTO } from './api/models'

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

  abstract getModifications (campaigns: CampaignDTO[]): Map<string, Modification>

  abstract getCampaignsAsync(visitor: Visitor): Promise<CampaignDTO[]>

  abstract getCampaignsModificationsAsync(
    visitor: Visitor
  ): Promise<Map<string, Modification>>;

  public isPanic (): boolean {
    return this._panic
  }
}
