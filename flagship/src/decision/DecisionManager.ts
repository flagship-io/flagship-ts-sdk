import { IDecisionManager } from './IDecisionManager'
import { Modification } from '../model/Modification'
import { IFlagshipConfig } from '../config/FlagshipConfig'
import { IHttpClient } from '../utils/httpClient'
import { CampaignDTO } from './api/models'
import { VisitorAbstract } from '../visitor/VisitorAbstract'
import { FlagshipStatus } from '../enum/index'

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
    if (v) {
      this.updateFlagshipStatus(FlagshipStatus.READY_PANIC_ON)
    }
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
    return new Promise((resolve, reject) => {
      this.getCampaignsAsync(visitor).then(campaigns => {
        resolve(this.getModifications(campaigns))
      }).catch(error => {
        reject(error)
      })
    })
  }

  public isPanic (): boolean {
    return this._panic
  }
}
