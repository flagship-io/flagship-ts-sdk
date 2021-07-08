import { assertEquals, stub } from "../../deps.ts";
import { DecisionApiConfig } from "../../src/config/index.ts";
import {
  CUSTOMER_ENV_ID_API_ITEM,
  DS_API_ITEM,
  HitType,
  ICN_API_ITEM,
  PM_API_ITEM,
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
  TYPE_INTEGER_ERROR,
  T_API_ITEM,
  VISITOR_ID_API_ITEM,
} from "../../src/enum/index.ts";
import { Transaction } from "../../src/hit/index.ts";
import { CURRENCY_ERROR, ERROR_MESSAGE } from "../../src/hit/Transaction.ts";
import { FlagshipLogManager } from "../../src/utils/FlagshipLogManager.ts";
import { sprintf } from "../../src/utils/utils.ts";

Deno.test("test hit type Transaction", () => {
  const transactionId = "transactionId";
  const affiliation = "affiliation";
  const transaction = new Transaction(transactionId, affiliation);

  assertEquals(transaction.transactionId, transactionId);
  assertEquals(transaction.affiliation, affiliation);
  assertEquals(transaction.couponCode, undefined);
  assertEquals(transaction.currency, undefined);
  assertEquals(transaction.itemCount, undefined);
  assertEquals(transaction.paymentMethod, undefined);
  assertEquals(transaction.shippingCosts, undefined);
  assertEquals(transaction.shippingMethod, undefined);
  assertEquals(transaction.taxes, undefined);
  assertEquals(transaction.totalRevenue, undefined);
  assertEquals(transaction.getErrorMessage(), ERROR_MESSAGE);

  assertEquals(transaction.isReady(), false);

  const logManager = new FlagshipLogManager();
  const logError = stub(logManager, "error");

  const config = new DecisionApiConfig("envId", "apiKey");
  config.logManager = logManager;
  transaction.config = config;
  transaction.ds = SDK_APP;
  const visitorId = "visitorId";
  transaction.visitorId = visitorId;

  assertEquals(transaction.isReady(), true);

  // deno-lint-ignore no-explicit-any
  const apiKeys: any = {
    [VISITOR_ID_API_ITEM]: visitorId,
    [DS_API_ITEM]: SDK_APP,
    [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
    [T_API_ITEM]: HitType.TRANSACTION,
    [TID_API_ITEM]: transactionId,
    [TA_API_ITEM]: affiliation,
  };

  assertEquals(transaction.toApiKeys(), apiKeys);

  const logParams = (message: string, tag: string) => ({
    args: [message, tag],
    self: logManager,
  });

  //test set couponCode
  const couponCode = "couponCode";
  transaction.couponCode = couponCode;
  assertEquals(transaction.couponCode, couponCode);

  apiKeys[TCC_API_ITEM] = couponCode;
  assertEquals(transaction.toApiKeys(), apiKeys);

  transaction.couponCode = {} as string;
  assertEquals(transaction.couponCode, couponCode);
  assertEquals(logError.calls.length, 1);
  const couponCodeLog = logParams(
    sprintf(TYPE_ERROR, "couponCode", "string"),
    "couponCode"
  );
  assertEquals(logError.calls, [couponCodeLog]);

  //test set currency
  const currency = "EUR";
  transaction.currency = currency;
  assertEquals(transaction.currency, currency);

  apiKeys[TC_API_ITEM] = currency;
  assertEquals(transaction.toApiKeys(), apiKeys);

  //test empty currency
  transaction.currency = "";
  assertEquals(transaction.currency, currency);

  //test invalid currency
  transaction.currency = "ER";
  assertEquals(transaction.currency, currency);

  transaction.currency = "EURO";
  assertEquals(transaction.currency, currency);

  const currentLog = logParams(
    sprintf(CURRENCY_ERROR, "currency", "string"),
    "currency"
  );

  //test itemCount
  const itemCount = 5;
  transaction.itemCount = itemCount;
  assertEquals(transaction.itemCount, itemCount);

  transaction.itemCount = 5.2;
  assertEquals(transaction.itemCount, itemCount);

  apiKeys[ICN_API_ITEM] = itemCount;
  assertEquals(transaction.toApiKeys(), apiKeys);

  const itemCountLog = logParams(
    sprintf(TYPE_INTEGER_ERROR, "itemCount", "integer"),
    "itemCount"
  );

  transaction.itemCount = {} as number;
  assertEquals(transaction.itemCount, itemCount);

  const itemCountLog2 = logParams(
    sprintf(TYPE_ERROR, "itemCount", "integer"),
    "itemCount"
  );

  //test paymentMethod
  const paymentMethod = "paymentMethod";
  transaction.paymentMethod = paymentMethod;
  assertEquals(transaction.paymentMethod, paymentMethod);

  apiKeys[PM_API_ITEM] = paymentMethod;
  assertEquals(transaction.toApiKeys(), apiKeys);

  transaction.paymentMethod = "";
  assertEquals(transaction.paymentMethod, paymentMethod);

  const paymentMethodLog = logParams(
    sprintf(TYPE_ERROR, "paymentMethod", "string"),
    "paymentMethod"
  );

  //test shippingCosts
  const shippingCosts = 15;
  transaction.shippingCosts = shippingCosts;
  assertEquals(transaction.shippingCosts, shippingCosts);

  apiKeys[TS_API_ITEM] = shippingCosts;
  assertEquals(transaction.toApiKeys(), apiKeys);

  transaction.shippingCosts = {} as number;
  assertEquals(transaction.shippingCosts, shippingCosts);

  const shippingCostsLog = logParams(
    sprintf(TYPE_ERROR, "shippingCosts", "number"),
    "shippingCosts"
  );

  //test shippingMethod
  const shippingMethod = "shippingMethod";
  transaction.shippingMethod = shippingMethod;
  assertEquals(transaction.shippingMethod, shippingMethod);

  apiKeys[SM_API_ITEM] = shippingMethod;
  assertEquals(transaction.toApiKeys(), apiKeys);

  transaction.shippingMethod = "";
  assertEquals(transaction.shippingMethod, shippingMethod);

  const shippingMethodLog = logParams(
    sprintf(TYPE_ERROR, "shippingMethod", "string"),
    "shippingMethod"
  );

  //test taxes
  const taxes = 25.2;
  transaction.taxes = taxes;
  assertEquals(transaction.taxes, taxes);

  apiKeys[TT_API_ITEM] = taxes;
  assertEquals(transaction.toApiKeys(), apiKeys);

  transaction.taxes = {} as number;
  assertEquals(transaction.taxes, taxes);

  const taxesLog = logParams(sprintf(TYPE_ERROR, "taxes", "number"), "taxes");

  //test totalRevenue
  const totalRevenue = 28.2;
  transaction.totalRevenue = totalRevenue;
  assertEquals(transaction.totalRevenue, totalRevenue);

  apiKeys[TR_API_ITEM] = totalRevenue;
  assertEquals(transaction.toApiKeys(), apiKeys);

  transaction.totalRevenue = {} as number;
  assertEquals(transaction.totalRevenue, totalRevenue);

  const totalRevenueLog = logParams(
    sprintf(TYPE_ERROR, "totalRevenue", "number"),
    "totalRevenue"
  );

  //test log transactionId
  transaction.transactionId = "";

  const transactionIdLog = logParams(
    sprintf(TYPE_ERROR, "transactionId", "string"),
    "transactionId"
  );

  //test affiliation
  transaction.affiliation = "";

  const affiliationLog = logParams(
    sprintf(TYPE_ERROR, "affiliation", "string"),
    "affiliation"
  );

  assertEquals(logError.calls, [
    couponCodeLog,
    currentLog,
    currentLog,
    currentLog,
    itemCountLog,
    itemCountLog2,
    paymentMethodLog,
    shippingCostsLog,
    shippingMethodLog,
    taxesLog,
    totalRevenueLog,
    transactionIdLog,
    affiliationLog,
  ]);
});
