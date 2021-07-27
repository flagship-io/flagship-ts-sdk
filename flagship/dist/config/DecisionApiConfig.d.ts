import { FlagshipConfig, IFlagshipConfig } from './FlagshipConfig';
export declare class DecisionApiConfig extends FlagshipConfig {
    constructor(param?: Omit<IFlagshipConfig, 'decisionMode'>);
}
