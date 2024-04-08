import { DecisionMode } from './DecisionMode'
import { IFlagshipConfig } from './IFlagshipConfig'

export interface IDecisionApiConfig extends Omit<IFlagshipConfig, 'pollingInterval'|'isQAModeEnabled'>{
    decisionMode?: DecisionMode.DECISION_API,
  }
