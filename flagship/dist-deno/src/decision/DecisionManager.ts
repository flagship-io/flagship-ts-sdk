import { IDecisionManager } from './IDecisionManager.ts'
import { Modification } from '../model/Modification.ts'
import { IFlagshipConfig } from '../config/FlagshipConfig.ts'
import { IHttpClient } from '../utils/HttpClient.ts'
import { CampaignDTO } from './api/models.ts'
import { VisitorAbstract } from '../visitor/VisitorAbstract.ts'
import { FlagshipStatus } from '../enum/index.ts'
import { logError } from '../utils/utils.ts'

export abstract class DecisionManager implements IDecisionManager {
  protected _config: IFlagshipConfig;
  protected _panic = false;
  protected _httpClient: IHttpClient;
  private _statusChangedCallback! : (status: FlagshipStatus)=>void;

  public get config ():IFlagshipConfig {
    return this._config
  }

  // eslint-disable-next-line accessor-pairs
  protected set panic (v: boolean) {
    this.updateFlagshipStatus(v ? FlagshipStatus.READY_PANIC_ON : FlagshipStatus.READY)
    this._panic = v
  }

  public statusChangedCallback (v : (status: FlagshipStatus)=>void):void {
    this._statusChangedCallback = v
  }

  public constructor (httpClient: IHttpClient, config: IFlagshipConfig) {
    this._config = config
    this._httpClient = httpClient
  }

  protected updateFlagshipStatus (v:FlagshipStatus):void {
    if (typeof this._statusChangedCallback === 'function' && this._statusChangedCallback) {
      this._statusChangedCallback(v)
    }
  }

  public getModifications (campaigns: Array<CampaignDTO>):Map<string, Modification> {
    const modifications = new Map<string, Modification>()
    campaigns.forEach((campaign) => {
      const object = campaign.variation.modifications.value
      for (const key in object) {
        const value = object[key]
        modifications.set(
          key,
          new Modification(
            key,
            campaign.id,
            campaign.variationGroupId,
            campaign.variation.id,
            campaign.variation.reference,
            value
          )
        )
      }
    })
    return modifications
  }

  abstract getCampaignsAsync(visitor: VisitorAbstract): Promise<CampaignDTO[]>

  public async getCampaignsModificationsAsync (visitor: VisitorAbstract): Promise<Map<string, Modification>> {
    return this.getCampaignsAsync(visitor).then(campaigns => {
      return this.getModifications(campaigns)
    }).catch((error) => {
      logError(this.config, error.message || error, 'getCampaignsModificationsAsync')
      return new Map<string, Modification>()
    })
  }

  public isPanic (): boolean {
    return this._panic
  }
}
