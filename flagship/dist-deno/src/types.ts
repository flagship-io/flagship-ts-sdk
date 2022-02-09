import { CampaignDTO } from './decision/api/models.ts'
import { HitType } from './enum/index.ts'
import { IEvent, IItem, IPage, IScreen, ITransaction, HitShape } from './hit/index.ts'

export type modificationsRequested<T> = {
    key: string,
    defaultValue: T,
    activate? :boolean
  }

export type primitive=string | number | boolean

export type { HitShape }
export type IHit = IPage | IScreen | IEvent | IItem | ITransaction

export type FlagDTO= {
  key: string;
  campaignId: string;
  variationGroupId: string;
  variationId: string;
  isReference?: boolean;
  campaignType?: string;
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

/**
 * @deprecated use FlagDTO instead
 */
export type Modification= FlagDTO

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
   /**
    * @deprecated use initialFlags instead
    */
   initialModifications?: Map<string, Modification>|Modification[]
   initialFlagsData?: Map<string, FlagDTO>|FlagDTO[]

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
