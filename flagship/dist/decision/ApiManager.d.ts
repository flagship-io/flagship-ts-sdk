import { DecisionManager } from './DecisionManager';
import { Modification } from '../model/Modification';
import { Visitor } from '../visitor/Visitor';
export declare class ApiManager extends DecisionManager {
    private getCampaignsAsync;
    private getModifications;
    getCampaignsModificationsAsync(visitor: Visitor): Promise<Map<string, Modification>>;
}
