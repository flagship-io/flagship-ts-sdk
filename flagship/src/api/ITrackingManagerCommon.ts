import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { HitAbstract } from '../hit/HitAbstract'
import { Activate } from '../hit/Activate'
import { Monitoring } from '../hit/Monitoring'
import { Troubleshooting } from '../types'

export interface ITrackingManagerCommon {
    config:IFlagshipConfig

    troubleshooting?:Troubleshooting | 'started'

    addHit(hit: HitAbstract): Promise<void>

    addMonitoringHit(hit: Monitoring): Promise<void>

    activateFlag (hit: Activate): Promise<void>
  }
