import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { HitAbstract } from '../hit/HitAbstract'
import { Activate } from '../hit/Activate'

export interface ITrackingManagerCommon {
    config:IFlagshipConfig

    addHit(hit: HitAbstract): Promise<void>

    activateFlag (hit: Activate): Promise<void>
  }
