import { Flagship } from './main/Flagship.ts'

export { Flagship } from './main/Flagship.ts'
export { DecisionApiConfig, DecisionMode } from './config/index.ts'
export type { IFlagshipConfig } from './config/index.ts'
export type { IEvent, IItem, IPage, IScreen, ITransaction } from './hit/index.ts'
export { Event, EventCategory, Item, Page, Screen, Transaction, HitAbstract } from './hit/index.ts'
export { FlagshipStatus, LogLevel, HitType, CacheStrategy, FlagSynchStatus } from './enum/index.ts'
export * from './enum/FlagshipContext.ts'
export * from './types.ts'
export { Visitor } from './visitor/index.ts'
export type { IVisitorCacheImplementation } from './cache/IVisitorCacheImplementation.ts'
export type { IHitCacheImplementation } from './cache/IHitCacheImplementation.ts'
export type { IFlagshipLogManager } from './utils/FlagshipLogManager.ts'
export type { BucketingDTO } from './decision/api/bucketingDTO.ts'
export type { CampaignDTO } from './decision/api/models.ts'

export * from './flag/index.ts'

export default Flagship
