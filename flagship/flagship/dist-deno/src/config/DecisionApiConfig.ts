import { IDecisionApiConfig } from './IDecisionApiConfig.ts'
import { DecisionMode } from './DecisionMode.ts'
import { FlagshipConfig } from './FlagshipConfig.ts'

export class DecisionApiConfig extends FlagshipConfig {
  public constructor (param?: Omit<IDecisionApiConfig, 'decisionMode'>) {
    super({ ...param, decisionMode: DecisionMode.DECISION_API })
  }
}
