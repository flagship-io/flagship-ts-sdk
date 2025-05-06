import { FSFetchReasons } from './enum/FSFetchReasons.ts';
import { FSFetchStatus } from './enum/FSFetchStatus.ts';
import { HitType } from './enum/index.ts';
import { IEvent,
  IItem,
  IPage,
  IScreen,
  ITransaction,
  IHitAbstract } from './hit/index.ts';

export type modificationsRequested<T> = {
  key: string;
  defaultValue: T;
  activate?: boolean;
};

export type primitive = string | number | boolean;

export type ModificationsDTO = {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
};

export type VariationDTO = {
  id: string;
  name?: string;
  reference?: boolean;
  modifications: ModificationsDTO;
};

export type CampaignDTO = {
  id: string;
  name?: string;
  slug?: string | null;
  variationGroupId: string;
  variationGroupName?: string;
  variation: VariationDTO;
  type?: string;
};

export type ForcedVariation = {
  campaignId: string;
  variationGroupId: string;
  variationId: string;
  originalVariationId?: string;
};

export type ExposedVariation = {
  campaignId: string;
  variationGroupId: string;
  variationId: string;
  originalVariationId: string;
};

export type IHit =
  | Omit<IPage, 'createdAt' | 'visitorId' | 'anonymousId' | 'ds' | 'qaMode'|'isActionTrackingHit'>
  | Omit<IScreen, 'createdAt' | 'visitorId' | 'anonymousId' | 'ds' | 'qaMode'|'isActionTrackingHit'>
  | Omit<IEvent, 'createdAt' | 'visitorId' | 'anonymousId' | 'ds' | 'qaMode'|'isActionTrackingHit'>
  | Omit<IItem, 'createdAt' | 'visitorId' | 'anonymousId' | 'ds' | 'qaMode'|'isActionTrackingHit'>
  | Omit<
      ITransaction,
      'createdAt' | 'visitorId' | 'anonymousId' | 'ds' | 'qaMode'|'isActionTrackingHit'
    >;

export type FlagDTO = {
  key: string;
  campaignId: string;
  campaignName: string;
  variationGroupId: string;
  variationGroupName: string;
  variationId: string;
  variationName: string;
  isReference?: boolean;
  campaignType?: string;
  slug?: string | null;
  originalVariationId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
};

export type SerializedFlagMetadata = {
  key: string;
  campaignId: string;
  campaignName: string;
  variationGroupId: string;
  variationGroupName: string;
  variationId: string;
  variationName: string;
  isReference?: boolean;
  campaignType?: string;
  slug?: string | null;
  hex: string;
};

/**
 * Represents the status of visitor fetch for flag data.
 */
export type FlagsStatus = {
  /**
   * The new status of the flags fetch.
   */
  status: FSFetchStatus;
  /**
   * The reason for the status change.
   */
  reason: FSFetchReasons;
};

/**
 * Represents a new visitor.
 */
export type NewVisitor = {
  /**
   * Optional - Unique visitor identifier.
   *
   * Note: If not set, it will be generated automatically.
   * In client-side, if not specified, the id will either be automatically generated or will be the visitor id from the previous session (if `reuseVisitorIds` is set to true).
   */
  visitorId?: string;

  /**
   * Specifies if the visitor is authenticated or anonymous for experience continuity.
   */
  isAuthenticated?: boolean;

  /**
   * The visitor context is a dataset key/value that defines the current visitor.
   * It is sent to Flagship for targeting purposes (use-case assignment) and to enrich reporting with Context Filters.
   * Context keys must be strings, and the value types must be one of the following: number, boolean, or string.
   */
  context?: Record<string, primitive>;

  /**
   * Required - Specifies if the visitor has consented for personal data usage.
   * When set to false, some features will be deactivated and the cache will be deactivated and cleared.
   */
  hasConsented: boolean;

  /**
   * An object containing the data received when fetching the Flagship decision API (decisionMode="API").
   * Providing this property avoids the SDK from having an empty cache during first initialization.
   */
  initialCampaigns?: CampaignDTO[];

  /**
   * A set of flag data provided to avoid the SDK from having an empty cache during the first initialization.
   */
  initialFlagsData?: SerializedFlagMetadata[];

  /**
   * If true, the newly created visitor instance will be returned and saved into Flagship.
   * Otherwise,  the newly created visitor instance won't be saved and will simply be returned.
   * By default, it is false on server-side and true on client-side.
   */
  shouldSaveInstance?: boolean;

  /**
   * Callback function that will be called when the fetch flags status changes.
   *
   * @param newStatus - The new status of the flags fetch.
   * @param reason - The reason for the status change.
   */
  onFlagsStatusChanged?: ({ status, reason }: FlagsStatus) => void;
};

