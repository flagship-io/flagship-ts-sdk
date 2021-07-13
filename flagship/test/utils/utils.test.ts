import { logError, logInfo, sprintf } from "../../src/utils/utils";
import { jest, expect, it, describe } from "@jest/globals";
import { DecisionApiConfig } from "../../src/config/index";
import { FlagshipLogManager } from "../../src/utils/FlagshipLogManager";
import { LogLevel } from "../../src/enum/index";

describe("test sprintf function", () => {
  it("should ", () => {
    const textToTest = "My name is {0} {1}";
    const output = sprintf(textToTest, "merveille", "kitoko");
    expect(output).toBe("My name is merveille kitoko");
  });
});

describe("test logError function", () => {
  const config = new DecisionApiConfig();

  const logManager = new FlagshipLogManager();

  const errorMethod = jest.spyOn(logManager, "error");

  config.logManager = logManager;

  const messageAll = "this is a log message";
  const tag = "tag";

  it("test logError level ALL", () => {
    logError(config, messageAll, tag);
    expect(errorMethod).toBeCalledTimes(1);
    expect(errorMethod).toBeCalledWith(messageAll, tag);
  });

  it("test level EMERGENCY", () => {
    config.logLevel = LogLevel.EMERGENCY;
    const messageEmergency = "emergency";
    logError(config, messageEmergency, tag);
    expect(errorMethod).toBeCalledTimes(0);
  });

  it("test level NONE", () => {
    config.logLevel = LogLevel.NONE;
    const messageNone = "none";
    logError(config, messageNone, tag);
    expect(errorMethod).toBeCalledTimes(0);
  });

  it("test level INFO", () => {
    config.logLevel = LogLevel.INFO;
    const messageInfo = "this a message with info level";
    logError(config, messageInfo, tag);
    expect(errorMethod).toBeCalledTimes(1);
    expect(errorMethod).toBeCalledWith(messageInfo, tag);
  });

  it("test invalid config", () => {
    logError({} as DecisionApiConfig, messageAll, tag);
    expect(errorMethod).toBeCalledTimes(0);
  });
});

describe("test logInfo function", () => {
  const config = new DecisionApiConfig();

  const logManager = new FlagshipLogManager();

  const infoMethod = jest.spyOn(logManager, "info");

  config.logManager = logManager;

  const messageAll = "this is a log message";
  const tag = "tag";

  it("test logError level ALL", () => {
    logInfo(config, messageAll, tag);
    expect(infoMethod).toBeCalledTimes(1);
    expect(infoMethod).toBeCalledWith(messageAll, tag);
  });

  it("test level EMERGENCY", () => {
    config.logLevel = LogLevel.EMERGENCY;
    const messageEmergency = "emergency";
    logInfo(config, messageEmergency, tag);
    expect(infoMethod).toBeCalledTimes(0);
  });

  it("test level NONE", () => {
    config.logLevel = LogLevel.NONE;
    const messageNone = "none";
    logInfo(config, messageNone, tag);
    expect(infoMethod).toBeCalledTimes(0);
  });

  it("test level INFO", () => {
    config.logLevel = LogLevel.INFO;
    const messageInfo = "this a message with info level";
    logInfo(config, messageInfo, tag);
    expect(infoMethod).toBeCalledTimes(1);
    expect(infoMethod).toBeCalledWith(messageInfo, tag);
  });

  it("test invalid config", () => {
    logError({} as DecisionApiConfig, messageAll, tag);
    expect(infoMethod).toBeCalledTimes(0);
  });
});
