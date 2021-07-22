import { Modification } from '../model/Modification'
import { Visitor } from '../visitor/Visitor'
import { CampaignDTO } from './api/models'

export interface IDecisionManager {
  isPanic(): boolean

  getModifications (campaigns: Array<CampaignDTO>):Map<string, Modification>

  getCampaignsAsync (visitor: Visitor):Promise<CampaignDTO[]>

  getCampaignsModificationsAsync(
    visitor: Visitor,
  ): Promise<Map<string, Modification>>
}
