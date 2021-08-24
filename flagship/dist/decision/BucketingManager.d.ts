import { IFlagshipConfig } from '../config/index';
import { IHttpClient } from '../utils/httpClient';
import { MurmurHash } from '../utils/MurmurHash';
import { VisitorAbstract } from '../visitor/VisitorAbstract';
import { CampaignDTO } from './api/models';
import { DecisionManager } from './DecisionManager';
export declare class BucketingManager extends DecisionManager {
    private _bucketingContent;
    private _lastModified;
    private _isPooling;
    private _murmurHash;
    private _isFirstPooling;
    constructor(httpClient: IHttpClient, config: IFlagshipConfig, murmurHash: MurmurHash);
    private initStartPolling;
    private finishLoop;
    startPolling(): Promise<void>;
    stopPolling(): void;
    private sendContext;
    getCampaignsAsync(visitor: VisitorAbstract): Promise<CampaignDTO[]>;
    private getVisitorCampaigns;
    private getVariation;
    private isMatchTargeting;
    private checkAndTargeting;
    private testOperator;
}
