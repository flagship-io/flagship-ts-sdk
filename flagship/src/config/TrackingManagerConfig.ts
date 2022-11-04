import { BatchStrategy, DEFAULT_SERVER_TIME_INTERVAL, DEFAULT_BROWSER_TIME_INTERVAL, DEFAULT_BROWSER_POOL_MAX_SIZE, DEFAULT_SERVER_POOL_MAX_SIZE } from '../enum/index'
import { isBrowser } from '../utils/utils'

export interface ITrackingManagerConfig {
    /**
     * Define the time intervals the SDK will use to send tracking batches.
     */
    batchIntervals?: number
    /**
     * Define the maximum number of tracking hit that each batch can contain.
     */
    poolMaxSize?: number

    batchStrategy?: BatchStrategy
}

export class TrackingManagerConfig implements ITrackingManagerConfig {
  private _batchIntervals! : number
  private _poolMaxSize! : number
  private _batchStrategy : BatchStrategy

  public constructor (param?: ITrackingManagerConfig) {
    this.batchIntervals = param?.batchIntervals
    this.poolMaxSize = param?.poolMaxSize
    this._batchStrategy = param?.batchStrategy || isBrowser() ? BatchStrategy.CONTINUOUS_CACHING : BatchStrategy.PERIODIC_CACHING
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

  public get batchStrategy () : BatchStrategy {
    return this._batchStrategy
  }
}
