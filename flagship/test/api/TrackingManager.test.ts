import { jest, expect, it, describe } from "@jest/globals";
import { TrackingManager } from "../../src/api/TrackingManager";
import { ConfigManager, DecisionApiConfig } from "../../src/config/index";
import { NodeHttpClient } from "../../src/utils/NodeHttpClient";
import { Visitor } from "../../src/visitor/Visitor";
import { Modification } from "../../src/model/Modification";
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
} from "../../src/enum/index";
import { IHttpResponse } from "../../src/utils/httpClient";
import { Page } from "../../src/hit/index";

//mock NodeHttpClient
jest.mock("../../src/utils/NodeHttpClient");

describe("test TrackingManager sendActive ", () => {
  it("should ", async () => {
    const httpClient = new NodeHttpClient();

    const postAsync = jest.spyOn(httpClient, "postAsync");

    const config = new DecisionApiConfig("envId", "apiKey");

    const trackingManager = new TrackingManager(httpClient, config);

    expect(config).toBe(trackingManager.config);
    expect(httpClient).toBe(trackingManager.httpClient);

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

    //Test http request data
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

    const postResponse: IHttpResponse = { status: 204, body: null };
    const postResponseError: IHttpResponse = { status: 400, body: null };

    try {
      postAsync.mockResolvedValue(postResponse);
      await trackingManager.sendActive(visitor, modification);

      expect(postAsync).toHaveBeenCalledWith(url, {
        headers: headers,
        timeout: config.timeout,
        body: postData,
      });

      postAsync.mockRejectedValue(postResponseError);
      await trackingManager.sendActive(visitor, modification);
      expect(postAsync).toHaveBeenCalledWith(url, {
        headers: headers,
        timeout: config.timeout,
        body: postData,
      });
    } catch (error) {
      expect(error).toBe(postResponseError);
    }

    expect(postAsync).toHaveBeenCalledTimes(2);
  });
});

describe("test TrackingManager sendHit ", () => {
  it(" should", async () => {
    const httpClient = new NodeHttpClient();
    const postAsync = jest.spyOn(httpClient, "postAsync");

    const config = new DecisionApiConfig("envId", "apiKey");
    const trackingManager = new TrackingManager(httpClient, config);

    const hit = new Page("url");
    hit.config = config;

    const headers = {
      [HEADER_X_API_KEY]: `${config.apiKey}`,
      [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE,
      [HEADER_X_SDK_VERSION]: SDK_VERSION,
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON,
    };

    const postResponse: IHttpResponse = { status: 204, body: null };

    const postResponseError: IHttpResponse = { status: 400, body: null };

    try {
      postAsync.mockResolvedValue(postResponse);
      await trackingManager.sendHit(hit);
      expect(postAsync).toBeCalledWith(HIT_API_URL, {
        headers: headers,
        timeout: config.timeout,
        body: hit.toApiKeys(),
      });

      postAsync.mockRejectedValue(postResponseError);
      await trackingManager.sendHit(hit);
      expect(postAsync).toBeCalledWith(HIT_API_URL, {
        headers: headers,
        timeout: config.timeout,
        body: hit.toApiKeys(),
      });
    } catch (error) {
      expect(error).toBe(postResponseError);
    }
    expect(postAsync).toHaveBeenCalledTimes(2);
  });
});
