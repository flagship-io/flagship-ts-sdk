import { DecisionManager } from './DecisionManager';
import { CampaignDTO } from './api/models';
import { Modification } from '../model/Modification';
import { Visitor } from '../visitor/Visitor';
export declare class ApiManager extends DecisionManager {
    getCampaignsAsync(visitor: Visitor): Promise<CampaignDTO[]>;
    getModifications(campaigns: Array<CampaignDTO>): Map<string, Modification>;
    getCampaignsModificationsAsync(visitor: Visitor): Promise<Map<string, Modification>>;
}
