import { Flagship } from './main/Flagship.ts'

(globalThis as any).__fsWebpackIsBrowser__ = false;
(globalThis as any).__fsWebpackIsNode__ = false;
(globalThis as any).__fsWebpackIsReactNative__ = false;
(globalThis as any).__fsWebpackIsEdgeWorker__ = false;
(globalThis as any).__fsWebpackIsDeno__ = true

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
export type { BucketingDTO } from './decision/api/bucketingDTO.ts'

export * from './flag/index.ts'

export default Flagship
