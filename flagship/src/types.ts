import { CampaignDTO } from './decision/api/models'
import { HitType } from './enum/index'
import { IEvent, IItem, IPage, IScreen, ITransaction, HitShape, IHitAbstract } from './hit/index'

export type modificationsRequested<T> = {
    key: string,
    defaultValue: T,
    activate? :boolean
  }

export type primitive=string | number | boolean

export type { HitShape }
export type IHit = Omit<IPage, 'createdAt'|'visitorId'|'anonymousId'|'ds'> | Omit<IScreen, 'createdAt'|'visitorId'|'anonymousId'|'ds'> | Omit<IEvent, 'createdAt'|'visitorId'|'anonymousId'|'ds'> | Omit<IItem, 'createdAt'|'visitorId'|'anonymousId'|'ds'> | Omit<ITransaction, 'createdAt'|'visitorId'|'anonymousId'|'ds'>

export type FlagDTO= {
  key: string;
  campaignId: string;
  campaignName: string
  variationGroupId: string;
  variationGroupName: string
  variationId: string;
  variationName: string
  isReference?: boolean;
  campaignType?: string;
  slug?:string|null;
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

export type InternalHitType = HitType|'BATCH'|'ACTIVATE'|'MONITORING'|'SEGMENT'

export type HitCacheDTO ={
  version: number,
  data: {
      visitorId: string,
      anonymousId?: string|null,
      type: InternalHitType,
      time: number,
      content:IHitAbstract
  }
}

export type VisitorCacheDTO = {
  version: number,
  data: {
    visitorId: string,
    anonymousId: string|null,
    consent?: boolean,
    context?: Record<string, primitive>,
    assignmentsHistory?: Record<string, string>,
    campaigns?: Array<{
        slug?:string|null
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

export interface IFlagMetadata{
  campaignId:string
  campaignName:string
  variationGroupId:string
  variationGroupName:string
  variationId: string
  variationName: string
  isReference: boolean
  campaignType: string
  slug?:string|null
}

export interface IExposedFlag {
  key: string
  value: unknown
  defaultValue: unknown
  metadata: IFlagMetadata
}

export interface IExposedVisitor{
  id: string
  anonymousId?:string|null
  context: Record<string, primitive>
}

export type OnVisitorExposed ={
  exposedVisitor: IExposedVisitor
  fromFlag: IExposedFlag
}

export type UserExposureInfo = {
  flagData: {
    key: string
    value: unknown
    metadata: IFlagMetadata
  },
  visitorData: {
    visitorId: string
    anonymousId: string|null
    context: Record<string, primitive>
  }
 }

export type ThirdPartySegment = {
  visitor_id: string,
  segment: string,
  value: string,
  expiration: number,
  partner: string
}
