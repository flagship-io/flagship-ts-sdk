import { ITrackingManagerCommon } from './ITrackingManagerCommon.ts'

export interface ITrackingManager extends ITrackingManagerCommon {

    startBatchingLoop():void

    stopBatchingLoop():void

    sendBatch():Promise<void>

  }
