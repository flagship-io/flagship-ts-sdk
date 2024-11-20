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

export type EAIConfig = {
  eaiActivationEnabled: boolean;
  eaiCollectEnabled: boolean;
}

export type EAIScore = {
  eai: {
      eas: string;
  }
}
