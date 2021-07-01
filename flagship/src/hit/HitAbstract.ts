import { IFlagshipConfig } from "../config/FlagshipConfig.ts";
import {
  CUSTOMER_ENV_ID_API_ITEM,
  DS_API_ITEM,
  TYPE_ERROR,
  T_API_ITEM,
  VISITOR_ID_API_ITEM,
} from "../enum/FlagshipConstant.ts";
import { HitType } from "../enum/HitType.ts";
import { logError, sprintf } from "../utils/utils.ts";

export abstract class HitAbstract {
  private _visitorId!: string;
  private _config!: IFlagshipConfig;
  private _hitType: HitType;
  private _ds!: string;

  public get visitorId(): string {
    return this._visitorId;
  }
  public set visitorId(v: string) {
    this._visitorId = v;
  }

  public get ds(): string {
    return this._ds;
  }
  public set ds(v: string) {
    this._ds = v;
  }

  public get hitType(): HitType {
    return this._hitType;
  }
  public set hitType(v: HitType) {
    this._hitType = v;
  }

  public get config(): IFlagshipConfig {
    return this._config;
  }
  public set config(v: IFlagshipConfig) {
    this._config = v;
  }

  protected constructor(type: HitType) {
    this._hitType = type;
  }

  protected isNotEmptyString(value: unknown, itemName: string): boolean {
    if (!value || typeof value != "string") {
      logError(this.config, sprintf(TYPE_ERROR, "string"), itemName);
      return false;
    }
    return true;
  }

  protected isNumeric(value: unknown, itemName: string): boolean {
    if (!value || typeof value != "number") {
      logError(this.config, sprintf(TYPE_ERROR, "number"), itemName);
      return false;
    }
    return true;
  }

  protected isInteger(value: unknown, itemName: string): boolean {
    if (!value || Number.isInteger(value)) {
      logError(this.config, sprintf(TYPE_ERROR, "integer"), itemName);
      return false;
    }
    return true;
  }

  /**
   * Return an object with Api parameters as keys
   */
  // deno-lint-ignore no-explicit-any
  public toApiKeys(): any {
    return {
      [VISITOR_ID_API_ITEM]: this.visitorId,
      [DS_API_ITEM]: this.ds,
      [CUSTOMER_ENV_ID_API_ITEM]: `${this.config.envId}`,
      [T_API_ITEM]: this.hitType,
    };
  }

  /**
   * Return true if all required attributes are given, otherwise return false
   */
  public isReady(): boolean {
    return !!(
      this.visitorId &&
      this.ds &&
      this.config &&
      this.config.envId &&
      this.hitType
    );
  }

  /**
   * This function return the error message according to required attributes of class
   *
   */
  public abstract getErrorMessage(): string;
}
