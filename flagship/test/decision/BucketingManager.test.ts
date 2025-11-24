import { jest, expect, it, describe, beforeAll, afterAll } from '@jest/globals';
import { BucketingConfig } from '../../src/config/BucketingConfig';
import { MurmurHash } from '../../src/utils/MurmurHash';
import { BucketingManager } from '../../src/decision/BucketingManager';
import { bucketing } from './bucketing';
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate';
import { HttpClient } from '../../src/utils/HttpClient';
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager';
import { DecisionManager } from '../../src/decision/DecisionManager';
import { TrackingManager } from '../../src/api/TrackingManager';
import { BucketingDTO, CampaignDTO, EAIScore } from '../../src';
import { Segment } from '../../src/hit/Segment';
import { ISdkManager } from '../../src/main/ISdkManager';
import { VisitorAbstract } from '../../src/visitor/VisitorAbstract';
import { IEmotionAI } from '../../src/emotionAI/IEmotionAI';
import { sleep } from '../helpers';

describe('test BucketingManager', () => {
  const config = new BucketingConfig({
    pollingInterval: 0,
    envId: 'envID',
    apiKey: 'apiKey'
  });
  const murmurHash = new MurmurHash();
  const httpClient = new HttpClient();

  const getBucketingContent = jest.fn<() => BucketingDTO | undefined>();

  const sdkManager = { getBucketingContent } as unknown as ISdkManager;

  getBucketingContent.mockReturnValue(undefined);

  const trackingManager = new TrackingManager(httpClient, config);

  const bucketingManager = new BucketingManager({
    httpClient,
    config,
    murmurHash,
    sdkManager,
    trackingManager
  });


  const sendContext = jest.spyOn(bucketingManager as any, 'sendContext');



  sendContext.mockReturnValue(Promise.resolve());

  const visitorId = 'visitor_1';
  const context = { age: 20 };

  const sendTroubleshootingHit = jest.spyOn(trackingManager, 'sendTroubleshootingHit');

  bucketingManager.trackingManager = trackingManager;

  const fetchEAIScore = jest.fn<() => Promise<EAIScore|undefined>>();

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>(),
    fetchEAIScore
  } as unknown as IEmotionAI;

  fetchEAIScore.mockResolvedValue(undefined);

  const visitor = new VisitorDelegate({
    hasConsented: true,
    visitorId,
    context,
    configManager: {
      config,
      decisionManager: bucketingManager,
      trackingManager
    },
    emotionAi
  });

  it('test getCampaignsAsync empty', async () => {
    const campaigns = await bucketingManager.getCampaignsAsync(visitor);
    expect(campaigns).toBeNull();
    expect(sendContext).toBeCalledTimes(0);
  });

  it('test getCampaignsAsync panic mode', async () => {
    getBucketingContent.mockReturnValue({ panic: true });
    sendTroubleshootingHit.mockResolvedValue();
    const campaigns = await bucketingManager.getCampaignsAsync(visitor);
    expect(campaigns).toHaveLength(0);
    expect(bucketingManager.isPanic()).toBeTruthy();
    expect(sendContext).toBeCalledTimes(0);
  });

  it('test getCampaignsAsync campaign empty', async () => {
    getBucketingContent.mockReturnValue({ campaigns: [{ variationGroups: [] } as any] } as BucketingDTO);
    const campaigns = await bucketingManager.getCampaignsAsync(visitor);
    expect(campaigns).toHaveLength(0);
    expect(sendContext).toBeCalledTimes(1);
  });

  it('test getCampaignsAsync campaign empty', async () => {
    getBucketingContent.mockReturnValue({} as BucketingDTO);
    const campaigns = await bucketingManager.getCampaignsAsync(visitor);
    expect(campaigns).toBeNull();
    expect(bucketingManager.isPanic()).toBeFalsy();
  });

  it('test getCampaignsAsync campaign', async () => {
    getBucketingContent.mockReturnValue(bucketing as BucketingDTO);
    const campaigns = await bucketingManager.getCampaignsAsync(
      visitor
    );
    const modifications = bucketingManager.getModifications(campaigns as CampaignDTO[]);
    expect(modifications.size).toBe(6);
    expect(bucketingManager.troubleshooting?.startDate.toISOString()).toBe('2023-04-13T09:33:38.049Z');
    expect(bucketingManager.troubleshooting?.endDate.toISOString()).toBe('2023-04-13T10:03:38.049Z');
    expect(bucketingManager.troubleshooting?.traffic).toBe(40);
  });
});

