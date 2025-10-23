import { DecisionMode } from './DecisionMode';
import { IFlagshipConfig } from './IFlagshipConfig';

export interface IDecisionApiConfig extends Omit<IFlagshipConfig, 'pollingInterval'|'isQAModeEnabled'|'accountSettings'>{
    decisionMode?: DecisionMode.DECISION_API,
  }
