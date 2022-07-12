import { IFlagshipConfig } from '../config/FlagshipConfig'
import {
  CUSTOMER_ENV_ID_API_ITEM,
  DS_API_ITEM,
  T_API_ITEM,
  TYPE_ERROR,
  VISITOR_ID_API_ITEM,
  CUSTOMER_UID,
  USER_IP_API_ITEM,
  SCREEN_RESOLUTION_API_ITEM,
  SESSION_NUMBER,
  USER_LANGUAGE,
  QT_API_ITEM
} from '../enum/FlagshipConstant'
import { InternalHitType, primitive } from '../types'
import { logError, sprintf } from '../utils/utils'

export interface IHitAbstract{
  visitorId:string
  anonymousId?: string|null
  ds?: string
  type: InternalHitType
  userIp?: string
  screenResolution?: string
  locale?: string
  sessionNumber?: string,
  createdAt:number
}

export abstract class HitAbstract implements IHitAbstract {
  private _visitorId!: string;
  private _config!: IFlagshipConfig;
  protected _type!: InternalHitType;
  private _ds!: string;
  private _anonymousId? : string|null;
  private _userIp! : string;
  private _screenResolution! : string;
  private _locale! : string;
  private _sessionNumber! : string;
  private _key! : string;
  private _createdAt!: number

  public get key () : string {
    return this._key
  }

  public set key (v : string) {
    this._key = v
  }

  public get sessionNumber () : string {
    return this._sessionNumber
  }

  public set sessionNumber (v : string) {
    this._sessionNumber = v
  }

  public get locale () : string {
    return this._locale
  }

  public set locale (v : string) {
    this._locale = v
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

  public get anonymousId () : string|undefined|null {
    return this._anonymousId
  }

  public set anonymousId (v : string|undefined|null) {
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

  public get type (): InternalHitType {
    return this._type
  }

  public get config (): IFlagshipConfig {
    return this._config
  }

  public set config (v: IFlagshipConfig) {
    this._config = v
  }

  public get createdAt () : number {
    return this._createdAt
  }

  public set createdAt (v : number) {
    this._createdAt = v
  }

  protected constructor (hit: Omit<IHitAbstract, 'createdAt'>) {
    const { type, userIp, screenResolution, locale, sessionNumber, visitorId, anonymousId } = hit
    this._type = type
    if (userIp) {
      this.userIp = userIp
    }
    if (screenResolution) {
      this.screenResolution = screenResolution
    }
    if (locale) {
      this.locale = locale
    }
    if (sessionNumber) {
      this.sessionNumber = sessionNumber
    }
    this.visitorId = visitorId
    this._anonymousId = anonymousId || null
    this.createdAt = Date.now()
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
    if (!Number.isInteger(value)) {
      logError(this.config, sprintf(TYPE_ERROR, itemName, 'integer'), itemName)
      return false
    }
    return true
  }

  /**
   * Return an object with Api parameters as keys
   */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toApiKeys (): Record<string, unknown> {
    const apiKeys:Record<string, primitive|null> = {
      [VISITOR_ID_API_ITEM]: this.visitorId,
      [DS_API_ITEM]: this.ds,
      [CUSTOMER_ENV_ID_API_ITEM]: `${this.config?.envId}`,
      [T_API_ITEM]: this.type,
      [QT_API_ITEM]: Date.now() - this._createdAt
    }
    if (this.userIp) {
      apiKeys[USER_IP_API_ITEM] = this.userIp
    }
    if (this.screenResolution) {
      apiKeys[SCREEN_RESOLUTION_API_ITEM] = this.screenResolution
    }
    if (this.locale) {
      apiKeys[USER_LANGUAGE] = this.locale
    }
    if (this.sessionNumber) {
      apiKeys[SESSION_NUMBER] = this.sessionNumber
    }
    if (this.visitorId && this.anonymousId) {
      apiKeys[VISITOR_ID_API_ITEM] = this.anonymousId
      apiKeys[CUSTOMER_UID] = this.visitorId
    } else {
      apiKeys[VISITOR_ID_API_ITEM] = this.anonymousId || this.visitorId
      apiKeys[CUSTOMER_UID] = null
    }
    return apiKeys
  }

  toObject ():Record<string, unknown> {
    return {
      key: this.key,
      visitorId: this.visitorId,
      ds: this.ds,
      type: this.type,
      userIp: this.userIp,
      screenResolution: this.screenResolution,
      locale: this.locale,
      sessionNumber: this.sessionNumber,
      anonymousId: this.anonymousId,
      createdAt: this.createdAt
    }
  }

  /**
   * Return true if all required attributes are given, otherwise return false
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public isReady (_checkParent = true): boolean {
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
