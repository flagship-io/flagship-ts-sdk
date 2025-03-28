import { jest, expect, it, describe } from '@jest/globals'
import { DecisionApiConfig } from '../../src/config/index'
import {
  CUSTOMER_ENV_ID_API_ITEM,
  CUSTOMER_UID,
  DS_API_ITEM,
  HitType,
  IC_API_ITEM,
  IN_API_ITEM,
  IP_API_ITEM,
  IQ_API_ITEM,
  IV_API_ITEM,
  QT_API_ITEM,
  SDK_APP,
  TID_API_ITEM,
  TYPE_ERROR,
  T_API_ITEM,
  VISITOR_ID_API_ITEM
} from '../../src/enum/index'
import { ERROR_MESSAGE, Item } from '../../src/hit/Item'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { sprintf } from '../../src/utils/utils'

describe('test hit type Item', () => {
  const transactionId = 'transactionId'
  const productName = 'productName'
  const productSku = 'productSku'
  const visitorId = 'visitorId'
  const item = new Item({ transactionId, productName, productSku, visitorId })

  it('should ', () => {
    expect(item.transactionId).toBe(transactionId)
    expect(item.productName).toBe(productName)
    expect(item.productSku).toBe(productSku)
    expect(item.itemCategory).toBeUndefined()
    expect(item.itemPrice).toBeUndefined()
    expect(item.itemQuantity).toBeUndefined()

    expect(item.getErrorMessage()).toBe(ERROR_MESSAGE)

    expect(item.isReady()).toBeFalsy()
  })

  it('test constructor', () => {
    const params = {
      transactionId: 'transactionId',
      productName: 'productName',
      productSku: 'productSku',
      itemCategory: 'category',
      itemPrice: 15,
      itemQuantity: 1,
      visitorId
    }

    const item = new Item(params)
    expect(item.transactionId).toBe(params.transactionId)
    expect(item.productName).toBe(params.productName)
    expect(item.productSku).toBe(params.productSku)
    expect(item.itemCategory).toBe(params.itemCategory)
    expect(item.itemPrice).toBe(params.itemPrice)
    expect(item.itemQuantity).toBe(params.itemQuantity)
  })

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

  it('should ', () => {
    config.logManager = logManager
    item.config = config
    item.ds = SDK_APP
    item.visitorId = visitorId
    expect(item.isReady()).toBeTruthy()
    expect(item.isReady(false)).toBeTruthy()
  })

   
  const apiKeys: any = {
    [VISITOR_ID_API_ITEM]: visitorId,
    [DS_API_ITEM]: SDK_APP,
    [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
    [T_API_ITEM]: HitType.ITEM,
    [TID_API_ITEM]: transactionId,
    [IN_API_ITEM]: productName,
    [IC_API_ITEM]: productSku,
    [CUSTOMER_UID]: null,
    [QT_API_ITEM]: expect.anything()
  }

  it('should ', () => {
    expect(item.toApiKeys()).toEqual(apiKeys)
  })

  const itemCategory = 'itemCategory'
  it('test set itemCategory', () => {
    item.itemCategory = itemCategory
    expect(item.itemCategory).toBe(itemCategory)

    apiKeys[IV_API_ITEM] = itemCategory

    expect(item.toApiKeys()).toEqual(apiKeys)

    item.itemCategory = ''
    expect(logError).toHaveBeenCalledTimes(1)
    expect(logError).toHaveBeenCalledWith(
      sprintf(TYPE_ERROR, 'itemCategory', 'string'),
      'itemCategory'
    )
    expect(item.itemCategory).toBe(itemCategory)
  })

  const itemPrice = 200.5
  it('test set itemPrice', () => {
    item.itemPrice = itemPrice
    expect(item.itemPrice).toBe(itemPrice)

    apiKeys[IP_API_ITEM] = itemPrice
    expect(item.toApiKeys()).toEqual(apiKeys)

    item.itemPrice = {} as number
    expect(logError).toHaveBeenCalledTimes(1)
    expect(logError).toHaveBeenCalledWith(
      sprintf(TYPE_ERROR, 'itemPrice', 'number'),
      'itemPrice'
    )
    expect(item.itemPrice).toBe(itemPrice)
  })

  const itemQuantity = 5
  it('test set itemQuantity', () => {
    item.itemQuantity = itemQuantity
    expect(item.itemQuantity).toBe(itemQuantity)

    apiKeys[IQ_API_ITEM] = itemQuantity
    expect(item.toApiKeys()).toEqual(apiKeys)

    item.itemQuantity = 5.2
    expect(logError).toHaveBeenCalledTimes(1)
    expect(logError).toHaveBeenCalledWith(
      sprintf(TYPE_ERROR, 'itemQuantity', 'integer'),
      'itemQuantity'
    )
    expect(item.itemQuantity).toBe(itemQuantity)

    item.itemQuantity = {} as number
    expect(item.itemQuantity).toBe(itemQuantity)
    expect(logError).toHaveBeenCalledWith(
      sprintf(TYPE_ERROR, 'itemQuantity', 'integer'),
      'itemQuantity'
    )
  })

  it('test toObject', () => {
    const userIp = '127.0.0.1'
    const screenResolution = '800X600'
    const locale = 'fr'
    const sessionNumber = '12345'
    const key = 'key'
    item.userIp = userIp
    item.screenResolution = screenResolution
    item.locale = locale
    item.sessionNumber = sessionNumber
    item.key = key
    expect(item.toObject())
      .toEqual({
        userIp,
        screenResolution,
        locale,
        sessionNumber,
        anonymousId: null,
        visitorId,
        ds: SDK_APP,
        type: HitType.ITEM,
        key,
        createdAt: expect.anything(),
        transactionId,
        productName,
        productSku,
        itemCategory,
        itemPrice,
        itemQuantity
      })
  })

  it('log transactionId', () => {
    item.transactionId = ''
    expect(logError).toHaveBeenCalledTimes(1)
    expect(logError).toHaveBeenCalledWith(
      sprintf(TYPE_ERROR, 'transactionId', 'string'),
      'transactionId'
    )
    expect(item.transactionId).toBe(transactionId)
  })

  it('log productName', () => {
    item.productName = {} as string
    expect(logError).toHaveBeenCalledTimes(1)
    expect(logError).toHaveBeenCalledWith(
      sprintf(TYPE_ERROR, 'productName', 'string'),
      'productName'
    )
    expect(item.productName).toBe(productName)
  })

  // log productSku
  it('log productSku', () => {
    item.productSku = ''
    expect(logError).toBeCalledWith(
      sprintf(TYPE_ERROR, 'productSku', 'string'),
      'productSku'
    )
    expect(item.productSku).toBe(productSku)
  })
})
