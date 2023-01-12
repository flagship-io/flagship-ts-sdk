import { IEdgeConfig } from './IEdgeConfig'
import { DecisionMode } from './DecisionMode'
import { FlagshipConfig } from './FlagshipConfig'

export class EdgeConfig extends FlagshipConfig {
  public constructor (param?: Omit<IEdgeConfig, 'decisionMode'>) {
    super({ ...param, decisionMode: DecisionMode.BUCKETING_EDGE })
  }
}