describe('test getCampaignsAsync campaign with thirdPartySegment', () => {
  const config = new BucketingConfig({
    pollingInterval: 0,
    envId: 'envID',
    apiKey: 'apiKey',
    fetchThirdPartyData: true
  });
  const murmurHash = new MurmurHash();
  const httpClient = new HttpClient();

  const getBucketingContent = jest.fn<() => BucketingDTO | undefined>();

  const sdkManager = { getBucketingContent } as unknown as ISdkManager;

  const getAsync = jest.spyOn(httpClient, 'getAsync');

  const trackingManager = new TrackingManager(httpClient, config);

  const bucketingManager = new BucketingManager({
    httpClient,
    config,
    murmurHash,
    sdkManager,
    trackingManager
  });


  const sendContext = jest.spyOn(bucketingManager as any, 'sendContext');



  sendContext.mockReturnValue(Promise.resolve());

  const visitorId = 'visitor_1';
  const context = { age: 20 };

  const fetchEAIScore = jest.fn<() => Promise<EAIScore|undefined>>();

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>(),
    fetchEAIScore
  } as unknown as IEmotionAI;

  fetchEAIScore.mockResolvedValue(undefined);

  bucketingManager.trackingManager = trackingManager;

  const visitor = new VisitorDelegate({
    hasConsented: true,
    visitorId,
    context,
    configManager: {
      config,
      decisionManager: bucketingManager,
      trackingManager
    },
    emotionAi
  });
  it('test getCampaignsAsync campaign with thirdPartySegment', async () => {
    getBucketingContent.mockReturnValue(bucketing as BucketingDTO);

    const thirdPartySegment = {
      visitor_id: visitorId,
      segment: 'key',
      value: 'value',
      expiration: 123456,
      partner: 'mixpanel'
    };
    const thirdPartySegment2 = {
      visitor_id: visitorId,
      segment: 'key2',
      value: 'value2',
      expiration: 123456,
      partner: 'segment.com'
    };
    getAsync.mockResolvedValue({
      body: [thirdPartySegment, thirdPartySegment2],
      status: 200
    });
    const campaigns = await bucketingManager.getCampaignsAsync(
      visitor
    );
    const segment = {
      [`${thirdPartySegment.partner}::${thirdPartySegment.segment}`]: thirdPartySegment.value,
      [`${thirdPartySegment2.partner}::${thirdPartySegment2.segment}`]: thirdPartySegment2.value
    };
    expect(visitor.context).toMatchObject(segment);
    const modifications = bucketingManager.getModifications(campaigns as CampaignDTO[]);
    expect(modifications.size).toBe(7);
    expect(modifications.has('thirdIntegration')).toBeTruthy();
    expect(modifications.get('thirdIntegration')?.value).toEqual('value2');
  });
});

