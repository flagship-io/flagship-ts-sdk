import { DecisionManager } from './DecisionManager.ts'
import { VisitorAbstract } from '../visitor/VisitorAbstract.ts'
import { CampaignDTO } from '../types.ts'

export class ApiManager extends DecisionManager {
  public async getCampaignsAsync (visitor: VisitorAbstract): Promise<CampaignDTO[]|null> {
    return this.getDecisionApiCampaignsAsync(visitor)
  }
}
