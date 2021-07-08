import { assertEquals, stub } from "../../deps.ts";
import { DecisionApiConfig } from "../../src/config/index.ts";
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
  VISITOR_ID_API_ITEM,
} from "../../src/enum/index.ts";
import { Item } from "../../src/hit/index.ts";
import { ERROR_MESSAGE } from "../../src/hit/Item.ts";
import { FlagshipLogManager } from "../../src/utils/FlagshipLogManager.ts";
import { sprintf } from "../../src/utils/utils.ts";

Deno.test("test hit type Item", () => {
  const transactionId = "transactionId";
  const productName = "productName";
  const productSku = "productSku";
  const item = new Item(transactionId, productName, productSku);
  assertEquals(item.transactionId, transactionId);
  assertEquals(item.productName, productName);
  assertEquals(item.productSku, productSku);
  assertEquals(item.itemCategory, undefined);
  assertEquals(item.itemPrice, undefined);
  assertEquals(item.itemQuantity, undefined);

  assertEquals(item.getErrorMessage(), ERROR_MESSAGE);

  assertEquals(item.isReady(), false);

  const logManager = new FlagshipLogManager();
  const logError = stub(logManager, "error");

  const config = new DecisionApiConfig("envId", "apiKey");
  config.logManager = logManager;
  item.config = config;
  item.ds = SDK_APP;
  const visitorId = "visitorId";
  item.visitorId = visitorId;

  assertEquals(item.isReady(), true);
  // deno-lint-ignore no-explicit-any
  const apiKeys: any = {
    [VISITOR_ID_API_ITEM]: visitorId,
    [DS_API_ITEM]: SDK_APP,
    [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
    [T_API_ITEM]: HitType.ITEM,
    [TID_API_ITEM]: transactionId,
    [IN_API_ITEM]: productName,
    [IC_API_ITEM]: productSku,
  };

  assertEquals(item.toApiKeys(), apiKeys);

  //test set itemCategory
  const itemCategory = "itemCategory";
  item.itemCategory = itemCategory;
  assertEquals(item.itemCategory, itemCategory);

  apiKeys[IV_API_ITEM] = itemCategory;

  assertEquals(item.toApiKeys(), apiKeys);

  item.itemCategory = "";
  assertEquals(item.itemCategory, itemCategory);
  assertEquals(logError.calls.length, 1);

  //test set itemPrice
  const itemPrice = 200.5;
  item.itemPrice = itemPrice;
  assertEquals(item.itemPrice, itemPrice);

  apiKeys[IP_API_ITEM] = itemPrice;
  assertEquals(item.toApiKeys(), apiKeys);

  item.itemPrice = {} as number;
  assertEquals(item.itemPrice, itemPrice);
  assertEquals(logError.calls.length, 2);

  //test set itemQuantity
  const itemQuantity = 5;
  item.itemQuantity = itemQuantity;
  assertEquals(item.itemQuantity, itemQuantity);

  apiKeys[IQ_API_ITEM] = itemQuantity;
  assertEquals(item.toApiKeys(), apiKeys);

  item.itemQuantity = 5.2;
  assertEquals(item.itemQuantity, itemQuantity);
  assertEquals(logError.calls.length, 3);

  item.itemQuantity = {} as number;
  assertEquals(item.itemQuantity, itemQuantity);
  assertEquals(logError.calls.length, 4);

  //log transactionId
  item.transactionId = "";
  assertEquals(item.transactionId, transactionId);
  assertEquals(logError.calls.length, 5);

  //log productName
  item.productName = {} as string;
  assertEquals(item.productName, productName);
  assertEquals(logError.calls.length, 6);

  //log productSku
  item.productSku = "";
  assertEquals(item.productSku, productSku);
  assertEquals(logError.calls.length, 7);

  //test log

  const logParams = (message: string, tag: string) => ({
    args: [message, tag],
    self: logManager,
  });

  assertEquals(logError.calls, [
    logParams(sprintf(TYPE_ERROR, "itemCategory", "string"), "itemCategory"),
    logParams(sprintf(TYPE_ERROR, "itemPrice", "number"), "itemPrice"),
    logParams(
      sprintf(TYPE_INTEGER_ERROR, "itemQuantity", "integer"),
      "itemQuantity"
    ),
    logParams(sprintf(TYPE_ERROR, "itemQuantity", "integer"), "itemQuantity"),
    logParams(sprintf(TYPE_ERROR, "transactionId", "string"), "transactionId"),
    logParams(sprintf(TYPE_ERROR, "productName", "string"), "productName"),
    logParams(sprintf(TYPE_ERROR, "productSku", "string"), "productSku"),
  ]);
});
