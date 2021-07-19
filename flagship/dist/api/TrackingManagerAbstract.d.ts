import { IFlagshipConfig } from '../config/FlagshipConfig';
import { HitAbstract } from '../hit/HitAbstract';
import { Modification } from '../model/Modification';
import { IHttpClient } from '../utils/httpClient';
import { Visitor } from '../visitor/Visitor';
export interface ITrackingManager {
    /**
     * Send to server that this user has seen this modification
     * @param visitor
     * @param modification
     */
    sendActive(visitor: Visitor, modification: Modification): Promise<void>;
    /**
     *Send a Hit to Flagship servers for reporting.
     * @param hit
     */
    sendHit(hit: HitAbstract): Promise<void>;
}
export declare abstract class TrackingManagerAbstract implements ITrackingManager {
    private _httpClient;
    private _config;
    constructor(httpClient: IHttpClient, config: IFlagshipConfig);
    get httpClient(): IHttpClient;
    get config(): IFlagshipConfig;
    abstract sendActive(visitor: Visitor, modification: Modification): Promise<void>;
    abstract sendHit(hit: HitAbstract): Promise<void>;
}
