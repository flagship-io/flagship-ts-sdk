import { DEFAULT_POLLING_INTERVAL } from '../enum/index'
import { DecisionMode, FlagshipConfig, IFlagshipConfig } from './FlagshipConfig'

export class BucketingConfig extends FlagshipConfig {
  public constructor (param?: Omit<IFlagshipConfig, 'decisionMode'>) {
    super({ ...param, decisionMode: DecisionMode.BUCKETING })

    this.pollingInterval = param?.pollingInterval ?? DEFAULT_POLLING_INTERVAL
    this.onBucketingFail = param?.onBucketingFail
    this.onBucketingSuccess = param?.onBucketingSuccess
    this.onBucketingUpdated = param?.onBucketingUpdated
  }
}
