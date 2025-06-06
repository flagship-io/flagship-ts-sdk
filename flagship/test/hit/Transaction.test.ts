import { jest, expect, it, describe } from '@jest/globals';
import { DecisionApiConfig } from '../../src/config/index';
import { CUSTOMER_ENV_ID_API_ITEM,
  CUSTOMER_UID,
  DS_API_ITEM,
  HitType,
  ICN_API_ITEM,
  PM_API_ITEM,
  QT_API_ITEM,
  SDK_APP,
  SM_API_ITEM,
  TA_API_ITEM,
  TCC_API_ITEM,
  TC_API_ITEM,
  TID_API_ITEM,
  TR_API_ITEM,
  TS_API_ITEM,
  TT_API_ITEM,
  TYPE_ERROR,
  T_API_ITEM,
  VISITOR_ID_API_ITEM } from '../../src/enum/index';
import { CURRENCY_ERROR, ERROR_MESSAGE, Transaction } from '../../src/hit/Transaction';
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager';
import { sprintf } from '../../src/utils/utils';

describe('test hit type Transaction', () => {
  const transactionId = 'transactionId';
  const affiliation = 'affiliation';
  const visitorId = 'visitorId';
  const transaction = new Transaction({
    transactionId,
    affiliation,
    visitorId
  });

  it('should ', () => {
    expect(transaction.transactionId).toBe(transactionId);
    expect(transaction.affiliation).toBe(affiliation);
    expect(transaction.couponCode).toBeUndefined();
    expect(transaction.currency).toBeUndefined();
    expect(transaction.itemCount).toBeUndefined();
    expect(transaction.paymentMethod).toBeUndefined();
    expect(transaction.shippingCosts).toBeUndefined();
    expect(transaction.shippingMethod).toBeUndefined();
    expect(transaction.taxes).toBeUndefined();
    expect(transaction.totalRevenue).toBeUndefined();
    expect(transaction.getErrorMessage()).toBe(ERROR_MESSAGE);
    expect(transaction.isReady()).toBeFalsy();
  });

  it('test construct', () => {
    const params = {
      transactionId: 'transactionId',
      affiliation: 'affiliation',
      couponCode: 'couponCode',
      currency: 'EUR',
      itemCount: 14,
      paymentMethod: 'method',
      shippingCosts: 45,
      shippingMethod: 'method-ship',
      taxes: 45,
      totalRevenue: 78,
      visitorId
    };
    const transaction = new Transaction(params);

    expect(transaction.transactionId).toBe(params.transactionId);
    expect(transaction.affiliation).toBe(params.affiliation);
    expect(transaction.couponCode).toBe(params.couponCode);
    expect(transaction.currency).toBe(params.currency);
    expect(transaction.itemCount).toBe(params.itemCount);
    expect(transaction.paymentMethod).toBe(params.paymentMethod);
    expect(transaction.shippingCosts).toBe(params.shippingCosts);
    expect(transaction.shippingMethod).toBe(params.shippingMethod);
    expect(transaction.taxes).toBe(params.taxes);
    expect(transaction.totalRevenue).toBe(params.totalRevenue);
  });

  const logManager = new FlagshipLogManager();
  const logError = jest.spyOn(logManager, 'error');

  const config = new DecisionApiConfig({
    envId: 'envId',
    apiKey: 'apiKey'
  });
  config.logManager = logManager;

  it('should ', () => {
    transaction.config = config;
    transaction.ds = SDK_APP;
    transaction.visitorId = visitorId;
    expect(transaction.isReady()).toBeTruthy();
    expect(transaction.isReady(false)).toBeTruthy();
  });


  const apiKeys: any = {
    [VISITOR_ID_API_ITEM]: visitorId,
    [DS_API_ITEM]: SDK_APP,
    [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
    [T_API_ITEM]: HitType.TRANSACTION,
    [TID_API_ITEM]: transactionId,
    [TA_API_ITEM]: affiliation,
    [CUSTOMER_UID]: null,
    [QT_API_ITEM]: expect.anything()
  };

  it('should ', () => {
    expect(transaction.toApiKeys()).toEqual(apiKeys);
  });

  const couponCode = 'couponCode';
  it('test set couponCode', () => {
    transaction.couponCode = couponCode;
    expect(transaction.couponCode).toBe(couponCode);

    apiKeys[TCC_API_ITEM] = couponCode;
    expect(transaction.toApiKeys()).toEqual(apiKeys);

    transaction.couponCode = {} as string;
    expect(transaction.couponCode).toEqual(couponCode);
    expect(logError).toBeCalledTimes(1);
    expect(logError).toBeCalledWith(
      sprintf(TYPE_ERROR, 'couponCode', 'string'),
      'couponCode'
    );
  });

  const currency = 'EUR';
  it('test set currency', () => {
    transaction.currency = currency;
    expect(transaction.currency).toBe(currency);

    apiKeys[TC_API_ITEM] = currency;
    expect(transaction.toApiKeys()).toEqual(apiKeys);
  });

  it('test empty currency', () => {
    transaction.currency = '';
    expect(transaction.currency).toBe(currency);
    expect(logError).toBeCalledTimes(1);
    expect(logError).toBeCalledWith(
      sprintf(CURRENCY_ERROR, 'currency', 'string'),
      'currency'
    );
  });

  it('test invalid currency', () => {
    transaction.currency = 'ER';
    expect(transaction.currency).toBe(currency);

    transaction.currency = 'EURO';
    expect(transaction.currency).toBe(currency);

    expect(logError).toBeCalledTimes(2);
    expect(logError).toBeCalledWith(
      sprintf(CURRENCY_ERROR, 'currency', 'string'),
      'currency'
    );
  });

  const itemCount = 5;
  it('test itemCount', () => {
    transaction.itemCount = itemCount;
    expect(transaction.itemCount).toBe(itemCount);

    apiKeys[ICN_API_ITEM] = itemCount;
    expect(transaction.toApiKeys()).toEqual(apiKeys);
  });

  it('test itemCount log 1', () => {
    transaction.itemCount = 6.2;
    expect(transaction.itemCount).toBe(itemCount);

    expect(logError).toBeCalledTimes(1);
    expect(logError).toBeCalledWith(
      sprintf(TYPE_ERROR, 'itemCount', 'integer'),
      'itemCount'
    );
  });

  it('test itemCount log 1', () => {
    transaction.itemCount = {} as number;
    expect(transaction.itemCount).toBe(itemCount);

    expect(logError).toBeCalledTimes(1);
    expect(logError).toBeCalledWith(
      sprintf(TYPE_ERROR, 'itemCount', 'integer'),
      'itemCount'
    );
  });

  const paymentMethod = 'paymentMethod';
  it('test paymentMethod', () => {
    transaction.paymentMethod = paymentMethod;
    expect(transaction.paymentMethod).toBe(paymentMethod);

    apiKeys[PM_API_ITEM] = paymentMethod;
    expect(transaction.toApiKeys()).toEqual(apiKeys);

    transaction.paymentMethod = '';
    expect(transaction.paymentMethod).toBe(paymentMethod);

    expect(logError).toBeCalledWith(
      sprintf(TYPE_ERROR, 'paymentMethod', 'string'),
      'paymentMethod'
    );

    expect(logError).toBeCalledTimes(1);
  });

  const shippingCosts = 15;
  it('test shippingCosts', () => {
    const shippingCosts = 15;
    transaction.shippingCosts = shippingCosts;
    expect(transaction.shippingCosts).toBe(shippingCosts);

    apiKeys[TS_API_ITEM] = shippingCosts;
    expect(transaction.toApiKeys()).toEqual(apiKeys);
  });

  it('test shippingCosts log ', () => {
    transaction.shippingCosts = {} as number;
    expect(transaction.shippingCosts).toBe(shippingCosts);

    expect(logError).toBeCalledTimes(1);
    expect(logError).toBeCalledWith(
      sprintf(TYPE_ERROR, 'shippingCosts', 'number'),
      'shippingCosts'
    );
  });

  const shippingMethod = 'shippingMethod';
  it('test shippingMethod', () => {
    transaction.shippingMethod = shippingMethod;
    expect(transaction.shippingMethod).toBe(shippingMethod);

    apiKeys[SM_API_ITEM] = shippingMethod;
    expect(transaction.toApiKeys()).toEqual(apiKeys);
  });

  it('test shippingMethod log', () => {
    transaction.shippingMethod = '';
    expect(transaction.shippingMethod).toBe(shippingMethod);

    expect(logError).toBeCalledTimes(1);
    expect(logError).toBeCalledWith(
      sprintf(TYPE_ERROR, 'shippingMethod', 'string'),
      'shippingMethod'
    );
  });

  const taxes = 25.2;
  it('test taxes', () => {
    transaction.taxes = taxes;
    expect(transaction.taxes).toBe(taxes);
    apiKeys[TT_API_ITEM] = taxes;
    expect(transaction.toApiKeys()).toEqual(apiKeys);
  });

  it('test taxes log', () => {
    transaction.taxes = {} as number;
    expect(transaction.taxes).toBe(taxes);
    expect(logError).toBeCalledTimes(1);
    expect(logError).toBeCalledWith(
      sprintf(TYPE_ERROR, 'taxes', 'number'),
      'taxes'
    );
  });

  const totalRevenue = 28.2;
  it('test totalRevenue', () => {
    transaction.totalRevenue = totalRevenue;
    expect(transaction.totalRevenue).toBe(totalRevenue);
    apiKeys[TR_API_ITEM] = totalRevenue;
    expect(transaction.toApiKeys()).toEqual(apiKeys);
  });

  it('test totalRevenue log', () => {
    transaction.totalRevenue = {} as number;
    expect(transaction.totalRevenue).toBe(totalRevenue);
    expect(logError).toBeCalledTimes(1);
    expect(logError).toBeCalledWith(
      sprintf(TYPE_ERROR, 'totalRevenue', 'number'),
      'totalRevenue'
    );
  });

  it('test toObject method', () => {
    const userIp = '127.0.0.1';
    const screenResolution = '800X600';
    const locale = 'fr';
    const sessionNumber = '12345';
    const key = 'key';
    transaction.userIp = userIp;
    transaction.screenResolution = screenResolution;
    transaction.locale = locale;
    transaction.sessionNumber = sessionNumber;
    transaction.key = key;
    expect(transaction.toObject()).toEqual({
      userIp,
      screenResolution,
      locale,
      sessionNumber,
      anonymousId: null,
      visitorId,
      ds: SDK_APP,
      type: HitType.TRANSACTION,
      transactionId,
      affiliation,
      currency,
      itemCount,
      paymentMethod,
      shippingMethod,
      shippingCosts,
      taxes,
      totalRevenue,
      couponCode,
      key,
      createdAt: expect.anything()
    });
  });

  it('test log transactionId ', () => {
    transaction.transactionId = '';
    expect(transaction.transactionId).toBe(transactionId);
    expect(logError).toBeCalledTimes(1);
    expect(logError).toBeCalledWith(
      sprintf(TYPE_ERROR, 'transactionId', 'string'),
      'transactionId'
    );
  });

  it('test affiliation ', () => {
    transaction.affiliation = '';

    expect(transaction.affiliation).toBe(affiliation);
    expect(logError).toBeCalledTimes(1);
    expect(logError).toBeCalledWith(
      sprintf(TYPE_ERROR, 'affiliation', 'string'),
      'affiliation'
    );
  });
});
