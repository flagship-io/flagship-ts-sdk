import { logError, logInfo, sprintf } from "../../src/utils/utils.ts";
import { assertEquals, stub } from "../../deps.ts";
import { DecisionApiConfig } from "../../src/config/index.ts";
import { FlagshipLogManager } from "../../src/utils/FlagshipLogManager.ts";
import { LogLevel } from "../../src/enum/index.ts";

Deno.test("test sprintf function", () => {
  const textToTest = "My name is {0} {1}";
  const output = sprintf(textToTest, "merveille", "kitoko");
  assertEquals(output, "My name is merveille kitoko");
});

Deno.test("test logError function", () => {
  const config = new DecisionApiConfig();

  const logManager = new FlagshipLogManager();

  const errorMethod = stub(logManager, "error");

  config.logManager = logManager;

  const messageAll = "this is a log message";
  const tag = "tag";

  //test logError level ALL
  logError(config, messageAll, tag);

  //test level EMERGENCY
  config.logLevel = LogLevel.EMERGENCY;
  const messageEmergency = "emergency";
  logError(config, messageEmergency, tag);

  //test level NONE
  config.logLevel = LogLevel.NONE;
  const messageNone = "none";
  logError(config, messageNone, tag);

  //test level INFO
  config.logLevel = LogLevel.INFO;
  const messageInfo = "this a message with info level";
  logError(config, messageInfo, tag);

  //test invalid config
  logError({} as DecisionApiConfig, messageAll, tag);

  assertEquals(errorMethod.calls, [
    { args: [messageAll, tag], self: logManager },
    { args: [messageInfo, tag], self: logManager },
  ]);
});

Deno.test("test logInfo function", () => {
  const config = new DecisionApiConfig();

  const logManager = new FlagshipLogManager();

  const infoMethod = stub(logManager, "info");

  config.logManager = logManager;

  const messageAll = "this is a log message";
  const tag = "tag";

  //test logInfo level ALL
  logInfo(config, messageAll, tag);

  //test level EMERGENCY
  config.logLevel = LogLevel.EMERGENCY;
  const messageEmergency = "emergency";
  logInfo(config, messageEmergency, tag);

  //test level NONE
  config.logLevel = LogLevel.NONE;
  const messageNone = "none";
  logInfo(config, messageNone, tag);

  //test level DEBUG
  config.logLevel = LogLevel.DEBUG;
  const messageInfo = "this a message with info level";
  logInfo(config, messageInfo, tag);

  //test invalid config
  logInfo({} as DecisionApiConfig, messageAll, tag);

  assertEquals(infoMethod.calls, [
    { args: [messageAll, tag], self: logManager },
    { args: [messageInfo, tag], self: logManager },
  ]);
});
