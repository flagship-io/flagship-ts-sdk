import { DecisionMode } from './DecisionMode'
import { IFlagshipConfig } from './IFlagshipConfig'

export interface IDecisionApiConfig extends Omit<IFlagshipConfig, 'pollingInterval'>{
    decisionMode: DecisionMode.DECISION_API,
  }
