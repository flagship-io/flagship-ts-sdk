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
  VISITOR_EXPOSED_FLAG_NOT_FOUND = 'VISITOR_EXPOSED_FLAG_NOT_FOUND',
  FLAG_VALUE_NOT_CALLED = 'FLAG_VALUE_NOT_CALLED',
  GET_FLAG_VALUE_FLAG_NOT_FOUND = 'GET_FLAG_VALUE_FLAG_NOT_FOUND',
  GET_FLAG_METADATA_TYPE_WARNING = 'GET_FLAG_METADATA_TYPE_WARNING',
  GET_FLAG_VALUE_TYPE_WARNING = 'GET_FLAG_VALUE_TYPE_WARNING',
  VISITOR_EXPOSED_TYPE_WARNING = 'VISITOR_EXPOSED_TYPE_WARNING',
  VISITOR_AUTHENTICATE_VISITOR_ID_ERROR = 'VISITOR_AUTHENTICATE_VISITOR_ID_ERROR',
  VISITOR_ALREADY_AUTHENTICATE_WARNING = 'VISITOR_ALREADY_AUTHENTICATE_WARNING',
}
