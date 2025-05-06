import { Flagship } from './main/Flagship.ts';

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
globalThis.__fsWebpackIsDeno__ = true;

export { Flagship } from './main/Flagship.ts';
export { DecisionApiConfig, DecisionMode } from './config/index.ts';
export type { IFlagshipConfig } from './config/index.ts';
export type {
  IEvent, IItem, IPage, IScreen, ITransaction
} from './hit/index';
export { EventCategory } from './hit/index.ts';
export {
  FSSdkStatus, LogLevel, HitType, CacheStrategy, FSFetchReasons, FSFetchStatus, FSFlagStatus
} from './enum/index.ts';
export * from './enum/FlagshipContext.ts';
export * from './types.ts';
export { Visitor } from './visitor/index.ts';
export type { IVisitorCacheImplementation } from './cache/IVisitorCacheImplementation.ts';
export type { IHitCacheImplementation } from './cache/IHitCacheImplementation.ts';
export type { IFlagshipLogManager } from './utils/FlagshipLogManager.ts';
export type { BucketingDTO } from './decision/api/bucketingDTO.ts';

export * from './flag/index.ts';

export default Flagship;
