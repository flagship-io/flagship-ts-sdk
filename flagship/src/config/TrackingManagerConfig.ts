import { DEFAULT_BATCH_LENGTH, DEFAULT_TIME_INTERVAL, BatchStrategy } from '../enum/index'

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

    autoScale?: boolean
}

export class TrackingManagerConfig implements ITrackingManagerConfig {
private _batchIntervals : number;
private _batchLength : number;
private _batchStrategy : BatchStrategy;
private _autoScale? : boolean;

public constructor (param?: ITrackingManagerConfig) {
  this._batchIntervals = param?.batchIntervals || DEFAULT_TIME_INTERVAL
  this._batchLength = param?.batchLength || DEFAULT_BATCH_LENGTH
  this._batchStrategy = param?.batchStrategy || BatchStrategy.CONTINUOUS_CACHING
  this._autoScale = param?.autoScale
}

public get autoScale () : boolean|undefined {
  return this._autoScale
}

public set autoScale (v : boolean|undefined) {
  this._autoScale = v
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
