import { IFlagshipConfig } from '../config/index'
import { FlagshipStatus } from '../enum/index'
import { FlagDTO, Troubleshooting } from '../types'
import { VisitorAbstract } from '../visitor/VisitorAbstract'
import { CampaignDTO } from './api/models'

export interface IDecisionManager {
  statusChangedCallback(func:(status: FlagshipStatus)=>void):void

  isPanic(): boolean

  getModifications (campaigns: Array<CampaignDTO>):Map<string, FlagDTO>

  getCampaignsAsync (visitor: VisitorAbstract):Promise<CampaignDTO[]|null>

  config:IFlagshipConfig

  troubleshooting?: Troubleshooting

  lastBucketingTimestamp?: string
}
