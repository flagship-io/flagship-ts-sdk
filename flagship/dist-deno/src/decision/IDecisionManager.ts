import { ITrackingManager } from '../api/ITrackingManager.ts'
import { IFlagshipConfig } from '../config/index.ts'
import { FSSdkStatus } from '../enum/index.ts'
import { CampaignDTO, FlagDTO, TroubleshootingData } from '../types.ts'
import { VisitorAbstract } from '../visitor/VisitorAbstract.ts'

export interface IDecisionManager {
  statusChangedCallback(func:(status: FSSdkStatus)=>void):void

  isPanic(): boolean

  getModifications (campaigns: Array<CampaignDTO>):Map<string, FlagDTO>

  getCampaignsAsync (visitor: VisitorAbstract):Promise<CampaignDTO[]|null>

  config:IFlagshipConfig

  troubleshooting?: TroubleshootingData

  lastBucketingTimestamp?: string

  trackingManager : ITrackingManager
  flagshipInstanceId : string

}
