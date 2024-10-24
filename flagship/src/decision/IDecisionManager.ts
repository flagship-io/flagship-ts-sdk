import { CampaignDTO } from '../types'
import { VisitorAbstract } from '../visitor/VisitorAbstract'

export interface IDecisionManager {
  getCampaignsAsync(visitor: VisitorAbstract): Promise<CampaignDTO[]>;
}
