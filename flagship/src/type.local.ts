import { FlagDTO } from './types'

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

export enum SdkMethodBehavior {
  NONE = 'NONE',
  FLAG_NOT_FOUND_WARNING = 'FLAG_NOT_FOUND_WARNING',
  FLAG_VALUE_NOT_CALLED_WARNING = 'FLAG_VALUE_NOT_CALLED_WARNING',
  FLAG_TYPE_WARNING = 'FLAG_TYPE_WARNING',
  VISITOR_ID_ERROR = 'VISITOR_ID_ERROR',
  VISITOR_ALREADY_AUTHENTICATED_WARNING = 'VISITOR_ALREADY_AUTHENTICATED_WARNING',
  VISITOR_NOT_AUTHENTICATED_WARNING = 'VISITOR_NOT_AUTHENTICATED_WARNING',
  HIT_TYPE_ERROR = 'HIT_TYPE_ERROR',
  HIT_NOT_SENT_ERROR = 'HIT_NOT_SENT_ERROR',
  FETCH_FLAGS_FROM_CACHE = 'FETCH_FLAGS_FROM_CACHE',
  FETCH_FLAGS_ERROR = 'FETCH_FLAGS_ERROR',
  CONTEXT_NULL_ERROR = 'CONTEXT_NULL_ERROR',
}
