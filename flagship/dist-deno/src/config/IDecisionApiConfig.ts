import { DecisionMode } from './DecisionMode.ts'
import { IFlagshipConfig } from './IFlagshipConfig.ts'

export interface IDecisionApiConfig extends Omit<IFlagshipConfig, 'pollingInterval'>{
    decisionMode?: DecisionMode.DECISION_API,
  }
