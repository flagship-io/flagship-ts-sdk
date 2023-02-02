import { DecisionMode } from './DecisionMode'
import { IFlagshipConfig } from './IFlagshipConfig'

export interface IBucketingConfig extends IFlagshipConfig{
    decisionMode: DecisionMode.BUCKETING,
    /**
     * Specify delay between two bucketing polling. Default is 2s.
     *
     * Note: If 0 is given then it should poll only once at start time.
     */
    pollingInterval?: number
  }
