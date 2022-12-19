import { DecisionMode, FlagshipConfig, IFlagshipConfig } from './FlagshipConfig.ts'

export class EdgeConfig extends FlagshipConfig {
  public constructor (param?: Omit<IFlagshipConfig, 'decisionMode'>) {
    super({ ...param, decisionMode: DecisionMode.EDGE })
  }
}
