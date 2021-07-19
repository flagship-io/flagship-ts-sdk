import { assertEquals } from "../../deps.ts";
import { DecisionMode } from "../../src/config/FlagshipConfig.ts";
import { DecisionApiConfig } from "../../src/config/index.ts";
import {
  FlagshipStatus,
  LogLevel,
  REQUEST_TIME_OUT,
} from "../../src/enum/index.ts";
import { IFlagshipLogManager } from "../../src/utils/FlagshipLogManager.ts";

Deno.test("test DecisionApiConfig", () => {
  const config = new DecisionApiConfig();
  assertEquals(config.apiKey, undefined);
  assertEquals(config.envId, undefined);
  assertEquals(config.logLevel, LogLevel.ALL);
  assertEquals(config.logManager, undefined);
  assertEquals(config.getStatusChangedCallback(), undefined);
  assertEquals(config.timeout, REQUEST_TIME_OUT);
  assertEquals(config.decisionMode, DecisionMode.DECISION_API);

  //Test envId field
  const envId = "envId";
  config.envId = envId;
  assertEquals(config.envId, envId);

  //Test apiKey field
  const apiKey = "apiKey";
  config.apiKey = apiKey;
  assertEquals(config.apiKey, apiKey);

  //Test logLevel
  config.logLevel = LogLevel.INFO;
  assertEquals(config.logLevel, LogLevel.INFO);

  //Test logManager
  const logManager = {} as IFlagshipLogManager;
  config.logManager = logManager;
  assertEquals(config.logManager, logManager);

  //test statusChangedCallback
  const func = {} as (status: FlagshipStatus) => void;
  config.setStatusChangedCallback(func);
  assertEquals(config.getStatusChangedCallback(), undefined);

  const func2 = (_status: FlagshipStatus) => {};
  config.setStatusChangedCallback(func2);

  assertEquals(config.getStatusChangedCallback(), func2);

  config.timeout = 3000;
  assertEquals(config.timeout, 3000);
});
