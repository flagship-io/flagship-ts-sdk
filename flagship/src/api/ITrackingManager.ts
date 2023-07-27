import { Troubleshooting } from '../hit/Troubleshooting'
import { ITrackingManagerCommon } from './ITrackingManagerCommon'

export interface ITrackingManager extends ITrackingManagerCommon {

    startBatchingLoop():void

    stopBatchingLoop():void

    sendBatch():Promise<void>

    sendTroubleshootingHit(hit: Troubleshooting): Promise<void>

  }
