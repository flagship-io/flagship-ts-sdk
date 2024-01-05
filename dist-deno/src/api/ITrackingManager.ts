import { Analytic } from '../hit/Analytic.ts'
import { Troubleshooting } from '../hit/Troubleshooting.ts'
import { ITrackingManagerCommon } from './ITrackingManagerCommon.ts'

export interface ITrackingManager extends ITrackingManagerCommon {

    startBatchingLoop():void

    stopBatchingLoop():void

    sendBatch():Promise<void>

    sendTroubleshootingHit(hit: Troubleshooting): Promise<void>

    sendAnalyticsHit(hit: Analytic): Promise<void>

  }
