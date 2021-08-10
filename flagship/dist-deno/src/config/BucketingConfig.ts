import { REQUEST_TIME_OUT } from '../enum/index.ts'
import { DecisionMode, FlagshipConfig, IFlagshipConfig } from './FlagshipConfig.ts'

export class BucketingConfig extends FlagshipConfig {
  public constructor (param?: Omit<IFlagshipConfig, 'decisionMode'>) {
    super({ ...param, decisionMode: DecisionMode.BUCKETING })
    if (param) {
      const { pollingInterval } = param
      this.pollingInterval = pollingInterval ?? REQUEST_TIME_OUT
    } else {
      this.pollingInterval = REQUEST_TIME_OUT
    }
  }
}
