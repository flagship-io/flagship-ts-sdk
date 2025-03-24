import { type UsageHit } from '../hit/UsageHit.ts'
import { type Troubleshooting } from '../hit/Troubleshooting.ts'
import { ITrackingManagerCommon } from './ITrackingManagerCommon.ts'

export interface ITrackingManager extends ITrackingManagerCommon {

    startBatchingLoop():void

    stopBatchingLoop():void

    sendBatch():Promise<void>

    sendTroubleshootingHit(hit: Troubleshooting): Promise<void>

    addTroubleshootingHit(hit: Troubleshooting): Promise<void>

    sendUsageHit(hit: UsageHit): Promise<void>

    initTroubleshootingHit?: Troubleshooting
  }
