import { IFlagshipConfig } from './config/IFlagshipConfig';
import { type Flagship } from './main/Flagship';
import { EventDataFromIframe } from './qaAssistant/type';
import { ISdkApiV1 } from './sdkApi/v1/ISdkApiV1';
import { ISharedActionTracking } from './sharedFeature/ISharedActionTracking';
import { FlagDTO,
  FsVariationToForce,
  IFSFlagMetadata,
  InternalHitType,
  primitive,
  VisitorProfile,
  VisitorVariations } from './types';
import { type IHttpClient } from './utils/HttpClient';

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
};

export interface IVisitorProfileCache {
  saveVisitorProfile(visitorProfile?: VisitorProfile): void;
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
};

export interface SharedActionPayload {
  action: SharedActionSource;
  data: ActionTrackingData[];
  nonce: string; // Unique nonce for ensuring message authenticity
  timestamp: number;
}

export type SdkApiParam = {
  sharedActionTracking?: ISharedActionTracking;
};

export type SharedActionTrackingParam = {
  sdkConfig: IFlagshipConfig;
};

export type ConstructorParam = {
  httpClient: IHttpClient;
  sdkConfig: IFlagshipConfig;
  eAIConfig: EAIConfig | undefined;
};

export interface IHitAbstract {
  visitorId: string;
  anonymousId?: string | null;
  ds?: string;
  type: InternalHitType;
  userIp?: string;
  screenResolution?: string;
  locale?: string;
  sessionNumber?: string;
  createdAt: number;
  qaMode?: boolean;
  isActionTrackingHit?: boolean;
}

export interface IActivate extends IHitAbstract {
  variationGroupId: string;
  variationId: string;
  flagKey: string;
  flagValue: unknown;
  flagDefaultValue: unknown;
  flagMetadata: IFSFlagMetadata;
  visitorContext: Record<string, primitive>;
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

export type ActivateConstructorParam = Omit<
  IActivate,
  'type' | 'createdAt' | 'traffic'
>;


declare global {
  let __fsWebpackIsBrowser__: boolean;
  let __fsWebpackIsNode__: boolean;
  let __fsWebpackIsReactNative__: boolean;
  let __fsWebpackIsEdgeWorker__: boolean;
  let __fsWebpackIsDeno__: boolean;
  let __flagship_instance__: Flagship;
  interface Window {
    ABTastyQaAssistant?: Window;
    ABTastyWebSdk?: {
      envId?: string;
      internal?: ISdkApiV1;
    };
    ABTasty: {
      api: {
        internal: {
          /**
           * Generate a nonce for the action tracking.
           * @returns {string|undefined} The nonce or undefined if the consent is not given.
           */
          _getActionTrackingNonce(): string | undefined;

          _isByoidConfigured?:()=> boolean | undefined;
        };
        v1: {
          getValue(key: string): string | undefined;
        };
      };
    };
    __flagshipSdkOnPlatformChoiceLoaded?: (event: MessageEvent<EventDataFromIframe>) => void;
    __flagshipSdkOnKeyCombinationDown?: (event: KeyboardEvent) => void;
    __flagshipSdkOnKeyCombinationUp?: (event: KeyboardEvent) => void;
    __flagshipSdkOriginalPushState?: History['pushState'];
    __flagshipSdkOriginalReplaceState?: History['replaceState'];
    __flagshipSdkPopStateHandler?: (event: PopStateEvent) => void;
    __flagshipSdkQaAssistantMessageHandler?: (event: MessageEvent<EventDataFromIframe>) => void;
  }
}

export type VisitorVariationState = {
  forcedVariations?: Record<string, FsVariationToForce>;
  visitorVariations?: Record<string, VisitorVariations>;
  exposedVariations?: Record<string, VisitorVariations>;
  navigationDetected?: boolean;
  variationsForcedAllocation?: Record<string, FsVariationToForce>;
  variationsForcedUnallocation?: Record<string, FsVariationToForce>;
  shouldForceRender?: boolean;
};

export interface FlagshipGlobal {
      __flagship_instance__?: Flagship;
    }
