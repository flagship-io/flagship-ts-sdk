import { jest, expect, it, describe, beforeAll, afterAll } from '@jest/globals';
import { EventCategory, OnVisitorExposed, TroubleshootingLabel } from '../../src';
import { BatchingPeriodicCachingStrategy } from '../../src/api/BatchingPeriodicCachingStrategy';
import { DecisionApiConfig } from '../../src/config/DecisionApiConfig';
import { HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, SDK_INFO, HEADER_X_SDK_VERSION, SDK_VERSION, HEADER_CONTENT_TYPE, HEADER_APPLICATION_JSON, HIT_EVENT_URL, BASE_API_URL, URL_ACTIVATE_MODIFICATION, FS_CONSENT, LogLevel, DEFAULT_HIT_CACHE_TIME_MS, BATCH_HIT, TRACKING_MANAGER, TRACKING_MANAGER_ERROR } from '../../src/enum';
import { BatchTriggeredBy } from '../../src/enum/BatchTriggeredBy';
import { Activate } from '../../src/hit/Activate';
import { ActivateBatch } from '../../src/hit/ActivateBatch';
import { Batch } from '../../src/hit/Batch';
import { HitAbstract } from '../../src/hit/HitAbstract';
import { Page } from '../../src/hit/Page';
import { Event } from '../../src/hit/Event';
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager';
import { HttpClient } from '../../src/utils/HttpClient';
import { sprintf } from '../../src/utils/utils';
import { Troubleshooting } from '../../src/hit/Troubleshooting';
import { UsageHit } from '../../src/hit/UsageHit';
import { sleep } from '../helpers';

describe('Test BatchingPeriodicCachingStrategy', () => {
  const visitorId = 'visitorId';
  it('test addHit method', async () => {
    const httpClient = new HttpClient();
    const postAsync = jest.spyOn(httpClient, 'postAsync');
    postAsync.mockRejectedValue('Error');
    const config = new DecisionApiConfig({
      envId: 'envId',
      apiKey: 'apiKey'
    });
    const hitsPoolQueue = new Map<string, HitAbstract>();
    const activatePoolQueue = new Map<string, Activate>();
    const troubleshootingQueue = new Map<string, Troubleshooting>();
    const analyticHitQueue = new Map<string, UsageHit>();
    const batchingStrategy = new BatchingPeriodicCachingStrategy({
      config,
      httpClient,
      hitsPoolQueue,
      activatePoolQueue,
      troubleshootingQueue,
      analyticHitQueue
    });


    const cacheHit = jest.spyOn(batchingStrategy as any, 'cacheHit');


    const flushAllHits = jest.spyOn(batchingStrategy as any, 'flushAllHits');

    const pageHit1 = new Page({
      documentLocation: 'http://localhost',
      visitorId
    });

    await batchingStrategy.addHit(pageHit1);

    expect(hitsPoolQueue.size).toBe(1);
    expect(cacheHit).toBeCalledTimes(0);

    const activateHit = new Activate({
      variationGroupId: 'variationGrID',
      variationId: 'campaignID',
      visitorId,
      flagKey: 'flagKey',
      flagValue: 'value',
      flagDefaultValue: 'default-value',
      flagMetadata: {
        campaignId: 'campaignId',
        campaignName: 'campaignName',
        variationGroupId: 'variationGrID',
        variationGroupName: 'variationGroupName',
        variationId: 'varId',
        variationName: 'variationName',
        isReference: true,
        campaignType: 'ab',
        slug: 'slug'
      },
      visitorContext: { key: 'value' }
    });

    activateHit.config = config;

    await batchingStrategy.activateFlag(activateHit);

    expect(hitsPoolQueue.size).toBe(1);
    expect(activatePoolQueue.size).toBe(1);
    expect(cacheHit).toBeCalledTimes(0);
    expect(flushAllHits).toBeCalledTimes(0);

    const consentHit = new Event({
      visitorId,
      label: `${SDK_INFO.name}:${true}`,
      action: FS_CONSENT,
      category: EventCategory.USER_ENGAGEMENT
    });

    consentHit.visitorId = visitorId;

    await batchingStrategy.addHit(consentHit);

    expect(hitsPoolQueue.size).toBe(2);
    expect(cacheHit).toBeCalledTimes(0);
    expect(flushAllHits).toBeCalledTimes(0);
    expect(activatePoolQueue.size).toBe(1);

    const pageHit = new Page({
      documentLocation: 'http://127.0.0.1:5500',
      visitorId
    });

    pageHit.visitorId = visitorId;

    await batchingStrategy.addHit(pageHit);

    expect(hitsPoolQueue.size).toBe(3);
    expect(cacheHit).toBeCalledTimes(0);
    expect(flushAllHits).toBeCalledTimes(0);
    expect(activatePoolQueue.size).toBe(1);

    const consentHitFalse1 = new Event({
      visitorId: 'newVisitor',
      label: `${SDK_INFO.name}:${false}`,
      action: FS_CONSENT,
      category: EventCategory.USER_ENGAGEMENT
    });

    await batchingStrategy.addHit(consentHitFalse1);

    expect(hitsPoolQueue.size).toBe(4);
    expect(cacheHit).toBeCalledTimes(0);
    expect(flushAllHits).toBeCalledTimes(0);
    expect(activatePoolQueue.size).toBe(1);

    const consentHitFalse2 = new Event({
      visitorId,
      label: `${SDK_INFO.name}:${false}`,
      action: FS_CONSENT,
      category: EventCategory.USER_ENGAGEMENT
    });

    consentHitFalse2.visitorId = visitorId;

    await batchingStrategy.addHit(consentHitFalse2);
    expect(activatePoolQueue.size).toBe(0);
    expect(hitsPoolQueue.size).toBe(3);
    expect(cacheHit).toBeCalledTimes(0);
    expect(flushAllHits).toBeCalledTimes(0);
  });
});

