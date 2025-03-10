import { IFlagshipConfig } from './config/IFlagshipConfig.ts'
import { ISharedActionTracking } from './sharedFeature/ISharedActionTracking.ts'
import { FlagDTO, IFSFlagMetadata, InternalHitType, primitive, VisitorProfile } from './types.ts'
import { type IHttpClient } from './utils/HttpClient.ts'

export type VisitorExposedParam = {
    key: string;
    flag?: FlagDTO;
    defaultValue: unknown;
    hasGetValueBeenCalled: boolean;
  };

export type GetFlagValueParam<T> = {
    key: string;
    defaultValue: T;
    flag?: FlagDTO;
    visitorExposed?: boolean;
  };

export type GetFlagMetadataParam = {
    key: string;
    flag?: FlagDTO;
  };

export type EAIConfig = {
  eaiActivationEnabled: boolean;
  eaiCollectEnabled: boolean;
}

export interface IVisitorProfileCache {
  saveVisitorProfile(visitorProfile: VisitorProfile): void;
  loadVisitorProfile(): VisitorProfile | null;
}

export enum SharedActionSource {
  ABT_TAG_TRACK_ACTION = 'ABT_TAG_TRACK_ACTION',
  ABT_WEB_SDK_TRACK_ACTION = 'ABT_WEB_SDK_TRACK_ACTION',
}

export type ActionTrackingData = {
  ec: 'Action Tracking';
  ea: string; // Event name
  ev?: number; // event value
  el?: string; // event label
};

export type LocalActionTracking = {
  data: ActionTrackingData;
  visitorId: string;
  createdAt: number;
  anonymousId?: string | null;
}

export interface SharedActionPayload {
  action: SharedActionSource;
  data: ActionTrackingData[];
  nonce: string; // Unique nonce for ensuring message authenticity
  timestamp: number;
}

export type SdkApiParam = {
  sharedActionTracking?: ISharedActionTracking;
}

export type SharedActionTrackingParam = {
  sdkConfig: IFlagshipConfig;
}

declare global {
  let __fsWebpackIsBrowser__: boolean
  let __fsWebpackIsNode__: boolean
  let __fsWebpackIsReactNative__: boolean
  let __fsWebpackIsEdgeWorker__: boolean
  let __fsWebpackIsDeno__: boolean
}

export type ConstructorParam = {
  httpClient: IHttpClient;
  sdkConfig: IFlagshipConfig;
  eAIConfig: EAIConfig|undefined;
}

export interface IHitAbstract{
  visitorId:string
  anonymousId?: string|null
  ds?: string
  type: InternalHitType
  userIp?: string
  screenResolution?: string
  locale?: string
  sessionNumber?: string,
  createdAt:number,
  qaMode?: boolean,
  isActionTrackingHit?: boolean
}

export interface IActivate extends IHitAbstract{
    variationGroupId: string
    variationId: string
    flagKey: string
    flagValue: unknown
    flagDefaultValue: unknown
    flagMetadata: IFSFlagMetadata
    visitorContext: Record<string, primitive>
}

export enum ImportHitType {
  Event = 'Event',
  Item = 'Item',
  Page = 'Page',
  Screen = 'Screen',
  Transaction = 'Transaction',
  Segment = 'Segment',
  Activate = 'Activate',
  Troubleshooting = 'Troubleshooting',
  UsageHit = 'UsageHit',
  ActivateBatch = 'ActivateBatch',
  Batch = 'Batch',
  HitAbstract = 'HitAbstract',
  Diagnostic = 'Diagnostic',
}

export type ActivateConstructorParam = Omit<IActivate, 'type'|'createdAt'|'traffic'>
