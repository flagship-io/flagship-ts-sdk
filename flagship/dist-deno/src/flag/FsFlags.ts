import { FSFetchStatus } from '../enum/FSFetchStatus.ts';
import { FSFlagStatus } from '../enum/FSFlagStatus.ts';
import { IFSFlagMetadata } from '../types.ts';
import { VisitorDelegate } from '../visitor/index.ts';
import { FSFlagMetadata } from './FSFlagMetadata.ts';
import { IFSFlag } from './IFSFlag.ts';
import { forceVariation } from './forceVariation.ts';

export class FSFlag implements IFSFlag {
  private _visitor?:VisitorDelegate;
  private _key:string;
  private _defaultValue?:unknown;
  private hasGetValueBeenCalled = false;

  constructor(param: {key:string, visitor?:VisitorDelegate}) {
    const { key, visitor } = param;
    this._key = key;
    this._visitor = visitor;
  }

  exists():boolean {
    if (!this._visitor) {
      return false;
    }
    const flagDTO = this._visitor?.flagsData.get(this._key);
    const forcedFlagDTO = forceVariation({
      flagDTO,
      config: this._visitor.config,
      visitorVariationState: this._visitor.visitorVariationState
    });

    const flag = forcedFlagDTO || flagDTO;

    return !!(flag?.campaignId && flag?.variationId && flag?.variationGroupId);
  }

  get metadata():IFSFlagMetadata {
    if (!this._visitor) {
      return FSFlagMetadata.Empty();
    }

    const flagDTO = this._visitor.flagsData.get(this._key);
    const forcedFlagDTO = forceVariation({
      flagDTO,
      config: this._visitor.config,
      visitorVariationState: this._visitor.visitorVariationState
    });

    return this._visitor.getFlagMetadata({
      key: this._key,
      flag: forcedFlagDTO || flagDTO
    });
  }

  async visitorExposed() : Promise<void> {
    if (!this._visitor) {
      return;
    }

    const flagDTO = this._visitor.flagsData.get(this._key);
    const forcedFlagDTO = forceVariation({
      flagDTO,
      config: this._visitor.config,
      visitorVariationState: this._visitor.visitorVariationState
    });

    return this._visitor.visitorExposed({
      key: this._key,
      flag: forcedFlagDTO || flagDTO,
      defaultValue: this._defaultValue,
      hasGetValueBeenCalled: this.hasGetValueBeenCalled
    });
  }

  getValue <T>(defaultValue:T, visitorExposed = true) : T extends null ? unknown : T {
    this._defaultValue = defaultValue;
    this.hasGetValueBeenCalled = true;

    if (!this._visitor) {
      return defaultValue as T extends null ? unknown : T;
    }

    const flagDTO = this._visitor.flagsData.get(this._key);
    const forcedFlagDTO = forceVariation({
      flagDTO,
      config: this._visitor.config,
      visitorVariationState: this._visitor.visitorVariationState
    });

    const flag = forcedFlagDTO || flagDTO;

    this._visitor.sendExposedVariation(flag);

    return this._visitor.getFlagValue({
      key: this._key,
      defaultValue,
      flag,
      visitorExposed
    });
  }

  get status(): FSFlagStatus {
    if (this._visitor?.flagsStatus?.status === FSFetchStatus.PANIC) {
      return FSFlagStatus.PANIC;
    }
    if (!this.exists()) {
      return FSFlagStatus.NOT_FOUND;
    }
    if (this._visitor?.flagsStatus?.status === FSFetchStatus.FETCH_REQUIRED || this._visitor?.flagsStatus?.status === FSFetchStatus.FETCHING) {
      return FSFlagStatus.FETCH_REQUIRED;
    }

    return FSFlagStatus.FETCHED;
  }
}
