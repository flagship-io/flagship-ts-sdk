import { IFlagshipConfig } from '../config/FlagshipConfig'
import {
  CUSTOMER_ENV_ID_API_ITEM,
  DS_API_ITEM,
  T_API_ITEM,
  TYPE_ERROR,
  VISITOR_ID_API_ITEM,
  TYPE_INTEGER_ERROR,
  CUSTOMER_UID,
  USER_IP_API_ITEM,
  SCREEN_RESOLUTION_API_ITEM,
  SESSION_NUMBER,
  USER_LANGUAGE
} from '../enum/FlagshipConstant'
import { HitType } from '../enum/HitType'
import { primitive } from '../types'
import { logError, sprintf } from '../utils/utils'

export interface IHitAbstract{
  visitorId?:string
  ds?: string
  type: HitType
  userIp?: string
  screenResolution?: string
  local?: string
  sessionNumber?: string
}

export abstract class HitAbstract implements IHitAbstract {
  private _visitorId!: string;
  private _config!: IFlagshipConfig;
  private _type!: HitType;
  private _ds!: string;
  private _anonymousId! : string|null;
  private _userIp! : string;
  private _screenResolution! : string;
  private _local! : string;
  private _sessionNumber! : string;

  public get sessionNumber () : string {
    return this._sessionNumber
  }

  public set sessionNumber (v : string) {
    this._sessionNumber = v
  }

  public get local () : string {
    return this._local
  }

  public set local (v : string) {
    this._local = v
  }

  public get screenResolution () : string {
    return this._screenResolution
  }

  public set screenResolution (v : string) {
    this._screenResolution = v
  }

  public get userIp () : string {
    return this._userIp
  }

  public set userIp (v : string) {
    this._userIp = v
  }

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

  protected constructor (hit: IHitAbstract) {
    const { type, userIp, screenResolution, local, sessionNumber } = hit
    this.type = type
    if (userIp) {
      this.userIp = userIp
    }
    if (screenResolution) {
      this.screenResolution = screenResolution
    }
    if (local) {
      this.local = local
    }
    if (sessionNumber) {
      this.sessionNumber = sessionNumber
    }
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
      [T_API_ITEM]: this.type,
      [USER_IP_API_ITEM]: this.userIp,
      [SCREEN_RESOLUTION_API_ITEM]: this.screenResolution,
      [USER_LANGUAGE]: this.local,
      [SESSION_NUMBER]: this.sessionNumber
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
