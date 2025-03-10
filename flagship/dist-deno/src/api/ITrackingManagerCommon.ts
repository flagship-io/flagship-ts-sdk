import { IFlagshipConfig } from '../config/IFlagshipConfig.ts'
import { type HitAbstract } from '../hit/HitAbstract.ts'
import { TroubleshootingData } from '../types.ts'
import { ActivateConstructorParam } from '../type.local.ts'

export interface ITrackingManagerCommon {
    config:IFlagshipConfig

    troubleshootingData?:TroubleshootingData | 'started'

    addHit(hit: HitAbstract): Promise<void>

    activateFlag (hit: ActivateConstructorParam): Promise<void>

}
