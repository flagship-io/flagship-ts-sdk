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
import { Screen } from "../../src/hit/index.ts";
import { ERROR_MESSAGE } from "../../src/hit/Screen.ts";
import { FlagshipLogManager } from "../../src/utils/FlagshipLogManager.ts";
import { sprintf } from "../../src/utils/utils.ts";

Deno.test("test hit type Page", () => {
  const screenName = "home";
  const screen = new Screen(screenName);
  assertEquals(screen.screenName, screenName);

  assertEquals(screen.getErrorMessage(), ERROR_MESSAGE);

  assertEquals(screen.isReady(), false);

  const logManager = new FlagshipLogManager();
  const logError = stub(logManager, "error");

  const config = new DecisionApiConfig("envId", "apiKey");
  config.logManager = logManager;
  screen.config = config;
  screen.ds = SDK_APP;
  const visitorId = "visitorId";
  screen.visitorId = visitorId;
  assertEquals(screen.isReady(), true);

  //test method apiKey
  // deno-lint-ignore no-explicit-any
  const apiKeys: any = {
    [VISITOR_ID_API_ITEM]: visitorId,
    [DS_API_ITEM]: SDK_APP,
    [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
    [T_API_ITEM]: HitType.SCREEN_VIEW,
    [DL_API_ITEM]: screenName,
  };

  assertEquals(screen.toApiKeys(), apiKeys);

  //test log screenName url
  screen.screenName = "";
  assertEquals(screen.screenName, screenName);

  assertEquals(logError.calls.length, 1);

  assertEquals(logError.calls, [
    {
      args: [sprintf(TYPE_ERROR, "screenName", "string"), "screenName"],
      self: logManager,
    },
  ]);
});
