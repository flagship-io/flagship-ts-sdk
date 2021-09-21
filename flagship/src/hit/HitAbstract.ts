import { IFlagshipConfig } from '../config/FlagshipConfig'
import {
  CUSTOMER_ENV_ID_API_ITEM,
  DS_API_ITEM,
  T_API_ITEM,
  TYPE_ERROR,
  VISITOR_ID_API_ITEM,
  TYPE_INTEGER_ERROR,
  CUSTOMER_UID
} from '../enum/FlagshipConstant'
import { HitType } from '../enum/HitType'
import { primitive } from '../types'
import { logError, sprintf } from '../utils/utils'

export interface IHitAbstract{
  visitorId?:string
  ds?: string
  type: HitType
}

export abstract class HitAbstract implements IHitAbstract {
  private _visitorId!: string;
  private _config!: IFlagshipConfig;
  private _type!: HitType;
  private _ds!: string;
  private _anonymousId! : string|null;

  public get anonymousId () : string|null {
    return this._anonymousId
  }

  public set anonymousId (v : string|null) {
    this._anonymousId = v
  }

  public get visitorId (): string {
    return this._visitorId
  }

  public set visitorId (v: string) {
    this._visitorId = v
  }

  public get ds (): string {
    return this._ds
  }

  public set ds (v: string) {
    this._ds = v
  }

  public get type (): HitType {
    return this._type
  }

  protected set type (v: HitType) {
    this._type = v
  }

  public get config (): IFlagshipConfig {
    return this._config
  }

  public set config (v: IFlagshipConfig) {
    this._config = v
  }

  protected constructor (type: HitType) {
    this.type = type
    this._anonymousId = null
  }

  /**
   * Return true if value is a string and not empty, otherwise return false
   * @param value
   * @param itemName
   * @returns
   */
  protected isNotEmptyString (value: unknown, itemName: string): boolean {
    if (!value || typeof value !== 'string') {
      logError(this.config, sprintf(TYPE_ERROR, itemName, 'string'), itemName)
      return false
    }
    return true
  }

  protected isNumeric (value: unknown, itemName: string): boolean {
    if (!value || typeof value !== 'number') {
      logError(this.config, sprintf(TYPE_ERROR, itemName, 'number'), itemName)
      return false
    }
    return true
  }

  protected isInteger (value: unknown, itemName: string): boolean {
    if (!value || typeof value !== 'number') {
      logError(this.config, sprintf(TYPE_ERROR, itemName, 'integer'), itemName)
      return false
    }
    if (!Number.isInteger(value)) {
      logError(
        this.config,
        sprintf(
          TYPE_INTEGER_ERROR,
          itemName,
          'integer'
        ),
        itemName
      )
    }
    return true
  }

  /**
   * Return an object with Api parameters as keys
   */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toApiKeys (): any {
    const apiKeys:Record<string, primitive|null> = {
      [VISITOR_ID_API_ITEM]: this.visitorId,
      [DS_API_ITEM]: this.ds,
      [CUSTOMER_ENV_ID_API_ITEM]: `${this.config.envId}`,
      [T_API_ITEM]: this.type
    }
    if (this.visitorId && this._anonymousId) {
      apiKeys[VISITOR_ID_API_ITEM] = this._anonymousId
      apiKeys[CUSTOMER_UID] = this.visitorId
    } else {
      apiKeys[VISITOR_ID_API_ITEM] = this._anonymousId || this.visitorId
      apiKeys[CUSTOMER_UID] = null
    }
    return apiKeys
  }

  /**
   * Return true if all required attributes are given, otherwise return false
   */
  public isReady (): boolean {
    return !!(
      this.visitorId &&
      this.ds &&
      this.config &&
      this.config.envId &&
      this.type
    )
  }

  /**
   * This function return the error message according to required attributes of class
   *
   */
  public abstract getErrorMessage(): string;
}
