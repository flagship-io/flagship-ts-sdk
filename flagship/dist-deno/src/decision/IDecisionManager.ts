import { IFlagshipConfig } from '../config/index.ts'
import { FlagshipStatus } from '../enum/index.ts'
import { Modification } from '../types.ts'
import { VisitorAbstract } from '../visitor/VisitorAbstract.ts'
import { CampaignDTO } from './api/models.ts'

export interface IDecisionManager {
  statusChangedCallback(func:(status: FlagshipStatus)=>void):void

  isPanic(): boolean

  getModifications (campaigns: Array<CampaignDTO>):Map<string, Modification>

  getCampaignsAsync (visitor: VisitorAbstract):Promise<CampaignDTO[]>

  getCampaignsModificationsAsync(
    visitor: VisitorAbstract,
  ): Promise<Map<string, Modification>>

  config:IFlagshipConfig
}
