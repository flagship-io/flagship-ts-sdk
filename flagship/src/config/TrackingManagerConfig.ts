import { DEFAULT_BATCH_LENGTH, DEFAULT_TIME_INTERVAL } from '../enum'
import { BatchStrategy } from '../enum/BatchStrategy'

export interface ITrackingManagerConfig {
    /**
     * Define the time intervals the SDK will use to send tracking batches.
     */
    batchIntervals?: number
    /**
     * Define the maximum number of tracking hit that each batch can contain.
     */
    batchLength?: number

    batchStrategy?: BatchStrategy
}

export class TrackingManagerConfig implements ITrackingManagerConfig {
private _batchIntervals : number;
private _batchLength : number;
private _batchStrategy : BatchStrategy;

public constructor (param?: ITrackingManagerConfig) {
  this._batchIntervals = param?.batchIntervals || DEFAULT_TIME_INTERVAL
  this._batchLength = param?.batchLength || DEFAULT_BATCH_LENGTH
  this._batchStrategy = param?.batchStrategy || BatchStrategy.BATCHING_WITH_CONTINUOUS_CACHING_STRATEGY
}

public get batchIntervals () : number {
  return this._batchIntervals
}

public set batchIntervals (v : number) {
  this._batchIntervals = v
}

public get batchLength () : number {
  return this._batchLength
}

public set batchLength (v : number) {
  this._batchLength = v
}

public get batchStrategy () : BatchStrategy {
  return this._batchStrategy
}
}
