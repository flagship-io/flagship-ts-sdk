import { DecisionManager } from './DecisionManager'
import { CampaignDTO } from './api/models'
import { VisitorAbstract } from '../visitor/VisitorAbstract'

export class ApiManager extends DecisionManager {
  public async getCampaignsAsync (visitor: VisitorAbstract): Promise<CampaignDTO[]|null> {
    return this.getDecisionApiCampaignsAsync(visitor)
  }
}
