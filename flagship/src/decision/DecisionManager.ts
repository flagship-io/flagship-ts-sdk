import { IDecisionManager } from './IDecisionManager'
import { IFlagshipConfig } from '../config/FlagshipConfig'
import { IHttpClient } from '../utils/HttpClient'
import { CampaignDTO } from './api/models'
import { VisitorAbstract } from '../visitor/VisitorAbstract'
import { FlagshipStatus } from '../enum/index'
import { logError } from '../utils/utils'
import { FlagDTO } from '../types'

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

  public getModifications (campaigns: Array<CampaignDTO>):Map<string, FlagDTO> {
    const modifications = new Map<string, FlagDTO>()
    campaigns.forEach((campaign) => {
      const object = campaign.variation.modifications.value
      for (const key in object) {
        const value = object[key]
        modifications.set(
          key,
          {
            key,
            campaignId: campaign.id,
            variationGroupId: campaign.variationGroupId,
            variationId: campaign.variation.id,
            isReference: campaign.variation.reference,
            value
          }
        )
      }
    })
    return modifications
  }

  abstract getCampaignsAsync(visitor: VisitorAbstract): Promise<CampaignDTO[]>

  public async getCampaignsModificationsAsync (visitor: VisitorAbstract): Promise<Map<string, FlagDTO>> {
    return this.getCampaignsAsync(visitor).then(campaigns => {
      return this.getModifications(campaigns)
    }).catch((error) => {
      logError(this.config, error.message || error, 'getCampaignsModificationsAsync')
      return new Map<string, FlagDTO>()
    })
  }

  public isPanic (): boolean {
    return this._panic
  }
}
