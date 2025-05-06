import { DecisionMode } from './DecisionMode.ts';
import { IFlagshipConfig } from './IFlagshipConfig.ts';

export interface IBucketingConfig extends Omit<IFlagshipConfig, 'isQAModeEnabled'>{
    decisionMode: DecisionMode.BUCKETING,

    /**
     * f true, will fetch the visitor's segment from [universal data connector](https://developers.abtasty.com/docs/data/universal-data-connector) each time [fetchFlags](#fetching-flags) is called and append those segments in the visitor context
     */
    fetchThirdPartyData?: boolean
    /**
     * Specify delay between two bucketing polling. Default is 2s.
     *
     * Note: If 0 is given then it should poll only once at start time.
     */
    pollingInterval?: number
  }
