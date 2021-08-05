import { DecisionManager } from './DecisionManager';
import { CampaignDTO } from './api/models';
import { Modification } from '../model/Modification';
import { VisitorAbstract } from '../visitor/VisitorAbstract';
export declare class ApiManager extends DecisionManager {
    getCampaignsAsync(visitor: VisitorAbstract): Promise<CampaignDTO[]>;
    getModifications(campaigns: Array<CampaignDTO>): Map<string, Modification>;
    getCampaignsModificationsAsync(visitor: VisitorAbstract): Promise<Map<string, Modification>>;
}
