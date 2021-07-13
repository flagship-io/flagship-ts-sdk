import { jest, expect, it, describe } from "@jest/globals";
import { ConfigManager, DecisionApiConfig } from "../../src/config/index";
import { ApiManager } from "../../src/decision/ApiManager";
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
} from "../../src/enum/index";
import { IHttpResponse } from "../../src/utils/httpClient";
import { NodeHttpClient } from "../../src/utils/NodeHttpClient";
import { Visitor } from "../../src/visitor/Visitor";
import { campaigns } from "./campaigns";

describe("test ApiManager", () => {
  const httpClient = new NodeHttpClient();
  const postAsync = jest.spyOn(httpClient, "postAsync");
  const config = new DecisionApiConfig("envId", "apiKey");
  const apiManager = new ApiManager(httpClient, config);

  const visitorId = "visitorId";
  const context = { age: 20 };

  const visitor = new Visitor(visitorId, context, {} as ConfigManager);

  const panicModeResponse = { status: 200, body: { panic: true } };

  const campaignResponse = { status: 200, body: campaigns };

  const responseError: IHttpResponse = { status: 400, body: null };

  //Test http request data
  const headers = {
    [HEADER_X_API_KEY]: `${config.apiKey}`,
    [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE,
    [HEADER_X_SDK_VERSION]: SDK_VERSION,
    [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON,
  };
  const postData = {
    visitorId: visitor.visitorId,
    trigger_hit: false,
    context: visitor.context,
  };
  const url = `${BASE_API_URL}${config.envId}${URL_CAMPAIGNS}?${EXPOSE_ALL_KEYS}=true`;

  it("test panic mode ", async () => {
    postAsync.mockResolvedValue(panicModeResponse);
    const modifications = await apiManager.getCampaignsModificationsAsync(
      visitor
    );
    expect(postAsync).toHaveBeenCalledWith(url, {
      headers: headers,
      timeout: config.timeout,
      body: postData,
    });
    expect(modifications.size).toBe(0);
    expect(apiManager.isPanic()).toBeTruthy();
  });

  it("test campaign", async () => {
    postAsync.mockResolvedValue(campaignResponse);

    const modifications = await apiManager.getCampaignsModificationsAsync(
      visitor
    );

    expect(postAsync).toHaveBeenCalledWith(url, {
      headers: headers,
      timeout: config.timeout,
      body: postData,
    });

    expect(modifications.size).toBe(4);
    expect(modifications.get("array").value).toEqual([1, 1, 1]);
    expect(modifications.get("object").value).toEqual({ value: 123456 });
  });

  it("Test error ", async () => {
    postAsync.mockRejectedValue(responseError);
    const modifications = await apiManager.getCampaignsModificationsAsync(
      visitor
    );
    expect(postAsync).toHaveBeenCalledTimes(1);
    expect(modifications.size).toBe(0);
  });
});
