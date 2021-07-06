import { TrackingManager } from "../../src/api/TrackingManager.ts";
import { ConfigManager, DecisionApiConfig } from "../../src/config/index.ts";
import { DenoHttpClient } from "../../src/utils/denoHttpClient.ts";
import { assertEquals, Stub, stub } from "../../deps.ts";
import { Visitor } from "../../src/visitor/Visitor.ts";
import { Modification } from "../../src/model/Modification.ts";
import {
  BASE_API_URL,
  CUSTOMER_ENV_ID_API_ITEM,
  HEADER_APPLICATION_JSON,
  HEADER_CONTENT_TYPE,
  HEADER_X_API_KEY,
  HEADER_X_SDK_CLIENT,
  HEADER_X_SDK_VERSION,
  HIT_API_URL,
  SDK_LANGUAGE,
  SDK_VERSION,
  URL_ACTIVATE_MODIFICATION,
  VARIATION_GROUP_ID_API_ITEM,
  VARIATION_ID_API_ITEM,
  VISITOR_ID_API_ITEM,
} from "../../src/enum/index.ts";
import { IHttpResponse } from "../../src/utils/httpClient.ts";
import { Page } from "../../src/hit/index.ts";

Deno.test("test TrackingManager sendActive ", () => {
  const httpClient = new DenoHttpClient();
  const postAsync: Stub<DenoHttpClient> = stub(httpClient, "postAsync");

  const config = new DecisionApiConfig("envId", "apiKey");

  const trackingManager = new TrackingManager(httpClient, config);

  assertEquals(config, trackingManager.config);
  assertEquals(httpClient, trackingManager.httpClient);

  const visitorId = "visitorId";
  const context = { age: 20 };

  const visitor = new Visitor(visitorId, context, {} as ConfigManager);
  const modification = new Modification(
    "key",
    "campaignId",
    "variationGroupId",
    "variationId",
    false,
    "value"
  );

  const postResponse: Promise<IHttpResponse> = new Promise((resolve) =>
    resolve({ status: 204, body: null })
  );
  const postResponseError: Promise<IHttpResponse> = new Promise((_, reject) =>
    reject({ status: 400, body: null })
  );
  postAsync.returns = [postResponse, postResponseError];
  trackingManager.sendActive(visitor, modification);
  trackingManager.sendActive(visitor, modification);
  assertEquals(postAsync.calls.length, 2);

  const url = `${BASE_API_URL}${URL_ACTIVATE_MODIFICATION}`;
  const headers = {
    [HEADER_X_API_KEY]: `${config.apiKey}`,
    [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE,
    [HEADER_X_SDK_VERSION]: SDK_VERSION,
    [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON,
  };

  const postData = {
    [VISITOR_ID_API_ITEM]: visitor.visitorId,
    [VARIATION_ID_API_ITEM]: modification.variationId,
    [VARIATION_GROUP_ID_API_ITEM]: modification.variationGroupId,
    [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
  };

  assertEquals(postAsync.calls, [
    {
      args: [
        url,
        { headers: headers, timeout: config.timeout, body: postData },
      ],
      returned: postResponse,
      self: httpClient,
    },
    {
      args: [
        url,
        { headers: headers, timeout: config.timeout, body: postData },
      ],
      returned: postResponseError,
      self: httpClient,
    },
  ]);
});

Deno.test("test TrackingManager sendHit ", () => {
  const httpClient = new DenoHttpClient();
  const postAsync: Stub<DenoHttpClient> = stub(httpClient, "postAsync");
  const config = new DecisionApiConfig("envId", "apiKey");
  const trackingManager = new TrackingManager(httpClient, config);

  const hit = new Page("url");
  hit.config = config;
  const postResponse: Promise<IHttpResponse> = new Promise((resolve) =>
    resolve({ status: 204, body: null })
  );

  const postResponseError: Promise<IHttpResponse> = new Promise((_, reject) =>
    reject({ status: 400, body: null })
  );

  postAsync.returns = [postResponse, postResponseError];
  trackingManager.sendHit(hit);
  trackingManager.sendHit(hit);
  console.log(postAsync.calls);
  assertEquals(postAsync.calls.length, 2);

  const headers = {
    [HEADER_X_API_KEY]: `${config.apiKey}`,
    [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE,
    [HEADER_X_SDK_VERSION]: SDK_VERSION,
    [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON,
  };
  assertEquals(postAsync.calls, [
    {
      args: [
        HIT_API_URL,
        { headers: headers, timeout: config.timeout, body: hit.toApiKeys() },
      ],
      returned: postResponse,
      self: httpClient,
    },
    {
      args: [
        HIT_API_URL,
        { headers: headers, timeout: config.timeout, body: hit.toApiKeys() },
      ],
      returned: postResponseError,
      self: httpClient,
    },
  ]);
});
