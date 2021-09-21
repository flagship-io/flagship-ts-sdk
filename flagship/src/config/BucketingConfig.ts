import { REQUEST_TIME_OUT } from '../enum/index'
import { DecisionMode, FlagshipConfig, IFlagshipConfig } from './FlagshipConfig'

export class BucketingConfig extends FlagshipConfig {
  public constructor (param?: Omit<IFlagshipConfig, 'decisionMode'>) {
    super({ ...param, decisionMode: DecisionMode.BUCKETING })

    this.pollingInterval = param?.pollingInterval ?? REQUEST_TIME_OUT
    this.onBucketingFail = param?.onBucketingFail
    this.onBucketingSuccess = param?.onBucketingSuccess
    this.onBucketingUpdated = param?.onBucketingUpdated
  }
}
