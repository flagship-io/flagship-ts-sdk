import { IEdgeConfig } from './IEdgeConfig.ts'
import { DecisionMode } from './DecisionMode.ts'
import { FlagshipConfig } from './FlagshipConfig.ts'

export class EdgeConfig extends FlagshipConfig {
  public constructor (param?: Omit<IEdgeConfig, 'decisionMode'>) {
    super({ ...param, decisionMode: DecisionMode.BUCKETING_EDGE })
  }
}
