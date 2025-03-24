
import { BucketingDTO } from '../types.ts'
import { DecisionMode } from './DecisionMode.ts'
import { IFlagshipConfig } from './IFlagshipConfig.ts'

export interface IEdgeConfig extends IFlagshipConfig{
    decisionMode: DecisionMode.BUCKETING_EDGE,
    /**
    * This is a set of flag data provided to avoid the SDK to have an empty cache during the first initialization.
    */
    initialBucketing: BucketingDTO
  }
