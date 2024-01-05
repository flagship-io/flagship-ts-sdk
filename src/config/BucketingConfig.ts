import { DEFAULT_POLLING_INTERVAL } from '../enum/index'
import { DecisionMode } from './DecisionMode'
import { FlagshipConfig } from './FlagshipConfig'
import { IBucketingConfig } from './IBucketingConfig'

export class BucketingConfig extends FlagshipConfig {
  public constructor (param?: Omit<IBucketingConfig, 'decisionMode'>) {
    super({ ...param, decisionMode: DecisionMode.BUCKETING })

    this.pollingInterval = param?.pollingInterval ?? DEFAULT_POLLING_INTERVAL
    this.onBucketingFail = param?.onBucketingFail
    this.onBucketingSuccess = param?.onBucketingSuccess
    this.onBucketingUpdated = param?.onBucketingUpdated
    this.fetchThirdPartyData = param?.fetchThirdPartyData
  }
}
