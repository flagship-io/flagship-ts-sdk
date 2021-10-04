import { CampaignDTO } from './decision/api/models'
import { IEvent, IItem, IPage, IScreen, ITransaction } from './hit/index'

export type modificationsRequested<T> = {
    key: string,
    defaultValue: T,
    activate? :boolean
  }

export type primitive=string | number | boolean

export type IHit = IPage | IScreen | IEvent | IItem | ITransaction

export type Modification= {
  key: string;
  campaignId: string;
  variationGroupId: string;
  variationId: string;
  isReference: boolean;
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

export type NewVisitor={
  /**
   * Unique visitor identifier.
   */
  visitorId?:string
  isAuthenticated?: boolean
  /**
   * visitor context
   */
  context?: Record<string, primitive>
  hasConsented?:boolean,

   initialCampaigns?: CampaignDTO[]
   initialModifications?: Map<string, Modification>|Modification[]

}
