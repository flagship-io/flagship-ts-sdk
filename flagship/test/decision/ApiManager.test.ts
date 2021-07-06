import { assertEquals, Stub, stub } from "../../deps.ts";
import { ConfigManager, DecisionApiConfig } from "../../src/config/index.ts";
import { ApiManager } from "../../src/decision/ApiManager.ts";
import {
  BASE_API_URL,
  EXPOSE_ALL_KEYS,
  HEADER_APPLICATION_JSON,
  HEADER_CONTENT_TYPE,
  HEADER_X_API_KEY,
  HEADER_X_SDK_CLIENT,
  HEADER_X_SDK_VERSION,
  SDK_LANGUAGE,
  SDK_VERSION,
  URL_CAMPAIGNS,
} from "../../src/enum/index.ts";
import { DenoHttpClient } from "../../src/utils/denoHttpClient.ts";
import { Visitor } from "../../src/visitor/Visitor.ts";
import { campaigns } from "./campaigns.ts";

Deno.test("test ApiManager", async () => {
  const httpClient = new DenoHttpClient();
  const postAsync: Stub<DenoHttpClient> = stub(httpClient, "postAsync");
  const config = new DecisionApiConfig("envId", "apiKey");
  const apiManager = new ApiManager(httpClient, config);

  const visitorId = "visitorId";
  const context = { age: 20 };

  const visitor = new Visitor(visitorId, context, {} as ConfigManager);

  const panicModeResponse = new Promise((resolve) =>
    resolve({ status: 200, body: { panic: true } })
  );

  const campaignResponse = new Promise((resolve) =>
    resolve({ status: 200, body: campaigns })
  );

  const responseError = new Promise((_, reject) =>
    reject({ status: 200, body: campaigns })
  );

  postAsync.returns = [panicModeResponse, campaignResponse, responseError];

  //test panic mode
  let modifications = await apiManager.getCampaignsModificationsAsync(visitor);

  assertEquals(modifications.size, 0);
  assertEquals(apiManager.isPanic(), true);

  //test panic campaign
  modifications = await apiManager.getCampaignsModificationsAsync(visitor);

  assertEquals(postAsync.calls.length, 2);

  assertEquals(modifications.size, 4);
  assertEquals(modifications.get("array")?.value, [1, 1, 1]);
  assertEquals(modifications.get("object")?.value, { value: 123456 });

  //Test error
  modifications = await apiManager.getCampaignsModificationsAsync(visitor);

  assertEquals(postAsync.calls.length, 3);
  assertEquals(modifications.size, 0);

  //Test http request data
  const headers = {
    [HEADER_X_API_KEY]: `${config.apiKey}`,
    [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE,
    [HEADER_X_SDK_VERSION]: SDK_VERSION,
    [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON,
  };
  const postData = {
    visitorId: visitor.visitorId,
    // deno-lint-ignore camelcase
    trigger_hit: false,
    context: visitor.context,
  };
  const url = `${BASE_API_URL}${config.envId}${URL_CAMPAIGNS}?${EXPOSE_ALL_KEYS}=true`;

  assertEquals(postAsync.calls, [
    {
      args: [
        url,
        { headers: headers, timeout: config.timeout, body: postData },
      ],
      returned: panicModeResponse,
      self: httpClient,
    },
    {
      args: [
        url,
        { headers: headers, timeout: config.timeout, body: postData },
      ],
      returned: campaignResponse,
      self: httpClient,
    },
    {
      args: [
        url,
        { headers: headers, timeout: config.timeout, body: postData },
      ],
      returned: responseError,
      self: httpClient,
    },
  ]);
});
