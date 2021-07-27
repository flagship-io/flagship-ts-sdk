import { Modification } from '../model/Modification.ts'
import { Visitor } from '../visitor/Visitor.ts'
import { CampaignDTO } from './api/models.ts'

export interface IDecisionManager {
  isPanic(): boolean

  getModifications (campaigns: Array<CampaignDTO>):Map<string, Modification>

  getCampaignsAsync (visitor: Visitor):Promise<CampaignDTO[]>

  getCampaignsModificationsAsync(
    visitor: Visitor,
  ): Promise<Map<string, Modification>>
}
