import {
  IC_API_ITEM,
  IN_API_ITEM,
  IP_API_ITEM,
  IQ_API_ITEM,
  IV_API_ITEM,
  TID_API_ITEM
} from '../enum/FlagshipConstant.ts'
import { HitType } from '../enum/HitType.ts'
import { HitAbstract, IHitAbstract } from './HitAbstract.ts'

export const ERROR_MESSAGE = 'Transaction Id, Item name and item code are required'

export interface IItem extends IHitAbstract{
   transactionId: string
   productName: string
   productSku: string
   itemPrice?: number
   itemQuantity?: number
   itemCategory?: string
}

export class Item extends HitAbstract implements IItem {
  private _transactionId!: string;
  private _productName!: string;
  private _productSku!: string;
  private _itemPrice!: number;
  private _itemQuantity!: number;
  private _itemCategory!: string;

  public get transactionId (): string {
    return this._transactionId
  }

  /**
   * Specify transaction unique identifier.
   */
  public set transactionId (v: string) {
    if (!this.isNotEmptyString(v, 'transactionId')) {
      return
    }
    this._transactionId = v
  }

  public get productName (): string {
    return this._productName
  }

  /**
   * Specify name of the item product.
   */
  public set productName (v: string) {
    if (!this.isNotEmptyString(v, 'productName')) {
      return
    }
    this._productName = v
  }

  public get productSku (): string {
    return this._productSku
  }

  /**
   * Specify the SKU or item code.
   */
  public set productSku (v: string) {
    if (!this.isNotEmptyString(v, 'productSku')) {
      return
    }
    this._productSku = v
  }

  public get itemPrice (): number {
    return this._itemPrice
  }

  /**
   * Specify the price for a single item
   */
  public set itemPrice (v: number) {
    if (!this.isNumeric(v, 'itemPrice')) {
      return
    }
    this._itemPrice = v
  }

  public get itemQuantity (): number {
    return this._itemQuantity
  }

  /**
   * Specify the number of items purchased.
   */
  public set itemQuantity (v: number) {
    if (!this.isInteger(v, 'itemQuantity')) {
      return
    }
    this._itemQuantity = Math.trunc(v)
  }

  public get itemCategory (): string {
    return this._itemCategory
  }

  /**
   * Specify the category that the item belongs to
   */
  public set itemCategory (v: string) {
    if (!this.isNotEmptyString(v, 'itemCategory')) {
      return
    }
    this._itemCategory = v
  }

  /**
   *Item constructor.
   * @param transactionId : Transaction unique identifier.
   * @param productName : Name of the item product.
   * @param productSku : The SKU or item code.
   */
  public constructor (item:Omit<IItem, 'type'>) {
    super({
      type: HitType.ITEM,
      userIp: item?.userIp,
      screenResolution: item?.screenResolution,
      locale: item?.locale,
      sessionNumber: item?.sessionNumber
    })
    const {
      transactionId, productName, productSku,
      itemCategory, itemPrice, itemQuantity
    } = item
    this.transactionId = transactionId
    this.productName = productName
    this.productSku = productSku

    if (itemCategory) {
      this.itemCategory = itemCategory
    }
    if (itemPrice) {
      this.itemPrice = itemPrice
    }
    if (itemQuantity) {
      this.itemQuantity = itemQuantity
    }
  }

  public isReady (checkParent = true): boolean {
    return !!(
      (!checkParent || super.isReady()) &&
      this.transactionId &&
      this.productName &&
      this.productSku
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toApiKeys ():Record<string, unknown> {
    const apiKeys = super.toApiKeys()
    apiKeys[TID_API_ITEM] = this.transactionId
    apiKeys[IN_API_ITEM] = this.productName
    apiKeys[IC_API_ITEM] = this.productSku

    if (this.itemPrice) {
      apiKeys[IP_API_ITEM] = this.itemPrice
    }
    if (this.itemQuantity) {
      apiKeys[IQ_API_ITEM] = this.itemQuantity
    }
    if (this.itemCategory) {
      apiKeys[IV_API_ITEM] = this.itemCategory
    }
    return apiKeys
  }

  public toObject ():Record<string, unknown> {
    return {
      ...super.toObject(),
      transactionId: this.transactionId,
      productName: this.productName,
      productSku: this.productSku,
      itemPrice: this.itemPrice,
      itemQuantity: this.itemQuantity,
      itemCategory: this.itemCategory
    }
  }

  public getErrorMessage (): string {
    return ERROR_MESSAGE
  }
}
