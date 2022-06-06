import { IFlagshipConfig } from '../config/FlagshipConfig'
import { BatchStrategy } from '../enum/BatchStrategy'
import { HitAbstract } from '../hit'
import { IHttpClient } from '../utils/HttpClient'
import { CachingStrategyAbstract } from './CachingStrategyAbstract'
import { ContinuousCachingStrategy } from './ContinuousCachingStrategy'

export interface ITrackingManager {

  config:IFlagshipConfig

  addHit(hit: HitAbstract): Promise<void>

  addHits(hits: HitAbstract[]): Promise<void>
}

export abstract class TrackingManagerAbstract implements ITrackingManager {
  private _httpClient: IHttpClient;
  private _config: IFlagshipConfig;

  private _hitsPoolQueue: Map<string, HitAbstract>;

  protected strategy: CachingStrategyAbstract;

  constructor (httpClient: IHttpClient, config: IFlagshipConfig) {
    this._hitsPoolQueue = new Map<string, HitAbstract>()
    this._httpClient = httpClient
    this._config = config
    this.strategy = this.initStrategy()
  }

  initStrategy ():CachingStrategyAbstract {
    let strategy = new ContinuousCachingStrategy(this.config, this.httpClient, this._hitsPoolQueue)
    switch (this.config.trackingMangerConfig?.batchStrategy) {
      case BatchStrategy.NO_BATCHING_WITH_CONTINUOUS_CACHING_STRATEGY :
        strategy = new ContinuousCachingStrategy(this.config, this.httpClient, this._hitsPoolQueue)
        break
      case BatchStrategy.BATCHING_WITH_PERIODIC_CACHING_STRATEGY:
        strategy = new ContinuousCachingStrategy(this.config, this.httpClient, this._hitsPoolQueue)
        break
    }
    return strategy
  }

  public get httpClient ():IHttpClient {
    return this._httpClient
  }

  public get config ():IFlagshipConfig {
    return this._config
  }

  public abstract addHit(hit: HitAbstract): Promise<void>

  public abstract addHits(hits: HitAbstract[]): Promise<void>
}
