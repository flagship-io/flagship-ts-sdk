/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ICN_API_ITEM,
  PM_API_ITEM,
  SM_API_ITEM,
  TA_API_ITEM,
  TC_API_ITEM,
  TCC_API_ITEM,
  TID_API_ITEM,
  TR_API_ITEM,
  TS_API_ITEM,
  TT_API_ITEM
} from '../enum/FlagshipConstant.ts'
import { HitType } from '../enum/HitType.ts'
import { logError, sprintf } from '../utils/utils.ts'
import { HitAbstract, IHitAbstract } from './HitAbstract.ts'

export const CURRENCY_ERROR = '{0} must be a string and have exactly 3 letters'
export const ERROR_MESSAGE = 'Transaction Id and Transaction affiliation are required'

export interface ITransaction extends IHitAbstract{
  transactionId: string
  affiliation: string
  taxes?: number
  currency?: string
  couponCode?: string
  itemCount?: number
  shippingMethod?: string
  paymentMethod?: string
  totalRevenue?: number
  shippingCosts?: number
}

export class Transaction extends HitAbstract implements ITransaction {
  private _transactionId!: string
  private _affiliation!: string
  private _taxes!: number
  private _currency!: string
  private _couponCode!: string
  private _itemCount!: number
  private _shippingMethod!: string
  private _paymentMethod!: string
  private _totalRevenue!: number
  private _shippingCosts!: number

  public get transactionId (): string {
    return this._transactionId
  }

  public set transactionId (v: string) {
    if (!this.isNotEmptyString(v, 'transactionId')) {
      return
    }
    this._transactionId = v
  }

  public get affiliation (): string {
    return this._affiliation
  }

  public set affiliation (v: string) {
    if (!this.isNotEmptyString(v, 'affiliation')) {
      return
    }
    this._affiliation = v
  }

  public get taxes (): number {
    return this._taxes
  }

  public set taxes (v: number) {
    if (!this.isNumeric(v, 'taxes')) {
      return
    }
    this._taxes = v
  }

  public get currency (): string {
    return this._currency
  }

  public set currency (v: string) {
    if (!v || typeof v !== 'string' || v.length !== 3) {
      logError(this.config, sprintf(CURRENCY_ERROR, 'currency'), 'currency')
      return
    }
    this._currency = v
  }

  public get couponCode (): string {
    return this._couponCode
  }

  public set couponCode (v: string) {
    if (!this.isNotEmptyString(v, 'couponCode')) {
      return
    }
    this._couponCode = v
  }

  public get itemCount (): number {
    return this._itemCount
  }

  public set itemCount (v: number) {
    if (!this.isInteger(v, 'itemCount')) {
      return
    }
    this._itemCount = Math.trunc(v)
  }

  public get shippingMethod (): string {
    return this._shippingMethod
  }

  public set shippingMethod (v: string) {
    if (!this.isNotEmptyString(v, 'shippingMethod')) {
      return
    }
    this._shippingMethod = v
  }

  public get paymentMethod (): string {
    return this._paymentMethod
  }

  public set paymentMethod (v: string) {
    if (!this.isNotEmptyString(v, 'paymentMethod')) {
      return
    }
    this._paymentMethod = v
  }

  public get totalRevenue (): number {
    return this._totalRevenue
  }

  public set totalRevenue (v: number) {
    if (!this.isNumeric(v, 'totalRevenue')) {
      return
    }
    this._totalRevenue = v
  }

  public get shippingCosts (): number {
    return this._shippingCosts
  }

  public set shippingCosts (v: number) {
    if (!this.isNumeric(v, 'shippingCosts')) {
      return
    }
    this._shippingCosts = v
  }

  public constructor (param: Omit<ITransaction, 'type'|'createdAt'|'visitorInstanceId'|'traffic'>) {
    super({
      type: HitType.TRANSACTION,
      userIp: param.userIp,
      screenResolution: param.screenResolution,
      locale: param.locale,
      sessionNumber: param.sessionNumber,
      visitorId: param.visitorId,
      anonymousId: param.anonymousId,
      qaMode: param.qaMode,
      isActionTrackingHit: param.isActionTrackingHit
    })
    const {
      transactionId,
      affiliation, taxes,
      currency, couponCode,
      itemCount, shippingMethod,
      paymentMethod,
      totalRevenue, shippingCosts
    } = param
    this.transactionId = transactionId
    this.affiliation = affiliation
    if (taxes) {
      this.taxes = taxes
    }
    if (currency) {
      this.currency = currency
    }
    if (couponCode) {
      this.couponCode = couponCode
    }
    if (itemCount) {
      this.itemCount = itemCount
    }
    if (shippingMethod) {
      this.shippingMethod = shippingMethod
    }
    if (paymentMethod) {
      this.paymentMethod = paymentMethod
    }
    if (totalRevenue) {
      this.totalRevenue = totalRevenue
    }
    if (shippingCosts) {
      this.shippingCosts = shippingCosts
    }
  }

  public isReady (checkParent = true):boolean {
    return !!((!checkParent || super.isReady()) && this.transactionId && this.affiliation)
  }

  public toApiKeys ():any {
    const apiKeys = super.toApiKeys()
    apiKeys[TID_API_ITEM] = this.transactionId
    apiKeys[TA_API_ITEM] = this.affiliation

    if (this.taxes) {
      apiKeys[TT_API_ITEM] = this.taxes
    }

    if (this.currency) {
      apiKeys[TC_API_ITEM] = this.currency
    }

    if (this.couponCode) {
      apiKeys[TCC_API_ITEM] = this.couponCode
    }

    if (this.itemCount) {
      apiKeys[ICN_API_ITEM] = this.itemCount
    }

    if (this.shippingMethod) {
      apiKeys[SM_API_ITEM] = this.shippingMethod
    }

    if (this.paymentMethod) {
      apiKeys[PM_API_ITEM] = this.paymentMethod
    }

    if (this.totalRevenue) {
      apiKeys[TR_API_ITEM] = this.totalRevenue
    }

    if (this.shippingCosts) {
      apiKeys[TS_API_ITEM] = this.shippingCosts
    }
    return apiKeys
  }

  public toObject ():Record<string, unknown> {
    return {
      ...super.toObject(),
      transactionId: this.transactionId,
      affiliation: this.affiliation,
      taxes: this.taxes,
      currency: this.currency,
      couponCode: this.couponCode,
      itemCount: this.itemCount,
      shippingMethod: this.shippingMethod,
      paymentMethod: this.paymentMethod,
      totalRevenue: this.totalRevenue,
      shippingCosts: this.shippingCosts
    }
  }

  public getErrorMessage (): string {
    return ERROR_MESSAGE
  }
}
