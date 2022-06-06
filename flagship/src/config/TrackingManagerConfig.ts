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
private _batchIntervals? : number;
private _batchLength? : number;
private _batchStrategy? : BatchStrategy;

public constructor (param: ITrackingManagerConfig) {
  const { batchIntervals, batchLength, batchStrategy } = param
  this.batchIntervals = batchIntervals || DEFAULT_TIME_INTERVAL
  this.batchLength = batchLength || DEFAULT_BATCH_LENGTH
  this._batchStrategy = batchStrategy || BatchStrategy.BATCHING_WITH_CONTINUOUS_CACHING_STRATEGY
}

public get batchIntervals () : number|undefined {
  return this._batchIntervals
}

public set batchIntervals (v : number|undefined) {
  this._batchIntervals = v
}

public get batchLength () : number|undefined {
  return this._batchLength
}

public set batchLength (v : number|undefined) {
  this._batchLength = v
}

public get batchStrategy () : BatchStrategy|undefined {
  return this._batchStrategy
}
}
