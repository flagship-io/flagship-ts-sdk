import { FlagshipConfig, IFlagshipConfig } from './FlagshipConfig';
export declare class BucketingConfig extends FlagshipConfig {
    constructor(param?: Omit<IFlagshipConfig, 'decisionMode'>);
}
