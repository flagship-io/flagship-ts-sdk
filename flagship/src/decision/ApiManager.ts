import { DecisionManager } from './DecisionManager';
import { VisitorAbstract } from '../visitor/VisitorAbstract';
import { CampaignDTO } from '../types';

export class ApiManager extends DecisionManager {
  public async getCampaignsAsync(visitor: VisitorAbstract): Promise<CampaignDTO[]|null> {
    return this.getDecisionApiCampaignsAsync(visitor);
  }
}
