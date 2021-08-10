import { DecisionManager } from './DecisionManager';
import { CampaignDTO } from './api/models';
import { VisitorAbstract } from '../visitor/VisitorAbstract';
export declare class ApiManager extends DecisionManager {
    getCampaignsAsync(visitor: VisitorAbstract): Promise<CampaignDTO[]>;
}
