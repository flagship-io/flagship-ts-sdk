import { DecisionMode, FlagshipConfig, IFlagshipConfig } from './FlagshipConfig.ts'

export class DecisionApiConfig extends FlagshipConfig {
  public constructor (param?: Omit<IFlagshipConfig, 'decisionMode'>) {
    super({ ...param, decisionMode: DecisionMode.DECISION_API })
  }
}