describe('test sendContext', () => {
  const methodNow = Date.now;
  const mockNow = jest.fn<typeof Date.now>();
  beforeAll(() => {
    Date.now = mockNow;
    mockNow.mockReturnValue(1);
  });
  afterAll(() => {
    Date.now = methodNow;
  });
  const config = new BucketingConfig({
    pollingInterval: 0,
    envId: 'envID',
    apiKey: 'apiKey'
  });
  const murmurHash = new MurmurHash();
  const httpClient = new HttpClient();
  const logManager = new FlagshipLogManager();

  const getBucketingContent = jest.fn<() => BucketingDTO | undefined>();

  const sdkManager = { getBucketingContent } as unknown as ISdkManager;

  config.logManager = logManager;

  const logError = jest.spyOn(logManager, 'error');

  const trackingManager = new TrackingManager({} as HttpClient, config);

  const bucketingManager = new BucketingManager({
    httpClient,
    config,
    murmurHash,
    sdkManager,
    trackingManager
  }) as any;

  const visitorId = 'visitor_1';
  const context = { age: 20 };


  const fetchEAIScore = jest.fn<() => Promise<EAIScore|undefined>>();

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>(),
    fetchEAIScore
  } as unknown as IEmotionAI;

  fetchEAIScore.mockResolvedValue(undefined);

  const visitor = new VisitorDelegate({
    hasConsented: true,
    visitorId,
    context,
    configManager: {
      config,
      decisionManager: {} as DecisionManager,
      trackingManager
    },
    emotionAi
  });

  const sendHit = jest.spyOn(visitor, 'sendHit');
  it('should send segment hit', async () => {
    sendHit.mockResolvedValue();
    const SegmentHit = new Segment({
      context: visitor.context,
      visitorId,
      anonymousId: visitor.anonymousId as string
    });
    await bucketingManager.sendContext(visitor);
    await sleep(10);
    expect(sendHit).toBeCalledTimes(1);
    expect(sendHit).toBeCalledWith(SegmentHit);
  });

  it('should send segment hit once', async () => {
    sendHit.mockResolvedValue();
    const SegmentHit = new Segment({
      context: visitor.context,
      visitorId,
      anonymousId: visitor.anonymousId as string
    });
    visitor.hasContextBeenUpdated = true;
    await bucketingManager.sendContext(visitor);
    await sleep(10);
    expect(sendHit).toBeCalledTimes(1);
    expect(sendHit).toBeCalledWith(SegmentHit);
    bucketingManager.sendContext(visitor).then(() => {
      expect(sendHit).toBeCalledTimes(1);
      expect(sendHit).toBeCalledWith(SegmentHit);
    });
  });

  it('should handle error when sendContext throws an error during bucketing', async () => {
    const messageError = 'error';
    visitor.hasContextBeenUpdated = true;
    sendHit.mockRejectedValue(messageError);
    await bucketingManager.sendContext(visitor);
    expect(sendHit).toBeCalledTimes(1);
    expect(logError).toBeCalledTimes(1);
  });

  it('should not send segment hit it when visitor context is empty', async () => {
    const visitor = new VisitorDelegate({
      hasConsented: true,
      visitorId,
      context: {},
      configManager: {
        config,
        decisionManager: {} as DecisionManager,
        trackingManager
      },
      emotionAi
    });
    await bucketingManager.sendContext(visitor);
    expect(sendHit).toBeCalledTimes(0);
  });

  it('should not send segment hit when visitor has not consented', () => {
    visitor.hasConsented = false;
    sendHit.mockResolvedValue();
    bucketingManager.sendContext(visitor).then(() => {
      expect(sendHit).toBeCalledTimes(0);
    });
    visitor.hasConsented = true;
  });
});

