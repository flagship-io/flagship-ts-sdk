import { Flagship } from './main/Flagship'

export { Flagship } from './main/Flagship'
export { DecisionApiConfig, DecisionMode } from './config/index'
export type { IFlagshipConfig } from './config/index'
export type { IEvent, IItem, IPage, IScreen, ITransaction, IHitCacheImplementation } from './hit/index'
export { Event, EventCategory, Item, Page, Screen, Transaction, HitAbstract } from './hit/index'
export { FlagshipStatus, LogLevel, HitType } from './enum/index'
export * from './enum/FlagshipContext'
export * from './types'
export { Visitor } from './visitor/index'
export type { IVisitorCacheImplementation } from './visitor/index'
export type { IFlagshipLogManager } from './utils/FlagshipLogManager'
export type { BucketingDTO } from './decision/api/bucketingDTO'
export type { CampaignDTO } from './decision/api/models'

export default Flagship
