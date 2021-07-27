import { IDecisionManager } from './IDecisionManager';
import { Modification } from '../model/Modification';
import { IFlagshipConfig } from '../config/FlagshipConfig';
import { IHttpClient } from '../utils/httpClient';
import { Visitor } from '../visitor/Visitor';
import { CampaignDTO } from './api/models';
export declare abstract class DecisionManager implements IDecisionManager {
    protected _config: IFlagshipConfig;
    protected _panic: boolean;
    protected _httpClient: IHttpClient;
    get config(): IFlagshipConfig;
    protected set panic(v: boolean);
    constructor(httpClient: IHttpClient, config: IFlagshipConfig);
    abstract getModifications(campaigns: CampaignDTO[]): Map<string, Modification>;
    abstract getCampaignsAsync(visitor: Visitor): Promise<CampaignDTO[]>;
    abstract getCampaignsModificationsAsync(visitor: Visitor): Promise<Map<string, Modification>>;
    isPanic(): boolean;
}
