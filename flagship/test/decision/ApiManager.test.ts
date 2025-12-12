import { jest, expect, it, describe, beforeAll, afterAll } from '@jest/globals';
import { TrackingManager } from '../../src/api/TrackingManager';
import { DecisionApiConfig } from '../../src/config/index';
import { ApiManager } from '../../src/decision/ApiManager';
import { BASE_API_URL,
  EXPOSE_ALL_KEYS,
  FSSdkStatus,
  HEADER_APPLICATION_JSON,
  HEADER_CONTENT_TYPE,
  HEADER_X_API_KEY,
  HEADER_X_SDK_CLIENT,
  HEADER_X_SDK_VERSION,
  SDK_INFO,
  URL_CAMPAIGNS } from '../../src/enum/index';
import { IHttpResponse, HttpClient } from '../../src/utils/HttpClient';
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate';
import { campaigns } from './campaigns';
import { CampaignDTO, FlagsStatus } from '../../src';
import { errorFormat } from '../../src/utils/utils';
import { FSFetchReasons } from '../../src/enum/FSFetchReasons';
import { FSFetchStatus } from '../../src/enum/FSFetchStatus';
import { VisitorAbstract } from '../../src/visitor/VisitorAbstract';
import { IEmotionAI } from '../../src/emotionAI/IEmotionAI';
import { DecisionManager } from '../../src/decision/DecisionManager';
import { VisitorVariationState } from '../../src/type.local';

