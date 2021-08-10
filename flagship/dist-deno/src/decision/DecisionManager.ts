import { IDecisionManager } from './IDecisionManager.ts'
import { Modification } from '../model/Modification.ts'
import { IFlagshipConfig } from '../config/FlagshipConfig.ts'
import { IHttpClient } from '../utils/httpClient.ts'
import { CampaignDTO } from './api/models.ts'
import { VisitorAbstract } from '../visitor/VisitorAbstract.ts'

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
        console.log('campaigns', error)
        reject(error)
      })
    })
  }

  public isPanic (): boolean {
    return this._panic
  }
}