export type InternalHitType =
  | HitType
  | 'BATCH'
  | 'ACTIVATE'
  | 'MONITORING'
  | 'SEGMENT'
  | 'TROUBLESHOOTING'
  | 'USAGE';

export type HitCacheDTO = {
  version: number;
  data: {
    visitorId: string;
    anonymousId?: string | null;
    type: InternalHitType;
    time: number;
    content: IHitAbstract;
  };
};

export type EAIScore = {
  eai: {
      eas: string;
  }
}

export type VisitorCacheDTO = {
  version: number;
  data: {
    visitorId: string;
    anonymousId: string | null;
    consent?: boolean;
    context?: Record<string, primitive>;
    eAIScore?: EAIScore,
    isEAIDataCollected?: boolean;
    assignmentsHistory?: Record<string, string>;
    campaigns?: Array<{
      slug?: string | null;
      campaignId: string;
      variationGroupId: string;
      variationId: string;
      isReference?: boolean;
      type: string;
      activated?: boolean;
      flags?: Record<string, unknown>;
    }>;
  };
};

export interface IFSFlagMetadata {
  campaignId: string;
  campaignName: string;
  variationGroupId: string;
  variationGroupName: string;
  variationId: string;
  variationName: string;
  isReference: boolean;
  campaignType: string;
  slug?: string | null;
}

export interface IExposedFlag {
  key: string;
  value: unknown;
  defaultValue: unknown;
  metadata: IFSFlagMetadata;
}

export interface IExposedVisitor {
  id: string;
  anonymousId?: string | null;
  context: Record<string, primitive>;
}

export type OnVisitorExposed = {
  exposedVisitor: IExposedVisitor;
  fromFlag: IExposedFlag;
};

export type TroubleshootingData = {
  startDate: Date;
  endDate: Date;
  traffic: number;
  timezone: string;
};

export type sdkInitialData = {
  instanceId: string;
  lastInitializationTimestamp: string;
  initialCampaigns?: CampaignDTO[];
  initialFlagsData?: SerializedFlagMetadata[];
  usingCustomHitCache?: boolean;
  usingCustomVisitorCache?: boolean;
};

