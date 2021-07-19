import { expect, it, describe } from "@jest/globals";
import { TrackingManager } from "../../src/api/TrackingManager";
import { ConfigManager, DecisionApiConfig } from "../../src/config/index";
import { ApiManager } from "../../src/decision/ApiManager";
import { IHttpClient } from "../../src/utils/httpClient";

describe("test ConfigManager", () => {
  const config = {} as DecisionApiConfig;
  const decisionManager = {} as ApiManager;
  const trackingManager = {} as TrackingManager;
  const configManager = new ConfigManager(
    config,
    decisionManager,
    trackingManager
  );

  it("should", () => {
    expect(configManager.config).toBe(config);
    expect(configManager.decisionManager).toBe(decisionManager);
    expect(configManager.trackingManager).toBe(trackingManager);
  });

  it("Test set config ", () => {
    const config2 = new DecisionApiConfig();
    configManager.config = config2;
    expect(configManager.config).toBe(config2);
  });

  it("Test set decisionManager", () => {
    const decisionManager2 = new ApiManager(
      {} as IHttpClient,
      {} as DecisionApiConfig
    );
    configManager.decisionManager = decisionManager2;
    expect(configManager.decisionManager).toBe(decisionManager2);
  });

  it("Test set TrackingManager", () => {
    const trackingManager2 = new TrackingManager(
      {} as IHttpClient,
      {} as DecisionApiConfig
    );
    configManager.trackingManager = trackingManager2;
    expect(configManager.trackingManager).toBe(trackingManager2);
  });
});
