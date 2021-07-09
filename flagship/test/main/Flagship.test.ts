import { assertEquals, assertExists, stub } from "../../deps.ts";
import { ConfigManager, DecisionApiConfig } from "../../src/config/index.ts";
import {
  FlagshipStatus,
  INITIALIZATION_PARAM_ERROR,
  PROCESS_INITIALIZATION,
  SDK_STARTED_INFO,
  SDK_VERSION,
} from "../../src/enum/index.ts";
import { Flagship } from "../../src/main/Flagship.ts";
import { FlagshipLogManager } from "../../src/utils/FlagshipLogManager.ts";
import { sprintf } from "../../src/utils/utils.ts";

Deno.test("test Flagship class", () => {
  const envId = "envId";
  const apiKey = "apiKey";
  Flagship.start(envId, apiKey);

  assertExists(Flagship.getConfig());
  assertEquals(Flagship.getConfig() instanceof DecisionApiConfig, true);

  assertEquals(Flagship.getConfig().envId, envId);
  assertEquals(Flagship.getConfig().apiKey, apiKey);
  assertExists(Flagship.getConfig().logManager);
  assertEquals(Flagship.getStatus(), FlagshipStatus.READY);
  assertEquals(
    Flagship.getConfig().logManager instanceof FlagshipLogManager,
    true
  );
});

Deno.test("test Flagship with custom config", () => {
  const envId = "envId";
  const apiKey = "apiKey";

  const config = new DecisionApiConfig();
  let countStatus = 0;
  config.setStatusChangedCallback((status) => {
    switch (countStatus) {
      case 0:
        assertEquals(status, FlagshipStatus.NOT_READY);
        break;
      case 1:
        assertEquals(status, FlagshipStatus.READY);
        break;
      case 2:
        assertEquals(status, FlagshipStatus.NOT_READY);
        break;

      default:
        break;
    }
    countStatus++;
  });
  const logManager = new FlagshipLogManager();
  const errorLog = stub(logManager, "error");
  const infoLog = stub(logManager, "info");
  config.logManager = logManager;
  Flagship.start(envId, apiKey, config);

  assertExists(Flagship.getConfig());
  assertEquals(Flagship.getConfig(), config);
  assertEquals(Flagship.getConfig().envId, envId);
  assertEquals(Flagship.getConfig().apiKey, apiKey);
  assertEquals(Flagship.getConfig().logManager, logManager);

  assertEquals(Flagship.getStatus(), FlagshipStatus.READY);

  assertEquals(infoLog.calls, [
    {
      args: [sprintf(SDK_STARTED_INFO, SDK_VERSION), PROCESS_INITIALIZATION],
      self: logManager,
    },
  ]);

  Flagship.start("", "", config);
  assertEquals(Flagship.getStatus(), FlagshipStatus.NOT_READY);

  assertEquals(errorLog.calls, [
    {
      args: [INITIALIZATION_PARAM_ERROR, PROCESS_INITIALIZATION],
      self: logManager,
    },
  ]);
});

// deno-lint-ignore no-explicit-any
const getNull = (): any => {
  return null;
};

Deno.test("test Flagship newVisitor", () => {
  Flagship.start("envId", "apiKey");
  const visitorId = "visitorId";
  const context = { isVip: true };
  const visitor = Flagship.newVisitor(visitorId, context);
  assertEquals(visitor?.visitorId, visitorId);
  assertEquals(visitor?.context, context);
  assertEquals(visitor?.configManager instanceof ConfigManager, true);

  const visitorNull = Flagship.newVisitor(getNull(), context);
  assertEquals(visitorNull, null);
});