describe('ApiManager', () => {
  const methodNow = Date.now;
  const mockNow = jest.fn<typeof Date.now>();
  beforeAll(() => {
    Date.now = mockNow;
    mockNow.mockReturnValue(1);
  });
  afterAll(() => {
    Date.now = methodNow;
  });
  const httpClient = new HttpClient();
  const postAsync = jest.spyOn(httpClient, 'postAsync');
  const config = new DecisionApiConfig({
    envId: 'envId',
    apiKey: 'apiKey'
  });
  const trackingManager = new TrackingManager(httpClient, config);

  const apiManager = new ApiManager({
    httpClient,
    config,
    trackingManager
  });

  apiManager.trackingManager = trackingManager;

  const visitorId = 'visitorId';
  const context = { age: 20 };

  const OnFlagStatusChanged = jest.fn<({ status, reason }: FlagsStatus) => void>();

  const emotionAi = { init: jest.fn<(visitor:VisitorAbstract) => void>() } as unknown as IEmotionAI;

  const createDecisionManager = (flagshipInstanceId?: string) => {
    return new ApiManager({
      httpClient,
      config,
      trackingManager,
      flagshipInstanceId
    });
  };

  const createVisitor = (decisionManager: DecisionManager,visitorVariationState?:VisitorVariationState, hasConsented = true) => {
    const emotionAi = { init: jest.fn<(visitor: VisitorAbstract) => void>() } as unknown as IEmotionAI;

    return new VisitorDelegate({
      hasConsented,
      visitorId: 'visitorId',
      context: { age: 20 },
      configManager: {
        config,
        decisionManager,
        trackingManager
      },
      onFlagsStatusChanged: OnFlagStatusChanged,
      emotionAi,
      visitorVariationState
    });
  };

  const visitor = new VisitorDelegate({
    hasConsented: true,
    visitorId,
    context,
    configManager: {
      config,
      decisionManager: apiManager,
      trackingManager
    },
    onFlagsStatusChanged: OnFlagStatusChanged,
    emotionAi
  });

  const campaignResponse = {
    status: 200,
    body: campaigns
  };

  const responseError: IHttpResponse = {
    status: 400,
    body: null
  };

  // Test http request data
  const headers = {
    [HEADER_X_API_KEY]: `${config.apiKey}`,
    [HEADER_X_SDK_CLIENT]: SDK_INFO.name,
    [HEADER_X_SDK_VERSION]: SDK_INFO.version,
    [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
  };
  const postData = {
    visitorId: visitor.visitorId,
    anonymousId: visitor.anonymousId,
    trigger_hit: false,
    context: visitor.context,
    visitor_consent: visitor.hasConsented
  };
  const url = `${BASE_API_URL}${config.envId}${URL_CAMPAIGNS}?${EXPOSE_ALL_KEYS}=true&extras[]=accountSettings`;

  it('should return null and set SDK_PANIC status when panic mode is enabled', async () => {
    const apiManager = createDecisionManager();

    const panicModeResponse = {
      status: 200,
      body: { panic: true }
    };

    postAsync.mockResolvedValue(panicModeResponse);
    apiManager.statusChangedCallback((status) => {
      expect(status).toBe(FSSdkStatus.SDK_PANIC);
    });

    const campaigns = await apiManager.getCampaignsAsync(visitor);

    expect(postAsync).toHaveBeenCalledWith(url, {
      headers,
      nextFetchConfig: { revalidate: 20 },
      timeout: config.timeout,
      body: postData
    });

    expect(campaigns).toBeNull();
    expect(apiManager.isPanic()).toBeTruthy();
  });

  it('should fetch campaigns and extract modifications with troubleshooting data', async () => {
    postAsync.mockResolvedValue(campaignResponse);

    const campaigns = await apiManager.getCampaignsAsync(
      visitor
    );
    const modifications = apiManager.getModifications(campaigns as CampaignDTO[]);

    expect(postAsync).toHaveBeenCalledWith(url, {
      headers,
      nextFetchConfig: { revalidate: 20 },
      timeout: config.timeout,
      body: postData
    });

    expect(modifications.size).toBe(4);
    expect(modifications.get('array')?.value).toEqual([1, 1, 1]);
    expect(modifications.get('object')?.value).toEqual({ value: 123456 });
    expect(apiManager.troubleshooting?.startDate.toISOString()).toBe('2023-04-13T09:33:38.049Z');
    expect(apiManager.troubleshooting?.endDate.toISOString()).toBe('2023-04-13T10:03:38.049Z');
    expect(apiManager.troubleshooting?.traffic).toBe(40);
  });

  it('should handle error and trigger onFetchFlagsStatusChanged callback when campaign fetch fails', async () => {
    postAsync.mockRejectedValue(responseError);

    try {
      await apiManager.getCampaignsAsync(visitor);

      expect(visitor.onFetchFlagsStatusChanged).toBeCalledTimes(1);
      expect(visitor.onFetchFlagsStatusChanged).toHaveBeenNthCalledWith(1, {
        newStatus: FSFetchStatus.FETCH_REQUIRED,
        reason: FSFetchReasons.FLAGS_FETCHING_ERROR
      });

    } catch (err:any) {

      expect(err.message).toEqual(errorFormat(responseError as any, {
        url,
        headers,
        body: postData,
        duration: 0
      }));
    }
  });

  it('should fetch campaigns with custom decision API URL when visitor has no consent', async () => {
    config.decisionApiUrl = 'http://new_decision_api_url';
    const url = `${config.decisionApiUrl}${config.envId}${URL_CAMPAIGNS}?${EXPOSE_ALL_KEYS}=true&extras[]=accountSettings`;
    postAsync.mockResolvedValue(campaignResponse);

    visitor.setConsent(false);

    const campaigns = await apiManager.getCampaignsAsync(
      visitor
    );
    const modifications = apiManager.getModifications(campaigns as CampaignDTO[]);

    expect(postAsync).toHaveBeenCalledWith(url, {
      headers,
      nextFetchConfig: { revalidate: 20 },
      timeout: config.timeout,
      body: {
        ...postData,
        visitor_consent: visitor.hasConsented
      }
    });

    expect(modifications.size).toBe(4);
    expect(modifications.get('array')?.value).toEqual([1, 1, 1]);
    expect(modifications.get('object')?.value).toEqual({ value: 123456 });
  });

  describe('applyCampaignsForcedAllocation', () => {
    it('should return campaigns unchanged when QA mode is disabled',async () => {
      config.isQAModeEnabled = false;
      const decisionManager = createDecisionManager();
      const visitor = createVisitor(decisionManager);

      postAsync.mockResolvedValue(campaignResponse);

      const campaigns = await apiManager.getCampaignsAsync(
        visitor
      );

      expect(campaigns).toEqual(campaignResponse.body.campaigns);

    });
    it('should return null when campaigns is null',async () => {
      config.isQAModeEnabled = true;
      const decisionManager = createDecisionManager();
      const visitor = createVisitor(decisionManager);

      postAsync.mockResolvedValue({
        status: 200,
        body: {}
      });

      const campaigns = await apiManager.getCampaignsAsync(
        visitor
      );

      expect(campaigns).toBeNull();

    });
    it('should return campaigns unchanged when no forced allocations',async () => {
      config.isQAModeEnabled = true;
      const decisionManager = createDecisionManager();
      const visitorVariationState:VisitorVariationState = { variationsForcedAllocation: {} };
      const visitor = createVisitor(decisionManager, visitorVariationState);

      postAsync.mockResolvedValue(campaignResponse);

      const campaigns = await apiManager.getCampaignsAsync(
        visitor
      );

      expect(campaigns).toEqual(campaignResponse.body.campaigns);
    });

    it('should add forced allocation campaigns',async () => {
      config.isQAModeEnabled = true;
      const decisionManager = createDecisionManager();
      const visitorVariationState:VisitorVariationState = {
        variationsForcedAllocation: {
          campaign1: {
            campaignId: 'forcedCampaign',
            campaignName: 'Forced Campaign',
            CampaignSlug: 'forced-campaign',
            variationGroupId: 'forcedVG',
            variationGroupName: 'Forced VG',
            campaignType: 'ab',
            variation: {
              id: 'forcedVar',
              name: 'Forced Variation',
              reference: false,
              modifications: {
                type: 'JSON',
                value: { forcedKey: 'forcedValue' }
              }
            }
          }
        }
      };
      const visitor = createVisitor(decisionManager, visitorVariationState);

      postAsync.mockResolvedValue(campaignResponse);

      const campaigns = await apiManager.getCampaignsAsync(
        visitor
      );
      expect(campaigns).toHaveLength(campaignResponse.body.campaigns.length + 1);
      expect(campaigns).toContainEqual({
        id: 'forcedCampaign',
        name: 'Forced Campaign',
        slug: 'forced-campaign',
        variationGroupId: 'forcedVG',
        variationGroupName: 'Forced VG',
        type: 'ab',
        variation: {
          id: 'forcedVar',
          name: 'Forced Variation',
          reference: false,
          modifications: {
            type: 'JSON',
            value: { forcedKey: 'forcedValue' }
          }
        }
      });
    });
  });

  describe('applyCampaignsForcedUnallocation', () => {
    it('should return campaigns unchanged when QA mode is disabled',async () => {
      config.isQAModeEnabled = false;
      const decisionManager = createDecisionManager();
      const visitor = createVisitor(decisionManager);

      postAsync.mockResolvedValue(campaignResponse);

      const campaigns = await apiManager.getCampaignsAsync(
        visitor
      );

      expect(campaigns).toEqual(campaignResponse.body.campaigns);

    });
    it('should return null when campaigns is null',async () => {
      config.isQAModeEnabled = true;
      const decisionManager = createDecisionManager();
      const visitor = createVisitor(decisionManager);

      postAsync.mockResolvedValue({
        status: 200,
        body: {}
      });

      const campaigns = await apiManager.getCampaignsAsync(
        visitor
      );

      expect(campaigns).toBeNull();
    });
    it('should return campaigns unchanged when no forced unallocations',async () => {
      config.isQAModeEnabled = true;
      const decisionManager = createDecisionManager();
      const visitorVariationState:VisitorVariationState = { variationsForcedUnallocation: {} };
      const visitor = createVisitor(decisionManager, visitorVariationState);

      postAsync.mockResolvedValue(campaignResponse);

      const campaigns = await apiManager.getCampaignsAsync(
        visitor
      );

      expect(campaigns).toEqual(campaignResponse.body.campaigns);
    });
    it('should filter out forced unallocation campaigns',async () => {
      config.isQAModeEnabled = true;
      const decisionManager = createDecisionManager();
      const unallocatedCampaign = campaignResponse.body.campaigns[0];
      const visitorVariationState:VisitorVariationState = {
        variationsForcedUnallocation: {
          [unallocatedCampaign.id]: {
            campaignId: unallocatedCampaign.id,
            campaignName: unallocatedCampaign.name,
            CampaignSlug: unallocatedCampaign.slug,
            variationGroupId: unallocatedCampaign.variationGroupId
          } as any
        }
      };
      const visitor = createVisitor(decisionManager, visitorVariationState);
      postAsync.mockResolvedValue(campaignResponse);
      const campaigns = await apiManager.getCampaignsAsync(
        visitor
      );
      expect(campaigns).toHaveLength(campaignResponse.body.campaigns.length - 1);
      expect(campaigns).not.toContainEqual(unallocatedCampaign);
    });
  });
});
