import { Flagship } from './main/Flagship.ts'
import { IPageView as FullIPageView } from './emotionAI/hit/IPageView.ts'
import { IVisitorEvent as FullIVisitorEvent } from './emotionAI/hit/IVisitorEvent.ts'

export { Flagship } from './main/Flagship.ts'
export { DecisionApiConfig, DecisionMode } from './config/index.ts'
export type { IFlagshipConfig } from './config/index.ts'
export type { IEvent, IItem, IPage, IScreen, ITransaction } from './hit/index.ts'
export { EventCategory } from './hit/index.ts'
export { FSSdkStatus, LogLevel, HitType, CacheStrategy, FSFetchReasons, FSFetchStatus, FSFlagStatus } from './enum/index.ts'
export * from './enum/FlagshipContext.ts'
export * from './types.ts'
export { Visitor } from './visitor/index.ts'
export type { IVisitorCacheImplementation } from './cache/IVisitorCacheImplementation.ts'
export type { IHitCacheImplementation } from './cache/IHitCacheImplementation.ts'
export type { IFlagshipLogManager } from './utils/FlagshipLogManager.ts'

export type IPageView = Omit<FullIPageView, 'toApiKeys'>
export type IVisitorEvent = Omit<FullIVisitorEvent, 'toApiKeys'>

export * from './flag/index.ts'

export default Flagship