describe('test bucketing method', () => {
  const config = new BucketingConfig({ pollingInterval: 0 });
  const murmurHash = new MurmurHash();
  const httpClient = new HttpClient();
  const getBucketingContent = jest.fn<() => BucketingDTO | undefined>();

  const sdkManager = { getBucketingContent } as unknown as ISdkManager;

  const trackingManager = new TrackingManager({} as HttpClient, config);

  const bucketingManager = new BucketingManager({
    httpClient,
    config,
    murmurHash,
    sdkManager,
    trackingManager
  });

  const bucketingManagerAny = bucketingManager as any;

  const visitorId = '123456';

  const context = { age: 20 };

  const fetchEAIScore = jest.fn<() => Promise<EAIScore|undefined>>();

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>(),
    fetchEAIScore
  } as unknown as IEmotionAI;

  fetchEAIScore.mockResolvedValue(undefined);



  const visitor = new VisitorDelegate({
    hasConsented: true,
    visitorId,
    context,
    configManager: {
      config,
      decisionManager: bucketingManager,
      trackingManager
    },
    emotionAi
  });

  const variations = [
    {
      id: 'c20j8bk3fk9hdphqtd30',
      modifications: {
        type: 'HTML',
        value: { my_html: '<div>\n  <p>Original</p>\n</div>' }
      },
      allocation: 34,
      reference: true
    },
    {
      id: 'c20j8bk3fk9hdphqtd3g',
      modifications: {
        type: 'HTML',
        value: { my_html: '<div>\n  <p>variation 1</p>\n</div>' }
      },
      allocation: 33
    },
    {
      id: 'c20j9lgbcahhf2mvhbf0',
      modifications: {
        type: 'HTML',
        value: { my_html: '<div>\n  <p>variation 2</p>\n</div>' }
      },
      allocation: 33
    }
  ];
  const variationGroups = {
    id: '9273BKSDJtoto',
    variations
  };
  it('test getVariation ', () => {
    const response = bucketingManagerAny.getVariation(variationGroups, visitor);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { allocation, ...variation } = variations[0];
    expect(response).toEqual(variation);
  });

  it('test getVariation ', () => {
    const variations = [
      {
        id: 'c20j8bk3fk9hdphqtd30',
        modifications: {
          type: 'HTML',
          value: { my_html: '<div>\n  <p>Original</p>\n</div>' }
        },
        allocation: 0,
        reference: true
      },
      {
        id: 'c20j8bk3fk9hdphqtd3g',
        modifications: {
          type: 'HTML',
          value: { my_html: '<div>\n  <p>variation 1</p>\n</div>' }
        },
        allocation: undefined
      },
      {
        id: 'c20j9lgbcahhf2mvhbf0',
        modifications: {
          type: 'HTML',
          value: { my_html: '<div>\n  <p>variation 2</p>\n</div>' }
        },
        allocation: 33
      }
    ];
    const variationGroups = {
      id: '9273BKSDJtoto',
      variations
    };
    const response = bucketingManagerAny.getVariation(variationGroups, visitor);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { allocation, ...variation } = variations[2];
    expect(response).toEqual(variation);
  });

  it('test getVariation reallocation ', () => {
    visitor.visitorCache = {
      version: 1,
      data: {
        visitorId: visitor.visitorId,
        anonymousId: null,
        assignmentsHistory: { [variationGroups.id]: variations[0].id }
      }
    };
    const localVariation = variationGroups.variations.filter(x => x.id !== 'c20j8bk3fk9hdphqtd30');
    const response = bucketingManagerAny.getVariation({
      ...variationGroups,
      variations: localVariation
    }, visitor);

    expect(response).toBeNull();
  });

  it('test getVariation visitorCache ', () => {
    visitor.visitorCache = {
      version: 1,
      data: {
        visitorId: visitor.visitorId,
        anonymousId: null,
        assignmentsHistory: { [variationGroups.id]: variations[1].id }
      }
    };
    const response = bucketingManagerAny.getVariation(variationGroups, visitor);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { allocation, ...variation } = variations[1];
    expect(response).toEqual(variation);
  });

  it('test checkVisitorMatchesTargeting with empty VariationGroupDTO ', () => {
    const checkAllTargetingRulesMatch = jest.spyOn(bucketingManagerAny, 'checkAllTargetingRulesMatch');
    const response = bucketingManagerAny.checkVisitorMatchesTargeting([], visitor);
    expect(response).toBeFalsy();
    expect(checkAllTargetingRulesMatch).toBeCalledTimes(0);
  });
  it('test checkVisitorMatchesTargeting ', () => {
    const checkAllTargetingRulesMatch = jest.spyOn(bucketingManagerAny, 'checkAllTargetingRulesMatch');
    const response = bucketingManagerAny.checkVisitorMatchesTargeting({
      targeting: {
        targetingGroups: [
          {
            targetings: [{
              key: 'age',
              operator: 'EQUALS',
              value: 21
            }]
          }
        ]
      }
    }, visitor);
    expect(response).toBeFalsy();
    expect(checkAllTargetingRulesMatch).toBeCalledTimes(1);
  });

  it('test checkVisitorMatchesTargeting ', () => {
    const checkAllTargetingRulesMatch = jest.spyOn(bucketingManagerAny, 'checkAllTargetingRulesMatch');
    const response = bucketingManagerAny.checkVisitorMatchesTargeting({
      targeting: {
        targetingGroups: [
          {
            targetings: [{
              key: 'age',
              operator: 'EQUALS',
              value: 21
            }]
          },
          {
            targetings: [{
              key: 'fs_all_users',
              operator: 'EQUALS',
              value: ''
            }]
          },
          {
            key: 'fs_users',
            operator: 'EQUALS',
            value: visitorId
          }

        ]
      }
    }, visitor);
    expect(response).toBeTruthy();
    expect(checkAllTargetingRulesMatch).toBeCalledTimes(2);
  });

  it('test checkAllTargetingRulesMatch', () => {
    const response = bucketingManagerAny.checkAllTargetingRulesMatch([], visitor);
    expect(response).toBeFalsy();
  });

  const targetingAllUsers = {
    key: 'fs_all_users',
    operator: 'EQUALS',
    value: ''
  };

  it('test checkAllTargetingRulesMatch fs_all_users', () => {
    const response = bucketingManagerAny.checkAllTargetingRulesMatch([targetingAllUsers], visitor);
    expect(response).toBeTruthy();
  });

  it('test checkAllTargetingRulesMatch fs_users', () => {
    const evaluateOperator = jest.spyOn(bucketingManagerAny, 'evaluateOperator');
    const targetingFsUsers = [{
      key: 'fs_users',
      operator: 'STARTS_WITH',
      value: '12'
    }, {
      key: 'fs_users',
      operator: 'ENDS_WITH',
      value: '6'
    }];
    const response = bucketingManagerAny.checkAllTargetingRulesMatch(targetingFsUsers, visitor);
    expect(response).toBeTruthy();
    expect(evaluateOperator).toBeCalledTimes(2);
  });

  it('test checkAllTargetingRulesMatch fs_users targeting and', () => {
    const evaluateOperator = jest.spyOn(bucketingManagerAny, 'evaluateOperator');
    const targetingFsUsers = [{
      key: 'fs_users',
      operator: 'STARTS_WITH',
      value: '2'
    }, {
      key: 'fs_users',
      operator: 'ENDS_WITH',
      value: '6'
    }];
    const response = bucketingManagerAny.checkAllTargetingRulesMatch(targetingFsUsers, visitor);
    expect(response).toBeFalsy();
    expect(evaluateOperator).toBeCalledTimes(1);
  });

  it('test checkAllTargetingRulesMatch key EXISTS 1', () => {
    const evaluateOperator = jest.spyOn(bucketingManagerAny, 'evaluateOperator');
    const targetingFsUsers = [{
      key: 'partner::key1',
      operator: 'EXISTS',
      value: '2'
    }, {
      key: 'fs_users',
      operator: 'ENDS_WITH',
      value: '6'
    }];
    const response = bucketingManagerAny.checkAllTargetingRulesMatch(targetingFsUsers, visitor);
    expect(response).toBeFalsy();
    expect(evaluateOperator).toBeCalledTimes(0);
  });

  it('test checkAllTargetingRulesMatch key EXISTS 2', () => {
    const evaluateOperator = jest.spyOn(bucketingManagerAny, 'evaluateOperator');
    const targetingFsUsers = [{
      key: 'partner::key1',
      operator: 'EXISTS',
      value: false
    }, {
      key: 'fs_users',
      operator: 'ENDS_WITH',
      value: '6'
    }];
    visitor.updateContext({ 'partner::key1': false });
    const response = bucketingManagerAny.checkAllTargetingRulesMatch(targetingFsUsers, visitor);
    expect(response).toBeTruthy();
    expect(evaluateOperator).toBeCalledTimes(2);
  });

  it('test checkAllTargetingRulesMatch key NOT_EXISTS 1', () => {
    const evaluateOperator = jest.spyOn(bucketingManagerAny, 'evaluateOperator');
    const targetingFsUsers = [{
      key: 'partner::key2',
      operator: 'NOT_EXISTS',
      value: false
    }, {
      key: 'fs_users',
      operator: 'ENDS_WITH',
      value: '6'
    }];
    // visitor.updateContext({ 'partner::key1': false })
    const response = bucketingManagerAny.checkAllTargetingRulesMatch(targetingFsUsers, visitor);
    expect(response).toBeTruthy();
    expect(evaluateOperator).toBeCalledTimes(1);
  });

  it('test checkAllTargetingRulesMatch key NOT_EXISTS 2', () => {
    const evaluateOperator = jest.spyOn(bucketingManagerAny, 'evaluateOperator');
    const targetingFsUsers = [{
      key: 'partner::key2',
      operator: 'NOT_EXISTS',
      value: false
    }, {
      key: 'fs_users',
      operator: 'ENDS_WITH',
      value: '6'
    }];
    visitor.updateContext({ 'partner::key2': false });
    const response = bucketingManagerAny.checkAllTargetingRulesMatch(targetingFsUsers, visitor);
    expect(response).toBeFalsy();
    expect(evaluateOperator).toBeCalledTimes(1);
  });

  it('test checkAllTargetingRulesMatch key not match context', () => {
    const evaluateOperator = jest.spyOn(bucketingManagerAny, 'evaluateOperator');
    const targetingKeyContext = {
      key: 'anyKey',
      operator: 'EQUALS',
      value: 'anyValue'
    };
    const response = bucketingManagerAny.checkAllTargetingRulesMatch([targetingKeyContext], visitor);
    expect(response).toBeFalsy();
    expect(evaluateOperator).toBeCalledTimes(0);
  });

  it('test checkAllTargetingRulesMatch key match context', () => {
    const evaluateOperator = jest.spyOn(bucketingManagerAny, 'evaluateOperator');
    const targetingKeyContext = {
      key: 'age',
      operator: 'EQUALS',
      value: 20
    };
    const response = bucketingManagerAny.checkAllTargetingRulesMatch([targetingKeyContext], visitor);
    expect(response).toBeTruthy();
    expect(evaluateOperator).toBeCalledTimes(1);
    expect(evaluateOperator).toBeCalledWith(targetingKeyContext.operator, context.age, targetingKeyContext.value);
  });

  it('test checkAllTargetingRulesMatch ', () => {
    const evaluateOperator = jest.spyOn(bucketingManagerAny, 'evaluateOperator');
    const targetingKeyContext = {
      key: 'anyValue',
      operator: 'EQUALS',
      value: 21
    };
    const response = bucketingManagerAny.checkAllTargetingRulesMatch([targetingKeyContext, targetingAllUsers], visitor);
    expect(response).toBeFalsy();
    expect(evaluateOperator).toBeCalledTimes(0);
  });



  it('test evaluateOperator EQUALS Test different values', () => {
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'EQUALS',
      value: 6
    }, { context: { my_key: 5 } }
    );
    expect(response).toBeFalsy();
  });

  it('test evaluateOperator EQUALS Test different type', () => {
    const contextValue = 5;
    const targetingValue = '5';
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'EQUALS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );

    expect(response).toBeFalsy();
  });

  it('test evaluateOperator EQUALS Test same type and value', () => {
    const contextValue = 5;
    const targetingValue = 5;
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'EQUALS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeTruthy();
  });

  it('test evaluateOperator NOT_EQUALS Test different values', () => {
    const contextValue = 5;
    const targetingValue = 6;
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'NOT_EQUALS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeTruthy();
  });

  it('test evaluateOperator NOT_EQUALS Test different type', () => {
    const contextValue = 5;
    const targetingValue = '5';
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'NOT_EQUALS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeTruthy();
  });

  it('test evaluateOperator NOT_EQUALS Test same type and value', () => {
    const contextValue = 5;
    const targetingValue = 5;
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'NOT_EQUALS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeFalsy();
  });

  it('test evaluateOperator CONTAINS Test contextValue not contains targetingValue', () => {
    const contextValue = 'a';
    const targetingValue = 'b';
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'CONTAINS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeFalsy();
  });

  it('test evaluateOperator CONTAINS Test contextValue contains targetingValue', () => {
    const contextValue = 'abc';
    const targetingValue = 'b';
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'CONTAINS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );

    expect(response).toBeTruthy();
  });

  it('test evaluateOperator CONTAINS Test contextValue contains targetingValue', () => {
    const contextValue = 'nopq_hij';
    const targetingValue = ['abc', 'dfg', 'hij', 'klm'];
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'CONTAINS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );

    expect(response).toBeTruthy();
  });

  it('test evaluateOperator NOT_CONTAINS Test contextValue not contains targetingValue', () => {
    const contextValue = 'abc';
    const targetingValue = 'd';
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'NOT_CONTAINS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeTruthy();
  });

  it('test evaluateOperator NOT_CONTAINS Test contextValue contains targetingValue', () => {
    const contextValue = 'abc';
    const targetingValue = 'b';
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'NOT_CONTAINS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeFalsy();
  });

  it('test evaluateOperator GREATER_THAN Test contextValue not GREATER_THAN targetingValue', () => {
    const contextValue = 5;
    const targetingValue = 6;
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'GREATER_THAN',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeFalsy();
  });

  it('test evaluateOperator GREATER_THAN Test contextValue not GREATER_THAN targetingValue', () => {
    const contextValue = 5;
    const targetingValue = 5;
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'GREATER_THAN',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeFalsy();
  });

  it('test evaluateOperator GREATER_THAN Test contextValue not GREATER_THAN targetingValue', () => {
    const contextValue = 'a';
    const targetingValue = 'b';
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'GREATER_THAN',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeFalsy();
  });

  it('test evaluateOperator GREATER_THAN Test contextValue not GREATER_THAN targetingValue', () => {
    const contextValue = 'abz';
    const targetingValue = 'bcg';
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'GREATER_THAN',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeFalsy();
  });

  it('test evaluateOperator GREATER_THAN Test contextValue GREATER_THAN targetingValue', () => {
    const contextValue = 8;
    const targetingValue = 5;
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'GREATER_THAN',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeTruthy();
  });

  it('test evaluateOperator GREATER_THAN Test contextValue GREATER_THAN targetingValue', () => {
    const contextValue = '9dlk';
    const targetingValue = '8';
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'GREATER_THAN',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeTruthy();
  });

  it('test evaluateOperator LOWER_THAN Test contextValue LOWER_THAN targetingValue', () => {
    const contextValue = 5;
    const targetingValue = 6;
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'LOWER_THAN',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeTruthy();
  });

  it('test evaluateOperator LOWER_THAN Test contextValue not GREATER_THAN targetingValue', () => {
    const contextValue = 5;
    const targetingValue = 5;
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'LOWER_THAN',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeFalsy();
  });

  it('test evaluateOperator LOWER_THAN Test contextValue LOWER_THAN targetingValue', () => {
    const contextValue = 'a';
    const targetingValue = 'b';
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'LOWER_THAN',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeTruthy();
  });

  it('test evaluateOperator LOWER_THAN Test contextValue LOWER_THAN targetingValue', () => {
    const contextValue = 'abz';
    const targetingValue = 'bcg';
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'LOWER_THAN',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeTruthy();
  });

  it('test evaluateOperator LOWER_THAN Test contextValue not LOWER_THAN targetingValue', () => {
    const contextValue = 8;
    const targetingValue = 2;
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'LOWER_THAN',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeFalsy();
  });

  it('test evaluateOperator GREATER_THAN_OR_EQUALS Test contextValue GREATER_THAN targetingValue', () => {
    const contextValue = 8;
    const targetingValue = 2;
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'GREATER_THAN_OR_EQUALS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeTruthy();
  });

  it('test evaluateOperator GREATER_THAN_OR_EQUALS Test contextValue EQUALS targetingValue', () => {
    const contextValue = 8;
    const targetingValue = 8;
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'GREATER_THAN_OR_EQUALS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeTruthy();
  });

  it('test evaluateOperator GREATER_THAN_OR_EQUALS Test contextValue LOWER_THAN targetingValue', () => {
    const contextValue = 7;
    const targetingValue = 8;
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'GREATER_THAN_OR_EQUALS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeFalsy();
  });

  it('test evaluateOperator GREATER_THAN_OR_EQUALS Test contextValue LOWER_THAN targetingValue', () => {
    const contextValue = 'a';
    const targetingValue = 'b';
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'GREATER_THAN_OR_EQUALS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeFalsy();
  });

  it('test evaluateOperator LOWER_THAN_OR_EQUALS Test contextValue GREATER_THAN targetingValue', () => {
    const contextValue = 8;
    const targetingValue = 6;
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'LOWER_THAN_OR_EQUALS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeFalsy();
  });

  it('test evaluateOperator LOWER_THAN_OR_EQUALS Test contextValue EQUALS targetingValue', () => {
    const contextValue = 8;
    const targetingValue = 8;
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'LOWER_THAN_OR_EQUALS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeTruthy();
  });

  it('test evaluateOperator LOWER_THAN_OR_EQUALS Test contextValue LOWER_THAN targetingValue', () => {
    const contextValue = 7;
    const targetingValue = 8;
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'LOWER_THAN_OR_EQUALS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeTruthy();
  });

  it('test evaluateOperator LOWER_THAN_OR_EQUALS Test contextValue LOWER_THAN targetingValue', () => {
    const contextValue = 'a';
    const targetingValue = 'b';
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'LOWER_THAN_OR_EQUALS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeTruthy();
  });

  it('test evaluateOperator STARTS_WITH Test contextValue STARTS_WITH targetingValue', () => {
    const contextValue = 'abcd';
    const targetingValue = 'ab';
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'STARTS_WITH',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeTruthy();
  });

  it('test evaluateOperator STARTS_WITH Test contextValue STARTS_WITH targetingValue', () => {
    const contextValue = 'abcd';
    const targetingValue = 'AB';
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'STARTS_WITH',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeFalsy();
  });

  it('test evaluateOperator STARTS_WITH Test contextValue STARTS_WITH targetingValue', () => {
    const contextValue = 'abcd';
    const targetingValue = 'ac';
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'STARTS_WITH',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeFalsy();
  });

  it('test evaluateOperator ENDS_WITH Test contextValue ENDS_WITH targetingValue', () => {
    const contextValue = 'abcd';
    const targetingValue = 'cd';
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'ENDS_WITH',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeTruthy();
  });

  it('test evaluateOperator ENDS_WITH Test contextValue ENDS_WITH targetingValue', () => {
    const contextValue = 'abcd';
    const targetingValue = 'CD';
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'ENDS_WITH',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeFalsy();
  });

  it('test evaluateOperator ENDS_WITH Test contextValue ENDS_WITH targetingValue', () => {
    const contextValue = 'abcd';
    const targetingValue = 'bd';
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'ENDS_WITH',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeFalsy();
  });

  it('test evaluateOperator CONTAINS Test contextValue CONTAINS targetingValue list', () => {
    const contextValue = 'abcd';
    const targetingValue = ['a', 'e'];
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'CONTAINS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeTruthy();
  });

  it('test evaluateOperator EQUALS Test contextValue EQUALS targetingValue list', () => {
    const contextValue = 'a';
    const targetingValue = ['a', 'b', 'c'];
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'EQUALS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeTruthy();
  });

  it('test evaluateOperator CONTAINS Test contextValue not CONTAINS targetingValue list', () => {
    const contextValue = 'abcd';
    const targetingValue = ['e', 'f'];
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'CONTAINS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeFalsy();
  });

  it('test evaluateOperator EQUALS Test contextValue EQUALS targetingValue list', () => {
    const contextValue = 'a';
    const targetingValue = ['b', 'c', 'd'];
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'EQUALS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeFalsy();
  });

  it('test evaluateOperator NOT_CONTAINS Test contextValue NOT_CONTAINS targetingValue list', () => {
    const contextValue = 'abcd';
    const targetingValue = ['e', 'f'];
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'NOT_CONTAINS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeTruthy();
  });

  it('test evaluateOperator NOT_EQUALS Test contextValue NOT_EQUALS targetingValue list', () => {
    const contextValue = 'a';
    const targetingValue = ['b', 'c', 'd'];
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'NOT_EQUALS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeTruthy();
  });

  it('test evaluateOperator NOT_CONTAINS Test contextValue not NOT_CONTAINS targetingValue list', () => {
    const contextValue = 'abcd';
    const targetingValue = ['a', 'e'];
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'NOT_CONTAINS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeFalsy();
  });

  it('test evaluateOperator NOT_EQUALS Test contextValue NOT_EQUALS targetingValue list', () => {
    const contextValue = 'a';
    const targetingValue = ['a', 'b', 'c'];
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'NOT_EQUALS',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeFalsy();
  });

  it('test evaluateOperator NotEXIST', () => {
    const contextValue = 'abcd';
    const targetingValue = 'bd';
    const response = bucketingManagerAny.matchesTargetingCriteria({
      key: 'my_key',
      operator: 'NotEXIST',
      value: targetingValue
    }, { context: { my_key: contextValue } }
    );
    expect(response).toBeFalsy();
  });
});

