import { DecisionManager } from './DecisionManager.ts'
import { CampaignDTO } from './api/models.ts'
import { VisitorAbstract } from '../visitor/VisitorAbstract.ts'

export class ApiManager extends DecisionManager {
  public async getCampaignsAsync (visitor: VisitorAbstract): Promise<CampaignDTO[]|null> {
    return this.getDecisionApiCampaignsAsync(visitor)
  }
}
