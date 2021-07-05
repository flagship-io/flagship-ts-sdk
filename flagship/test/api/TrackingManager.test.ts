import { TrackingManager } from "../../src/api/TrackingManager.ts";
import { DecisionApiConfig } from "../../src/config/index.ts";
import { DenoHttpClient } from "../../src/utils/denoHttpClient.ts";
import { assertEquals } from "../../deps.ts";

Deno.test("should ", () => {
  const httpClient = new DenoHttpClient();
  const config = new DecisionApiConfig();
  const trackingManager = new TrackingManager(httpClient, config);
  assertEquals(config, trackingManager.config);
  assertEquals(httpClient, trackingManager.httpClient);
});
