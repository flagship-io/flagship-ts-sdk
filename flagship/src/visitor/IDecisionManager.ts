import { CampaignDTO } from '../types'
import { VisitorAbstract } from './VisitorAbstract'

export interface IDecisionManager {
    getCampaignsAsync(visitor: VisitorAbstract): Promise<CampaignDTO[]>;
}
