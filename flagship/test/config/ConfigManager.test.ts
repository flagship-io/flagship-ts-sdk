import { assertEquals } from "../../deps.ts";
import { TrackingManager } from "../../src/api/TrackingManager.ts";
import { ConfigManager, DecisionApiConfig } from "../../src/config/index.ts";
import { ApiManager } from "../../src/decision/ApiManager.ts";
import { IHttpClient } from "../../src/utils/httpClient.ts";

Deno.test("test ConfigManager", () => {
  const config = {} as DecisionApiConfig;
  const decisionManager = {} as ApiManager;
  const trackingManager = {} as TrackingManager;
  const configManager = new ConfigManager(
    config,
    decisionManager,
    trackingManager,
  );

  assertEquals(configManager.config, config);
  assertEquals(configManager.decisionManager, decisionManager);
  assertEquals(configManager.trackingManager, trackingManager);

  //Test set config
  const config2 = new DecisionApiConfig();
  configManager.config = config2;
  assertEquals(configManager.config, config2);

  //Test set decisionManager
  const decisionManager2 = new ApiManager(
    {} as IHttpClient,
    {} as DecisionApiConfig,
  );
  configManager.decisionManager = decisionManager2;
  assertEquals(configManager.decisionManager, decisionManager2);

  //Test set TrackingManager
  const trackingManager2 = new TrackingManager(
    {} as IHttpClient,
    {} as DecisionApiConfig,
  );
  configManager.trackingManager = trackingManager2;
  assertEquals(configManager.trackingManager, trackingManager2);
});
