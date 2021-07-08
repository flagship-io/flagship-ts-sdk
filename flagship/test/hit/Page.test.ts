import { assertEquals, stub } from "../../deps.ts";
import { DecisionApiConfig } from "../../src/config/index.ts";
import {
  CUSTOMER_ENV_ID_API_ITEM,
  DL_API_ITEM,
  DS_API_ITEM,
  HitType,
  SDK_APP,
  TYPE_ERROR,
  T_API_ITEM,
  VISITOR_ID_API_ITEM,
} from "../../src/enum/index.ts";
import { Page } from "../../src/hit/index.ts";
import { ERROR_MESSAGE } from "../../src/hit/Page.ts";
import { FlagshipLogManager } from "../../src/utils/FlagshipLogManager.ts";
import { sprintf } from "../../src/utils/utils.ts";

Deno.test("test hit type Page", () => {
  const url = "https://localhost";
  const page = new Page(url);
  assertEquals(page.pageUrl, url);

  assertEquals(page.getErrorMessage(), ERROR_MESSAGE);

  assertEquals(page.isReady(), false);

  const logManager = new FlagshipLogManager();
  const logError = stub(logManager, "error");

  const config = new DecisionApiConfig("envId", "apiKey");
  config.logManager = logManager;
  page.config = config;
  page.ds = SDK_APP;
  const visitorId = "visitorId";
  page.visitorId = visitorId;
  assertEquals(page.isReady(), true);

  //test method apiKey
  // deno-lint-ignore no-explicit-any
  const apiKeys: any = {
    [VISITOR_ID_API_ITEM]: visitorId,
    [DS_API_ITEM]: SDK_APP,
    [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
    [T_API_ITEM]: HitType.PAGE_VIEW,
    [DL_API_ITEM]: url,
  };

  assertEquals(page.toApiKeys(), apiKeys);

  //test log page url
  page.pageUrl = "";
  assertEquals(page.pageUrl, url);

  assertEquals(logError.calls.length, 1);

  assertEquals(logError.calls, [
    {
      args: [sprintf(TYPE_ERROR, "pageUrl", "string"), "pageUrl"],
      self: logManager,
    },
  ]);
});
