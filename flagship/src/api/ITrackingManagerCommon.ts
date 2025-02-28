import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { HitAbstract } from '../hit/HitAbstract'
import { TroubleshootingData } from '../types'
import { ActivateConstructorParam } from '../type.local'

export interface ITrackingManagerCommon {
    config:IFlagshipConfig

    troubleshootingData?:TroubleshootingData | 'started'

    addHit(hit: HitAbstract): Promise<void>

    activateFlag (hit: ActivateConstructorParam): Promise<void>

}