export enum TroubleshootingLabel {
  VISITOR_SEND_HIT = 'VISITOR_SEND_HIT',
  VISITOR_FETCH_CAMPAIGNS_ERROR = 'VISITOR_FETCH_CAMPAIGNS_ERROR',
  VISITOR_FETCH_CAMPAIGNS = 'VISITOR_FETCH_CAMPAIGNS',
  VISITOR_AUTHENTICATE = 'VISITOR_AUTHENTICATE',
  VISITOR_UNAUTHENTICATE = 'VISITOR_UNAUTHENTICATE',
  VISITOR_EXPOSED_FLAG_NOT_FOUND = 'VISITOR_EXPOSED_FLAG_NOT_FOUND',
  FLAG_VALUE_NOT_CALLED = 'FLAG_VALUE_NOT_CALLED',
  GET_FLAG_VALUE_FLAG_NOT_FOUND = 'GET_FLAG_VALUE_FLAG_NOT_FOUND',
  GET_FLAG_METADATA_TYPE_WARNING = 'GET_FLAG_METADATA_TYPE_WARNING',
  GET_FLAG_VALUE_TYPE_WARNING = 'GET_FLAG_VALUE_TYPE_WARNING',
  VISITOR_EXPOSED_TYPE_WARNING = 'VISITOR_EXPOSED_TYPE_WARNING',
  VISITOR_SEND_ACTIVATE = 'VISITOR_SEND_ACTIVATE',
  GET_CAMPAIGNS_ROUTE_RESPONSE_ERROR = 'GET_CAMPAIGNS_ROUTE_RESPONSE_ERROR',
  GET_CAMPAIGNS_ROUTE_RESPONSE = 'GET_CAMPAIGNS_ROUTE_RESPONSE',
  SDK_BUCKETING_FILE = 'SDK_BUCKETING_FILE',
  SEND_ACTIVATE_HIT_ROUTE_ERROR = 'SEND_ACTIVATE_HIT_ROUTE_ERROR',
  SEND_BATCH_HIT_ROUTE_RESPONSE_ERROR = 'SEND_BATCH_HIT_ROUTE_RESPONSE_ERROR',
  SEND_HIT_ROUTE_ERROR = 'SEND_HIT_ROUTE_ERROR',
  SDK_BUCKETING_FILE_ERROR = 'SDK_BUCKETING_FILE_ERROR',
  SDK_CONFIG = 'SDK_CONFIG',
  ACCOUNT_SETTINGS = 'ACCOUNT_SETTINGS',
  ACCOUNT_SETTINGS_ERROR = 'ACCOUNT_SETTINGS_ERROR',
  EMOTION_AI_SCORE = 'EMOTION_EAI_SCORE',
  EMOTION_AI_SCORE_FROM_LOCAL_CACHE = 'EMOTION_AI_SCORE_FROM_LOCAL_CACHE',
  EMOTION_AI_SCORE_ERROR = 'EMOTION_EAI_SCORE_ERROR',
  EMOTION_AI_VISITOR_EVENT = 'EMOTION_AI_VISITOR_EVENT',
  EMOTION_AI_VISITOR_EVENT_ERROR = 'EMOTION_AI_VISITOR_EVENT_ERROR',
  EMOTION_AI_PAGE_VIEW = 'EMOTION_AI_PAGE_VIEW',
  EMOTION_AI_PAGE_VIEW_ERROR = 'EMOTION_AI_PAGE_VIEW_ERROR',
  EMOTION_AI_START_COLLECTING = 'EMOTION_AI_START_COLLECTING',
  EMOTION_AI_STOP_COLLECTING = 'EMOTION_AI_STOP_COLLECTING',
  EMOTION_AI_START_SCORING = 'EMOTION_AI_START_SCORING',
  EMOTION_AI_SCORING_FAILED = 'EMOTION_AI_SCORING_FAILED',
  EMOTION_AI_SCORING_SUCCESS = 'EMOTION_AI_SCORING_SUCCESS',

}

export type ThirdPartySegment = {
  visitor_id: string;
  segment: string;
  value: string;
  expiration: number;
  partner: string;
};

export enum VisitorCacheStatus {
  NONE = 'NONE',
  ANONYMOUS_ID_CACHE = 'ANONYMOUS_ID_CACHE',
  VISITOR_ID_CACHE = 'VISITOR_ID_CACHE',
  VISITOR_ID_CACHE_WITH_ANONYMOUS_ID_CACHE = 'VISITOR_ID_CACHE_WITH_ANONYMOUS_ID_CACHE',
}
export type onFsForcedVariationsType = (arg: {
  forcedVariations: ForcedVariation[];
}) => void;

export type VisitorVariations = {
  variationId: string;
  variationGroupId: string;
  campaignId: string;
};

export type FsVariationToForce = {
  campaignId: string;
  campaignName: string;
  campaignType: string;
  CampaignSlug?: string | null;
  variationGroupId: string;
  variationGroupName?: string;
  variation: VariationDTO;
};

export type SdkInfoType = {
  name: 'ReactJS' | 'React-Native' | 'Deno' | 'TypeScript';
  version: string;
};

export interface Targetings {
  operator: string;
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}
export interface VariationGroupDTO {
  id: string;
  name?: string;
  targeting: {
    targetingGroups: Array<{
      targetings: Array<Targetings>;
    }>;
  };
  variations: Array<{
    id: string;
    name?: string;
    modifications: {
      type: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value: any;
    };
    allocation?: number;
    reference?: boolean;
  }>;
}

export type AccountSettings = {
  enabledXPC?: true;
  troubleshooting?: {
    startDate: string;
    endDate: string;
    traffic: number;
    timezone: string;
  };
  eaiCollectEnabled?: boolean;
  eaiActivationEnabled?: boolean;
}

export interface BucketingDTO {
  panic?: boolean;
  campaigns?: Array<{
    id: string;
    name?: string;
    type: string;
    slug?: string | null;
    variationGroups: Array<VariationGroupDTO>;
  }>;
  accountSettings?: AccountSettings;
}

export type VisitorProfile={
  visitorId:string,
  anonymousId: string|null
  isClientSuppliedId?: boolean,
}

export enum ABTastyWebSDKPostMessageType {
  AB_TASTY_WEB_SDK_INITIALIZED = 'AB_TASTY_WEB_SDK_INITIALIZED',
}