describe('test getThirdPartySegment', () => {
  const methodNow = Date.now;
  const mockNow = jest.fn<typeof Date.now>();
  beforeAll(() => {
    Date.now = mockNow;
    mockNow.mockReturnValue(1);
  });
  afterAll(() => {
    Date.now = methodNow;
  });

  const config = new BucketingConfig({
    pollingInterval: 0,
    envId: 'envID',
    apiKey: 'apiKey'
  });
  const murmurHash = new MurmurHash();
  const httpClient = new HttpClient();
  const logManager = new FlagshipLogManager();

  config.logManager = logManager;

  const logError = jest.spyOn(logManager, 'error');

  const getBucketingContent = jest.fn<() => BucketingDTO | undefined>();

  const sdkManager = { getBucketingContent } as unknown as ISdkManager;
  const trackingManager = new TrackingManager(httpClient, config);

  const bucketingManager = new BucketingManager({
    httpClient,
    config,
    murmurHash,
    sdkManager,
    trackingManager
  });


  const sendTroubleshootingHit = jest.spyOn(trackingManager, 'sendTroubleshootingHit');

  bucketingManager.trackingManager = trackingManager;

  const visitorId = 'visitor_1';

  const getAsync = jest.spyOn(httpClient, 'getAsync');

  const thirdPartySegment = {
    visitor_id: visitorId,
    segment: 'key',
    value: 'value',
    expiration: 123456,
    partner: 'mixpanel'
  };
  const thirdPartySegment2 = {
    visitor_id: visitorId,
    segment: 'key2',
    value: 'value2',
    expiration: 123456,
    partner: 'segment.com'
  };
  it('test getThirdPartySegment method', async () => {
    getAsync.mockResolvedValue({
      status: 200,
      body: [thirdPartySegment, thirdPartySegment2]
    });
    sendTroubleshootingHit.mockResolvedValue();
    const segments = await bucketingManager.getThirdPartySegment(visitorId);

    expect(segments[`${thirdPartySegment.partner}::${thirdPartySegment.segment}`]).toEqual(thirdPartySegment.value);
    expect(segments[`${thirdPartySegment2.partner}::${thirdPartySegment2.segment}`]).toEqual(thirdPartySegment2.value);
  });

  it('test getThirdPartySegment error', async () => {
    const messageError = 'error';
    getAsync.mockRejectedValue({
      status: 403,
      body: messageError
    });
    const segments = await bucketingManager.getThirdPartySegment(visitorId);
    expect(logError).toBeCalledTimes(1);
    expect(segments).toEqual({});
  });
});
