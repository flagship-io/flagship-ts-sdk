import { CacheStrategy, DEFAULT_SERVER_TIME_INTERVAL, DEFAULT_BROWSER_TIME_INTERVAL, DEFAULT_BROWSER_POOL_MAX_SIZE, DEFAULT_SERVER_POOL_MAX_SIZE } from '../enum/index'
import { isBrowser } from '../utils/utils'

export interface ITrackingManagerConfig {
    /**
     * Define a regular interval in seconds to trigger batch processing
     *
     * Note:
     * - The process will batch all hits from the pool whether poolMaxSize is reached or not
     * - Must be between 1sec and 10800s (3hours). Otherwise default value will be applied
     */
    batchIntervals?: number

    /**
     * Define the minimum number of hits the pool must reach to automatically batch all hits in the pool and send it
     *
     * Note:
     * - Must be greater than 5 otherwise default value will be used
     * - Having a large poolMaxSize can lead to performance issues
     */
    poolMaxSize?: number

    /**
     * Define the strategy that will be used for hit caching
     */
    cacheStrategy?: CacheStrategy
}

export class TrackingManagerConfig implements ITrackingManagerConfig {
  private _batchIntervals! : number
  private _poolMaxSize! : number
  private _batchStrategy : CacheStrategy

  public constructor (param?: ITrackingManagerConfig) {
    this.batchIntervals = param?.batchIntervals
    this.poolMaxSize = param?.poolMaxSize
    this._batchStrategy = param?.cacheStrategy || (isBrowser() ? CacheStrategy.CONTINUOUS_CACHING : CacheStrategy.PERIODIC_CACHING)
  }

  public get batchIntervals () : number|undefined {
    return this._batchIntervals
  }

  public set batchIntervals (v : number|undefined) {
    if (typeof v !== 'number' || v < 1 || v > 10800) {
      v = isBrowser() ? DEFAULT_BROWSER_TIME_INTERVAL : DEFAULT_SERVER_TIME_INTERVAL
    }
    this._batchIntervals = v
  }

  public get poolMaxSize () : number|undefined {
    return this._poolMaxSize
  }

  public set poolMaxSize (v : number|undefined) {
    if (typeof v !== 'number' || v < 5) {
      v = isBrowser() ? DEFAULT_BROWSER_POOL_MAX_SIZE : DEFAULT_SERVER_POOL_MAX_SIZE
    }
    this._poolMaxSize = v
  }

  public get cacheStrategy () : CacheStrategy {
    return this._batchStrategy
  }
}
