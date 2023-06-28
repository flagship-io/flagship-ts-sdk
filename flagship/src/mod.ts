import { Flagship } from './main/Flagship'

export { Flagship } from './main/Flagship'
export { DecisionApiConfig, DecisionMode } from './config/index'
export type { IFlagshipConfig } from './config/index'
export type { IEvent, IItem, IPage, IScreen, ITransaction } from './hit/index'
export { Event, EventCategory, Item, Page, Screen, Transaction, HitAbstract } from './hit/index'
export { FlagshipStatus, LogLevel, HitType, CacheStrategy, VisitorStatus } from './enum/index'
export * from './enum/FlagshipContext'
export * from './types'
export { Visitor } from './visitor/index'
export type { IVisitorCacheImplementation } from './cache/IVisitorCacheImplementation'
export type { IHitCacheImplementation } from './cache/IHitCacheImplementation'
export type { IFlagshipLogManager } from './utils/FlagshipLogManager'
export type { BucketingDTO } from './decision/api/bucketingDTO'
export type { CampaignDTO } from './decision/api/models'

export * from './flag/index'

export default Flagship
