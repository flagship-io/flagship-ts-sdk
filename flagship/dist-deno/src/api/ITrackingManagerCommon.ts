import { IFlagshipConfig } from '../config/IFlagshipConfig.ts'
import { HitAbstract } from '../hit/HitAbstract.ts'
import { Activate } from '../hit/Activate.ts'

export interface ITrackingManagerCommon {
    config:IFlagshipConfig

    addHit(hit: HitAbstract): Promise<void>

    activateFlag (hit: Activate): Promise<void>
  }
