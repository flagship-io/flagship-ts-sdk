import { IFlagshipConfig } from '../config/IFlagshipConfig.ts'
import { HitAbstract } from '../hit/HitAbstract.ts'
import { Activate } from '../hit/Activate.ts'
import { TroubleshootingData } from '../types.ts'

export interface ITrackingManagerCommon {
    config:IFlagshipConfig

    troubleshootingData?:TroubleshootingData | 'started'

    addHit(hit: HitAbstract): Promise<void>

    activateFlag (hit: Activate): Promise<void>
  }
