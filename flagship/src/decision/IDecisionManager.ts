import { ITrackingManager } from '../api/ITrackingManager'
import { IFlagshipConfig } from '../config/index'
import { FlagshipStatus } from '../enum/index'
import { CampaignDTO, FlagDTO, TroubleshootingData } from '../types'
import { VisitorAbstract } from '../visitor/VisitorAbstract'

export interface IDecisionManager {
  statusChangedCallback(func:(status: FlagshipStatus)=>void):void

  isPanic(): boolean

  getModifications (campaigns: Array<CampaignDTO>):Map<string, FlagDTO>

  getCampaignsAsync (visitor: VisitorAbstract):Promise<CampaignDTO[]|null>

  config:IFlagshipConfig

  troubleshooting?: TroubleshootingData

  lastBucketingTimestamp?: string

  trackingManager : ITrackingManager
  flagshipInstanceId : string

}
