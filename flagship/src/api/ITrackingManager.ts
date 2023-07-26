import { Troubleshooting } from '../hit/Troubleshooting'
import { ITrackingManagerCommon } from './ITrackingManagerCommon'

export interface ITrackingManager extends ITrackingManagerCommon {

    startBatchingLoop():void

    stopBatchingLoop():void

    sendBatch():Promise<void>

    addTroubleshootingHit(hit: Troubleshooting): Promise<void>

    sendAnalyticsHit(hit: Troubleshooting): Promise<void>

  }
