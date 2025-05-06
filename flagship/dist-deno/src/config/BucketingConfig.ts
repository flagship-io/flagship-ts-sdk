import { DEFAULT_POLLING_INTERVAL } from '../enum/index.ts';
import { DecisionMode } from './DecisionMode.ts';
import { FlagshipConfig } from './FlagshipConfig.ts';
import { IBucketingConfig } from './IBucketingConfig.ts';

export class BucketingConfig extends FlagshipConfig {
  public constructor(param?: Omit<IBucketingConfig, 'decisionMode'>) {
    super({
      ...param,
      decisionMode: DecisionMode.BUCKETING
    });

    this.pollingInterval = param?.pollingInterval ?? DEFAULT_POLLING_INTERVAL;
    this.onBucketingUpdated = param?.onBucketingUpdated;
    this.fetchThirdPartyData = param?.fetchThirdPartyData;
  }
}
