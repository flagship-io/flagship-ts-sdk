import { BucketingDTO } from '../decision/api/bucketingDTO'
import { DecisionMode } from './DecisionMode'
import { IFlagshipConfig } from './IFlagshipConfig'

export interface IEdgeConfig extends IFlagshipConfig{
    decisionMode: DecisionMode.BUCKETING_EDGE,
    /**
    * This is a set of flag data provided to avoid the SDK to have an empty cache during the first initialization.
    */
    initialBucketing: BucketingDTO
  }
