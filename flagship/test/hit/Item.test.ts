import { jest, expect, it, describe } from '@jest/globals'
import { DecisionApiConfig } from '../../src/config/index'
import {
  CUSTOMER_ENV_ID_API_ITEM,
  DS_API_ITEM,
  HitType,
  IC_API_ITEM,
  IN_API_ITEM,
  IP_API_ITEM,
  IQ_API_ITEM,
  IV_API_ITEM,
  SDK_APP,
  TID_API_ITEM,
  TYPE_ERROR,
  TYPE_INTEGER_ERROR,
  T_API_ITEM,
  VISITOR_ID_API_ITEM
} from '../../src/enum/index'
import { Item } from '../../src/hit/index'
import { ERROR_MESSAGE } from '../../src/hit/Item'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { sprintf } from '../../src/utils/utils'

describe('test hit type Item', () => {
  const transactionId = 'transactionId'
  const productName = 'productName'
  const productSku = 'productSku'
  const item = new Item({ transactionId, productName, productSku })

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

  const visitorId = 'visitorId'
  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

  it('should ', () => {
    config.logManager = logManager
    item.config = config
    item.ds = SDK_APP
    item.visitorId = visitorId
    expect(item.isReady()).toBeTruthy()
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiKeys: any = {
    [VISITOR_ID_API_ITEM]: visitorId,
    [DS_API_ITEM]: SDK_APP,
    [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
    [T_API_ITEM]: HitType.ITEM,
    [TID_API_ITEM]: transactionId,
    [IN_API_ITEM]: productName,
    [IC_API_ITEM]: productSku
  }

  it('should ', () => {
    expect(item.toApiKeys()).toEqual(apiKeys)
  })

  it('test set itemCategory', () => {
    const itemCategory = 'itemCategory'
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

  it('test set itemPrice', () => {
    const itemPrice = 200.5
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

  it('test set itemQuantity', () => {
    const itemQuantity = 5
    item.itemQuantity = itemQuantity
    expect(item.itemQuantity).toBe(itemQuantity)

    apiKeys[IQ_API_ITEM] = itemQuantity
    expect(item.toApiKeys()).toEqual(apiKeys)

    item.itemQuantity = 5.2
    expect(logError).toHaveBeenCalledTimes(1)
    expect(logError).toHaveBeenCalledWith(
      sprintf(TYPE_INTEGER_ERROR, 'itemQuantity', 'integer'),
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
