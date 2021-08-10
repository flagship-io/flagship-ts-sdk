import { IDecisionManager } from './IDecisionManager';
import { Modification } from '../model/Modification';
import { IFlagshipConfig } from '../config/FlagshipConfig';
import { IHttpClient } from '../utils/httpClient';
import { CampaignDTO } from './api/models';
import { VisitorAbstract } from '../visitor/VisitorAbstract';
export declare abstract class DecisionManager implements IDecisionManager {
    protected _config: IFlagshipConfig;
    protected _panic: boolean;
    protected _httpClient: IHttpClient;
    get config(): IFlagshipConfig;
    protected set panic(v: boolean);
    constructor(httpClient: IHttpClient, config: IFlagshipConfig);
    getModifications(campaigns: Array<CampaignDTO>): Map<string, Modification>;
    abstract getCampaignsAsync(visitor: VisitorAbstract): Promise<CampaignDTO[]>;
    getCampaignsModificationsAsync(visitor: VisitorAbstract): Promise<Map<string, Modification>>;
    isPanic(): boolean;
}
