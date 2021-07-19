import { expect, it, describe } from "@jest/globals";
import { DecisionApiConfig, DecisionMode } from "../../src/config/index";
import {
  FlagshipStatus,
  LogLevel,
  REQUEST_TIME_OUT,
} from "../../src/enum/index";
import { IFlagshipLogManager } from "../../src/utils/FlagshipLogManager";

describe("test DecisionApiConfig", () => {
  const config = new DecisionApiConfig();

  it("should ", () => {
    expect(config.apiKey).toBeUndefined();
    expect(config.envId).toBeUndefined();
    expect(config.logLevel).toBe(LogLevel.ALL);
    expect(config.logManager).toBeUndefined();
    expect(config.getStatusChangedCallback()).toBeUndefined();
    expect(config.timeout).toBe(REQUEST_TIME_OUT);
    expect(config.decisionMode).toBe(DecisionMode.DECISION_API);
  });

  it("Test envId field ", () => {
    const envId = "envId";
    config.envId = envId;
    expect(config.envId).toBe(envId);
  });

  it("Test apiKey field", () => {
    const apiKey = "apiKey";
    config.apiKey = apiKey;
    expect(config.apiKey).toBe(apiKey);
  });

  it("Test logLevel", () => {
    config.logLevel = LogLevel.INFO;
    expect(config.logLevel).toBe(LogLevel.INFO);
  });

  it("Test logManager", () => {
    const logManager = {} as IFlagshipLogManager;
    config.logManager = logManager;
    expect(config.logManager).toBe(logManager);
  });

  it("test statusChangedCallback", () => {
    const func = {} as (status: FlagshipStatus) => void;
    config.setStatusChangedCallback(func);
    expect(config.getStatusChangedCallback()).toBeUndefined();

    const func2 = () => {
      //
    };
    config.setStatusChangedCallback(func2);

    expect(config.getStatusChangedCallback()).toBe(func2);

    config.timeout = 3000;
    expect(config.timeout).toBe(3000);
  });
});
