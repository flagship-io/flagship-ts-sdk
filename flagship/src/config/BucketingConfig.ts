import { REQUEST_TIME_OUT } from '../enum/index'
import { DecisionMode, FlagshipConfig, IFlagshipConfig } from './FlagshipConfig'

export class BucketingConfig extends FlagshipConfig {
  public constructor (param?: Omit<IFlagshipConfig, 'decisionMode'>) {
    super({ ...param, decisionMode: DecisionMode.BUCKETING })
    if (param) {
      const { pollingInterval, onBucketingFail, onBucketingSuccess, onBucketingUpdated } = param
      this.pollingInterval = pollingInterval ?? REQUEST_TIME_OUT
      this.onBucketingFail = onBucketingFail
      this.onBucketingSuccess = onBucketingSuccess
      this.onBucketingUpdated = onBucketingUpdated
    } else {
      this.pollingInterval = REQUEST_TIME_OUT
    }
  }
}
