import { Flagship } from './main/Flagship';
import { IPageView as FullIPageView } from './emotionAI/hit/IPageView';
import { IVisitorEvent as FullIVisitorEvent } from './emotionAI/hit/IVisitorEvent';

export { Flagship } from './main/Flagship';
export { DecisionApiConfig, DecisionMode } from './config/index';
export type { IFlagshipConfig } from './config/index';
export type {
  IEvent, IItem, IPage, IScreen, ITransaction
} from './hit/index';
export { EventCategory } from './hit/index';
export {
  FSSdkStatus, LogLevel, HitType, CacheStrategy, FSFetchReasons, FSFetchStatus, FSFlagStatus
} from './enum/index';
export * from './enum/FlagshipContext';
export * from './types';
export { Visitor } from './visitor/index';
export type { IVisitorCacheImplementation } from './cache/IVisitorCacheImplementation';
export type { IHitCacheImplementation } from './cache/IHitCacheImplementation';
export type { IFlagshipLogManager } from './utils/FlagshipLogManager';

export type IPageView = Omit<FullIPageView, 'toApiKeys'>
export type IVisitorEvent = Omit<FullIVisitorEvent, 'toApiKeys'>

export * from './flag/index';

export default Flagship;