describe('test sendBatch method', () => {
  const methodNow = Date.now;
  const mockNow = jest.fn<typeof Date.now>();
  beforeAll(() => {
    Date.now = mockNow;
    mockNow.mockReturnValue(1);
    sendHitsToFsQaSpy.mockImplementation(() => {
      //
    });
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
  const logManager = new FlagshipLogManager();
  const logError = jest.spyOn(logManager, 'error');

  config.logManager = logManager;

  const hitsPoolQueue = new Map<string, HitAbstract>();
  const activatePoolQueue = new Map<string, Activate>();
  const troubleshootingQueue = new Map<string, Troubleshooting>();
  const analyticHitQueue = new Map<string, UsageHit>();
  const batchingStrategy = new BatchingPeriodicCachingStrategy({
    config,
    httpClient,
    hitsPoolQueue,
    activatePoolQueue,
    troubleshootingQueue,
    analyticHitQueue
  });


  const cacheHitSpy = jest.spyOn(batchingStrategy as any, 'cacheHit');

  const flushHitsSpy = jest.spyOn(batchingStrategy, 'flushHits');

  const flushAllHitsSpy = jest.spyOn(batchingStrategy, 'flushAllHits');

  const sendHitsToFsQaSpy = jest.spyOn(batchingStrategy, 'sendHitsToFsQa');

  const visitorId = 'visitorId';

  const globalPageHit = new Page({
    documentLocation: 'http://localhost',
    visitorId
  });

  const headers = { [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON };

  const headersActivate = {
    [HEADER_X_API_KEY]: `${config.apiKey}`,
    [HEADER_X_SDK_CLIENT]: SDK_INFO.name,
    [HEADER_X_SDK_VERSION]: SDK_VERSION,
    [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
  };
  const nextFetchConfig = { revalidate: 20 };
  const urlActivate = `${BASE_API_URL}${URL_ACTIVATE_MODIFICATION}`;
  it('test sendBatch method success', async () => {
    postAsync.mockResolvedValue({
      status: 200,
      body: null
    });

    const batch:Batch = new Batch({ hits: [] });
    batch.config = config;
    config.logLevel = LogLevel.NONE;

    for (let index = 0; index < 71; index++) {
      const pageHit = new Page({
        documentLocation: ('http://localhost' + index).repeat(2000),
        visitorId
      });

      await batchingStrategy.addHit(pageHit);
      if (index === 70) {
        continue;
      }
      batch.hits.push(pageHit);
    }

    expect(hitsPoolQueue.size).toBe(71);

    await batchingStrategy.sendBatch();

    expect(hitsPoolQueue.size).toBe(1);
    expect(cacheHitSpy).toHaveBeenNthCalledWith(1, hitsPoolQueue);

    expect(postAsync).toHaveBeenNthCalledWith(1, HIT_EVENT_URL, {
      headers,
      nextFetchConfig,
      body: batch.toApiKeys(),
      timeout: config.timeout
    });

    expect(sendHitsToFsQaSpy).toBeCalledTimes(1);
    expect(sendHitsToFsQaSpy).toBeCalledWith(batch.hits);

    expect(flushHitsSpy).toBeCalledTimes(0);
    expect(flushAllHitsSpy).toBeCalledTimes(1);
    expect(cacheHitSpy).toBeCalledTimes(1);
    expect(cacheHitSpy).toHaveBeenNthCalledWith(1, hitsPoolQueue);

    await batchingStrategy.sendBatch();

    expect(postAsync).toBeCalledTimes(2);
    expect(hitsPoolQueue.size).toBe(0);
  });

  it('test sendBatch method hit expired', async () => {


    postAsync.mockResolvedValue({
      status: 200,
      body: null
    });

    const batch:Batch = new Batch({ hits: [] });
    batch.config = config;
    config.trackingManagerConfig.batchIntervals = 25;
    config.logLevel = LogLevel.NONE;

    const pageHit = new Page({
      documentLocation: ('http://localhost'),
      visitorId
    });
    pageHit.key = visitorId + 'key1';

    const pageHit2 = new Page({
      documentLocation: ('http://localhost'),
      visitorId
    });
    pageHit2.key = visitorId + 'key2';

    pageHit.createdAt = (DEFAULT_HIT_CACHE_TIME_MS + 1) * -1;

    hitsPoolQueue.set(pageHit.key, pageHit);
    hitsPoolQueue.set(pageHit2.key, pageHit2);

    await batchingStrategy.sendBatch();

    expect(hitsPoolQueue.size).toBe(0);

    batch.hits.push(pageHit2);

    expect(postAsync).toBeCalledTimes(1);
    expect(postAsync).toHaveBeenNthCalledWith(1, HIT_EVENT_URL, {
      headers,
      nextFetchConfig,
      body: batch.toApiKeys(),
      timeout: config.timeout
    });

    expect(flushHitsSpy).toBeCalledTimes(0);
    expect(flushAllHitsSpy).toBeCalledTimes(1);
    expect(cacheHitSpy).toBeCalledTimes(1);
    expect(cacheHitSpy).toHaveBeenNthCalledWith(1, hitsPoolQueue);
  });

  it('test sendBatch with poolMaxSize', async () => {


    postAsync.mockResolvedValue({
      status: 200,
      body: null
    });

    const batch:Batch = new Batch({ hits: [] });
    batch.config = config;
    config.trackingManagerConfig.poolMaxSize = 20;

    for (let index = 0; index < 20; index++) {
      const pageHit = new Page({
        documentLocation: 'http://localhost' + index,
        visitorId
      });

      batch.hits.push(pageHit);

      await batchingStrategy.addHit(pageHit);
    }

    await sleep(500);

    expect(hitsPoolQueue.size).toBe(0);

    expect(postAsync).toBeCalledTimes(1);
    expect(postAsync).toHaveBeenNthCalledWith(1, HIT_EVENT_URL, {
      headers,
      nextFetchConfig,
      body: batch.toApiKeys(),
      timeout: config.timeout
    });

    expect(cacheHitSpy).toBeCalledTimes(1);
    expect(cacheHitSpy).toHaveBeenNthCalledWith(1, hitsPoolQueue);
  });

  it('test sendBatch method throw exception ', async () => {
    const error = 'message error';
    postAsync.mockRejectedValue(error);


    const addTroubleshootingHit = jest.spyOn((batchingStrategy as any), 'addTroubleshootingHit');

    const batch:Batch = new Batch({ hits: [globalPageHit] });
    batch.config = config;
    config.logLevel = LogLevel.ALL;
    hitsPoolQueue.set(globalPageHit.key, globalPageHit);

    await batchingStrategy.sendBatch();

    expect(postAsync).toBeCalledTimes(1);
    expect(postAsync).toBeCalledWith(HIT_EVENT_URL, {
      headers,
      nextFetchConfig,
      body: batch.toApiKeys(),
      timeout: config.timeout
    });
    expect(sendHitsToFsQaSpy).toBeCalledTimes(0);
    expect(flushAllHitsSpy).toBeCalledTimes(1);
    expect(cacheHitSpy).toBeCalledTimes(1);
    expect(hitsPoolQueue.size).toBe(1);
    expect(logError).toBeCalledTimes(1);
    expect(logError).toBeCalledWith(sprintf(TRACKING_MANAGER_ERROR, BATCH_HIT, {
      httpRequestBody: batch.toApiKeys(),
      httpRequestHeaders: headers,
      httpRequestMethod: 'POST',
      httpRequestUrl: HIT_EVENT_URL,
      duration: 0,
      batchTriggeredBy: BatchTriggeredBy[BatchTriggeredBy.BatchLength]
    }), TRACKING_MANAGER);

    expect(addTroubleshootingHit).toBeCalledTimes(1);
    const label = TroubleshootingLabel.SEND_BATCH_HIT_ROUTE_RESPONSE_ERROR;
    expect(addTroubleshootingHit).toBeCalledWith(expect.objectContaining({ data: expect.objectContaining({ label }) }));
  });

  it('test sendActivate on batch', async () => {
    postAsync.mockResolvedValue({
      status: 200,
      body: null
    });

    const activateHit = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate',
      variationId: 'variationId',
      flagKey: 'flagKey',
      flagValue: 'value',
      flagDefaultValue: 'default-value',
      flagMetadata: {
        campaignId: 'campaignId',
        campaignName: 'campaignName',
        variationGroupId: 'variationGrID',
        variationGroupName: 'variationGroupName',
        variationId: 'varId',
        variationName: 'variationName',
        isReference: true,
        campaignType: 'ab',
        slug: 'slug'
      },
      visitorContext: { key: 'value' }
    });
    activateHit.config = config;
    activateHit.key = visitorId;
    activateHit.key = visitorId + 'key';

    hitsPoolQueue.clear();

    activatePoolQueue.set(activateHit.key, activateHit);

    await batchingStrategy.sendBatch();

    expect(activatePoolQueue.size).toBe(0);

    expect(postAsync).toBeCalledTimes(1);

    expect(cacheHitSpy).toBeCalledTimes(1);
    expect(cacheHitSpy).toHaveBeenNthCalledWith(1, hitsPoolQueue);

    expect(postAsync).toHaveBeenNthCalledWith(1, urlActivate, {
      headers: headersActivate,
      nextFetchConfig,
      body: new ActivateBatch([activateHit], config).toApiKeys(),
      timeout: config.timeout
    });
  });

  it('test sendBatch method with empty hitsPoolQueue', async () => {
    const hitsPoolQueue = new Map<string, HitAbstract>();
    const activatePoolQueue = new Map<string, Activate>();
    const troubleshootingQueue = new Map<string, Troubleshooting>();
    const analyticHitQueue = new Map<string, UsageHit>();
    const batchingStrategy = new BatchingPeriodicCachingStrategy({
      config,
      httpClient,
      hitsPoolQueue,
      activatePoolQueue,
      troubleshootingQueue,
      analyticHitQueue
    });
    await batchingStrategy.sendBatch();
    expect(postAsync).toBeCalledTimes(0);
  });
});

describe('test activateFlag method', () => {
  const methodNow = Date.now;
  const mockNow = jest.fn<typeof Date.now>();
  beforeAll(() => {
    Date.now = mockNow;
    mockNow.mockReturnValue(1);
    sendHitsToFsQaSpy.mockImplementation(() => {
      //
    });
  });
  afterAll(() => {
    Date.now = methodNow;
  });

  const httpClient = new HttpClient();

  const postAsync = jest.spyOn(httpClient, 'postAsync');

  const onVisitorExposed = jest.fn<(arg: OnVisitorExposed)=>void>();

  const config = new DecisionApiConfig({
    envId: 'envId',
    apiKey: 'apiKey',
    onVisitorExposed
  });
  const logManager = new FlagshipLogManager();

  config.logManager = logManager;

  const hitsPoolQueue = new Map<string, HitAbstract>();
  const activatePoolQueue = new Map<string, Activate>();
  const troubleshootingQueue = new Map<string, Troubleshooting>();
  const analyticHitQueue = new Map<string, UsageHit>();
  const batchingStrategy = new BatchingPeriodicCachingStrategy({
    config,
    httpClient,
    hitsPoolQueue,
    activatePoolQueue,
    troubleshootingQueue,
    analyticHitQueue
  });


  const cacheHitSpy = jest.spyOn(batchingStrategy as any, 'cacheHit');

  const flushHitsSpy = jest.spyOn(batchingStrategy, 'flushHits');

  const sendHitsToFsQaSpy = jest.spyOn(batchingStrategy, 'sendHitsToFsQa');

  const visitorId = 'visitorId';

  const headersActivate = {
    [HEADER_X_API_KEY]: `${config.apiKey}`,
    [HEADER_X_SDK_CLIENT]: SDK_INFO.name,
    [HEADER_X_SDK_VERSION]: SDK_VERSION,
    [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
  };
  const nextFetchConfig = { revalidate: 20 };
  const urlActivate = `${BASE_API_URL}${URL_ACTIVATE_MODIFICATION}`;
  it('test activate success', async () => {


    postAsync.mockResolvedValue({
      status: 200,
      body: null
    });

    const activateHit = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate',
      variationId: 'variationId',
      flagKey: 'flagKey',
      flagValue: 'value',
      flagDefaultValue: 'default-value',
      flagMetadata: {
        campaignId: 'campaignId',
        variationGroupId: 'variationGrID',
        variationId: 'varId',
        isReference: true,
        campaignType: 'ab',
        slug: 'slug',
        campaignName: 'campaignName',
        variationGroupName: 'variationGroupName',
        variationName: 'variationName'
      },
      visitorContext: { key: 'value' }
    });
    activateHit.config = config;
    activateHit.key = visitorId;

    expect(hitsPoolQueue.size).toBe(0);

    await batchingStrategy.activateFlag(activateHit);

    expect(hitsPoolQueue.size).toBe(0);
    expect(activatePoolQueue.size).toBe(0);

    expect(postAsync).toBeCalledTimes(1);
    expect(postAsync).toHaveBeenNthCalledWith(1, urlActivate, {
      headers: headersActivate,
      nextFetchConfig,
      body: new ActivateBatch([activateHit], config).toApiKeys(),
      timeout: config.timeout
    });

    expect(sendHitsToFsQaSpy).toBeCalledTimes(1);
    activateHit.key = expect.stringContaining(visitorId) as unknown as string;
    expect(sendHitsToFsQaSpy).toBeCalledWith([activateHit]);

    expect(flushHitsSpy).toBeCalledTimes(0);
    expect(cacheHitSpy).toBeCalledTimes(0);

    expect(onVisitorExposed).toBeCalledTimes(1);
  });

  it('test multiple activate success', async () => {
    postAsync.mockResolvedValue({
      status: 200,
      body: null
    });

    const activateHit = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate',
      variationId: 'variationId',
      flagKey: 'flagKey',
      flagValue: 'value',
      flagDefaultValue: 'default-value',
      flagMetadata: {
        campaignId: 'campaignId',
        variationGroupId: 'variationGrID',
        variationId: 'varId',
        isReference: true,
        campaignType: 'ab',
        slug: 'slug',
        campaignName: 'campaignName',
        variationGroupName: 'variationGroupName',
        variationName: 'variationName'
      },
      visitorContext: { key: 'value' }
    });
    activateHit.config = config;
    activateHit.key = visitorId;

    const activateHit2 = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate-2',
      variationId: 'variationId-2',
      flagKey: 'flagKey',
      flagValue: 'value',
      flagDefaultValue: 'default-value',
      flagMetadata: {
        campaignId: 'campaignId',
        variationGroupId: 'variationGrID',
        variationId: 'varId',
        isReference: true,
        campaignType: 'ab',
        slug: 'slug',
        campaignName: 'campaignName',
        variationGroupName: 'variationGroupName',
        variationName: 'variationName'
      },
      visitorContext: { key: 'value' }
    });

    activateHit2.config = config;
    activateHit2.key = visitorId + 'key-2';

    const activateHit3 = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate-3',
      variationId: 'variationId-3',
      flagKey: 'flagKey',
      flagValue: 'value',
      flagDefaultValue: 'default-value',
      flagMetadata: {
        campaignId: 'campaignId',
        variationGroupId: 'variationGrID',
        variationId: 'varId',
        isReference: true,
        campaignType: 'ab',
        slug: 'slug',
        campaignName: 'campaignName',
        variationGroupName: 'variationGroupName',
        variationName: 'variationName'
      },
      visitorContext: { key: 'value' }
    });
    activateHit3.config = config;
    activateHit3.key = visitorId + 'key-3';

    activatePoolQueue.set(activateHit2.key, activateHit2).set(activateHit3.key, activateHit3);

    expect(hitsPoolQueue.size).toBe(0);
    expect(activatePoolQueue.size).toBe(2);

    await batchingStrategy.activateFlag(activateHit);

    expect(hitsPoolQueue.size).toBe(0);
    expect(activatePoolQueue.size).toBe(0);

    expect(postAsync).toBeCalledTimes(1);
    const activateBatch = new ActivateBatch([activateHit2, activateHit3, activateHit], config);
    expect(postAsync).toHaveBeenNthCalledWith(1, urlActivate, {
      headers: headersActivate,
      nextFetchConfig,
      body: activateBatch.toApiKeys(),
      timeout: config.timeout
    });

    expect(sendHitsToFsQaSpy).toBeCalledTimes(1);
    expect(sendHitsToFsQaSpy).toBeCalledWith(activateBatch.hits.map(item => {
      item.key = expect.stringContaining(visitorId) as unknown as string;
      return item;
    }));

    expect(cacheHitSpy).toBeCalledTimes(0);
    expect(flushHitsSpy).toBeCalledTimes(0);

    expect(onVisitorExposed).toBeCalledTimes(3);
  });

  it('test multiple activate failed', async () => {
    const error = 'message error';
    postAsync.mockRejectedValue(error);


    const sendTroubleshootingHit = jest.spyOn((batchingStrategy as any), 'sendTroubleshootingHit');

    const activateHit = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate',
      variationId: 'variationId',
      flagKey: 'flagKey',
      flagValue: 'value',
      flagDefaultValue: 'default-value',
      flagMetadata: {
        campaignId: 'campaignId',
        variationGroupId: 'variationGrID',
        variationId: 'varId',
        isReference: true,
        campaignType: 'ab',
        slug: 'slug',
        campaignName: 'campaignName',
        variationGroupName: 'variationGroupName',
        variationName: 'variationName'
      },
      visitorContext: { key: 'value' }
    });
    activateHit.config = config;
    activateHit.key = visitorId;

    const activateHit2 = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate-2',
      variationId: 'variationId-2',
      flagKey: 'flagKey',
      flagValue: 'value',
      flagDefaultValue: 'default-value',
      flagMetadata: {
        campaignId: 'campaignId',
        variationGroupId: 'variationGrID',
        variationId: 'varId',
        isReference: true,
        campaignType: 'ab',
        slug: 'slug',
        campaignName: 'campaignName',
        variationGroupName: 'variationGroupName',
        variationName: 'variationName'
      },
      visitorContext: { key: 'value' }
    });

    activateHit2.config = config;
    activateHit2.key = visitorId + 'key-2';

    const activateHit3 = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate-3',
      variationId: 'variationId-3',
      flagKey: 'flagKey',
      flagValue: 'value',
      flagDefaultValue: 'default-value',
      flagMetadata: {
        campaignId: 'campaignId',
        variationGroupId: 'variationGrID',
        variationId: 'varId',
        isReference: true,
        campaignType: 'ab',
        slug: 'slug',
        campaignName: 'campaignName',
        variationGroupName: 'variationGroupName',
        variationName: 'variationName'
      },
      visitorContext: { key: 'value' }
    });
    activateHit3.config = config;
    activateHit3.key = visitorId + 'key-3';

    activatePoolQueue.set(activateHit2.key, activateHit2).set(activateHit3.key, activateHit3);

    expect(hitsPoolQueue.size).toBe(0);
    expect(activatePoolQueue.size).toBe(2);

    await batchingStrategy.activateFlag(activateHit);

    expect(hitsPoolQueue.size).toBe(0);
    expect(activatePoolQueue.size).toBe(3);

    expect(postAsync).toBeCalledTimes(1);
    expect(postAsync).toHaveBeenNthCalledWith(1, urlActivate, {
      headers: headersActivate,
      nextFetchConfig,
      body: new ActivateBatch([activateHit2, activateHit3, activateHit], config).toApiKeys(),
      timeout: config.timeout
    });

    expect(sendHitsToFsQaSpy).toBeCalledTimes(0);
    expect(flushHitsSpy).toBeCalledTimes(0);
    expect(cacheHitSpy).toBeCalledTimes(0);

    expect(onVisitorExposed).toBeCalledTimes(0);

    expect(sendTroubleshootingHit).toBeCalledTimes(1);
    const label: TroubleshootingLabel = TroubleshootingLabel.SEND_ACTIVATE_HIT_ROUTE_ERROR;
    expect(sendTroubleshootingHit).toBeCalledWith(expect.objectContaining({ data: expect.objectContaining({ label }) }));
  });
});
