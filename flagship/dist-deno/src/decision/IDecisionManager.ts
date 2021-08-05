import { Modification } from '../model/Modification.ts'
import { VisitorAbstract } from '../visitor/VisitorAbstract.ts'
import { CampaignDTO } from './api/models.ts'

export interface IDecisionManager {
  isPanic(): boolean

  getModifications (campaigns: Array<CampaignDTO>):Map<string, Modification>

  getCampaignsAsync (visitor: VisitorAbstract):Promise<CampaignDTO[]>

  getCampaignsModificationsAsync(
    visitor: VisitorAbstract,
  ): Promise<Map<string, Modification>>
}
