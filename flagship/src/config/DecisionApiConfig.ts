import { IDecisionApiConfig } from './IDecisionApiConfig';
import { DecisionMode } from './DecisionMode';
import { FlagshipConfig } from './FlagshipConfig';

export class DecisionApiConfig extends FlagshipConfig {
  public constructor(param?: Omit<IDecisionApiConfig, 'decisionMode'>) {
    super({
      ...param,
      decisionMode: DecisionMode.DECISION_API
    });
  }
}
