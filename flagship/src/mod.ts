import { Flagship } from './main/Flagship'

declare const globalThis: {
  __fsWebpackIsBrowser__: boolean;
  __fsWebpackIsNode__: boolean;
  __fsWebpackIsReactNative__: boolean;
  __fsWebpackIsEdgeWorker__: boolean;
  __fsWebpackIsDeno__: boolean;
};

globalThis.__fsWebpackIsBrowser__ = false;
globalThis.__fsWebpackIsNode__ = false;
globalThis.__fsWebpackIsReactNative__ = false;
globalThis.__fsWebpackIsEdgeWorker__ = false;
globalThis.__fsWebpackIsDeno__ = true

export { Flagship } from './main/Flagship'
export { DecisionApiConfig, DecisionMode } from './config/index'
export type { IFlagshipConfig } from './config/index'
export type { IEvent, IItem, IPage, IScreen, ITransaction } from './hit/index'
export { EventCategory } from './hit/index'
export { FSSdkStatus, LogLevel, HitType, CacheStrategy, FSFetchReasons, FSFetchStatus, FSFlagStatus } from './enum/index'
export * from './enum/FlagshipContext'
export * from './types'
export { Visitor } from './visitor/index'
export type { IVisitorCacheImplementation } from './cache/IVisitorCacheImplementation'
export type { IHitCacheImplementation } from './cache/IHitCacheImplementation'
export type { IFlagshipLogManager } from './utils/FlagshipLogManager'
export type { BucketingDTO } from './decision/api/bucketingDTO'

export * from './flag/index'

export default Flagship
