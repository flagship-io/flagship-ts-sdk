import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { HitAbstract } from '../hit/HitAbstract'
import { Activate } from '../hit/Activate'
import { Troubleshooting } from '../hit/Troubleshooting'
import { TroubleshootingData } from '../types'

export interface ITrackingManagerCommon {
    config:IFlagshipConfig

    troubleshootingData?:TroubleshootingData | 'started'

    addHit(hit: HitAbstract): Promise<void>

    addTroubleshootingHit(hit: Troubleshooting): Promise<void>

    activateFlag (hit: Activate): Promise<void>
  }
