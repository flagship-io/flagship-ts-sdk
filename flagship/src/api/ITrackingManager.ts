import { UsageHit } from '../hit/UsageHit'
import { Troubleshooting } from '../hit/Troubleshooting'
import { ITrackingManagerCommon } from './ITrackingManagerCommon'

export interface ITrackingManager extends ITrackingManagerCommon {

    startBatchingLoop():void

    stopBatchingLoop():void

    sendBatch():Promise<void>

    sendTroubleshootingHit(hit: Troubleshooting): Promise<void>

    addTroubleshootingHit(hit: Troubleshooting): Promise<void>

    sendUsageHit(hit: UsageHit): Promise<void>

  }
