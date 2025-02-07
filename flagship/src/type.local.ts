import { IFlagshipConfig } from './config/IFlagshipConfig'
import { ISharedActionTracking } from './sharedFeature/ISharedActionTracking'
import { FlagDTO, VisitorProfile } from './types'

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

export enum SharedAction {
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
  action: SharedAction;
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
