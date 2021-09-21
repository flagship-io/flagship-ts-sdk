import { IFlagshipConfig } from '../config/index'
import { FlagshipStatus } from '../enum/index'
import { Modification } from '../model/Modification'
import { VisitorAbstract } from '../visitor/VisitorAbstract'
import { CampaignDTO } from './api/models'

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
