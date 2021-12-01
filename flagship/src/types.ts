import { CampaignDTO } from './decision/api/models'
import { HitType } from './enum/index'
import { IEvent, IItem, IPage, IScreen, ITransaction, HitShape } from './hit/index'

export type modificationsRequested<T> = {
    key: string,
    defaultValue: T,
    activate? :boolean
  }

export type primitive=string | number | boolean

export type { HitShape }
export type IHit = IPage | IScreen | IEvent | IItem | ITransaction

export type Modification= {
  key: string;
  campaignId: string;
  variationGroupId: string;
  variationId: string;
  isReference?: boolean;
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

   /**
    * If true The newly created visitor instance won't be saved and will simply be returned otherwise
    * the  newly created visitor instance will be returned and saved into the Flagship
    *
    * Note: will be default true on server-side and false on client-side
    */
   isNewInstance?:boolean

}

export type HitCache ={
  version: number,
  data: {
      visitorId: string,
      anonymousId: string|null,
      type: HitType|'BATCH'|'ACTIVATE',
      time: number
  }
}

export type HitCacheSaveDTO = HitCache & {
  data: {
      content: Record<string, unknown>
  }
}

export type HitCacheLookupDTO = HitCache & {
  data:{
      content?:IHit|Modification
  }
}

export type VisitorSaveCacheDTO = {
  version: number,
  data: {
    visitorId: string,
    anonymousId: string|null,
    consent: boolean,
    context: Record<string, primitive>,
    campaigns: Array<{
      campaignId: string,
      variationGroupId: string,
      variationId: string,
      isReference?:boolean,
      type: string,
      activated: boolean,
      flags: Record<string, unknown>
    }>
}
}

export type VisitorLookupCacheDTO = {
  version: number,
  data: {
    visitorId: string,
    anonymousId: string|null,
    consent?: boolean,
    context?: Record<string, primitive>,
    campaigns?: Array<{
        campaignId: string,
        variationGroupId: string,
        variationId: string,
        isReference?:boolean
        type: string,
        activated?: boolean,
        flags?: Record<string, unknown>
      }>
}
}
