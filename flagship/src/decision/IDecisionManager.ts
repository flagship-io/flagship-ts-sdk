import { Modification } from '../model/Modification'
import { VisitorAbstract } from '../visitor/VisitorAbstract'
import { CampaignDTO } from './api/models'

export interface IDecisionManager {
  isPanic(): boolean

  getModifications (campaigns: Array<CampaignDTO>):Map<string, Modification>

  getCampaignsAsync (visitor: VisitorAbstract):Promise<CampaignDTO[]>

  getCampaignsModificationsAsync(
    visitor: VisitorAbstract,
  ): Promise<Map<string, Modification>>
}
