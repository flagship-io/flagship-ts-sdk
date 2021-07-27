import { IFlagshipConfig } from './FlagshipConfig';
import { IDecisionManager } from '../decision/IDecisionManager';
import { ITrackingManager } from '../api/TrackingManagerAbstract';
export interface IConfigManager {
    config: IFlagshipConfig;
    decisionManager: IDecisionManager;
    trackingManager: ITrackingManager;
}
export declare class ConfigManager implements IConfigManager {
    private _config;
    private _decisionManager;
    private _trackingManager;
    constructor(config: IFlagshipConfig, decisionManager: IDecisionManager, trackingManager: ITrackingManager);
    get config(): IFlagshipConfig;
    set config(value: IFlagshipConfig);
    get decisionManager(): IDecisionManager;
    set decisionManager(value: IDecisionManager);
    get trackingManager(): ITrackingManager;
    set trackingManager(value: ITrackingManager);
}
