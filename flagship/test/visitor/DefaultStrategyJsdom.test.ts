/**
 * @jest-environment jsdom
 */
import { jest, expect, it, describe, beforeAll, afterAll } from '@jest/globals';
import { DecisionApiConfig,
  EAIScore,
  EventCategory,
  FlagsStatus,
  FlagDTO,
  VisitorVariations } from '../../src/index';
import { TrackingManager } from '../../src/api/TrackingManager';
import { ConfigManager } from '../../src/config/index';
import { ApiManager } from '../../src/decision/ApiManager';
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager';
import { IHttpResponse, HttpClient } from '../../src/utils/HttpClient';
import { DefaultStrategy } from '../../src/visitor/DefaultStrategy';
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate';
import { HitType,
  SDK_APP } from '../../src/enum';
import { MurmurHash } from '../../src/utils/MurmurHash';
import { returnFlag } from './flags';
import { FSFetchStatus } from '../../src/enum/FSFetchStatus';
import { FSFetchReasons } from '../../src/enum/FSFetchReasons';
import { IEmotionAI } from '../../src/emotionAI/IEmotionAI';
import { VisitorAbstract } from '../../src/visitor/VisitorAbstract';
import { IPageView } from '../../src/emotionAI/hit/IPageView';
import { IVisitorEvent } from '../../src/emotionAI/hit/IVisitorEvent';
import { mockGlobals, sleep } from '../helpers';
import { ActivateConstructorParam, VisitorVariationState } from '../../src/type.local';
import * as qaMessages from '../../src/qaAssistant/messages';
import { NotReadyStrategy, PanicStrategy } from '../../src/visitor';



describe('test DefaultStrategy ', () => {
  const methodNow = Date.now;
  const mockNow = jest.fn<typeof Date.now>();
  beforeAll(() => {
    Date.now = mockNow;
    mockNow.mockReturnValue(1);
  });
  afterAll(() => {
    Date.now = methodNow;
  });

  afterEach(() => {
    mockGlobals({
      __fsWebpackIsBrowser__: false,
      __fsWebpackIsReactNative__: false
    });
  });

  beforeEach(() => {
    config.isQAModeEnabled = false;
  });

  const visitorId = 'visitorId';

  const context: any = { isVip: true };

  const logManager = new FlagshipLogManager();

  const config = new DecisionApiConfig({
    envId: 'envId',
    apiKey: 'apiKey',
    hitDeduplicationTime: 0,
    fetchFlagsBufferingTime: 0
  });
  config.logManager = logManager;

  const httpClient = new HttpClient();

  const post = jest.fn<typeof httpClient.postAsync>();
  httpClient.postAsync = post;
  post.mockResolvedValue({} as IHttpResponse);

  const trackingManager = new TrackingManager(httpClient, config);

  const apiManager = new ApiManager({
    httpClient,
    config,
    trackingManager
  });

  const isPanicFn = jest.fn<() => boolean>();
  apiManager.isPanic = isPanicFn;

  const getCampaignsAsync = jest.spyOn(apiManager, 'getCampaignsAsync');

  const getModifications = jest.spyOn(apiManager, 'getModifications');



  const sendTroubleshootingHitSpy = jest.spyOn(
    trackingManager,
    'sendTroubleshootingHit'
  );

  const addHit = jest.spyOn(trackingManager, 'addHit');
  addHit.mockResolvedValue();

  const activateFlag = jest.spyOn(trackingManager, 'activateFlag');
  activateFlag.mockResolvedValue();

  const configManager = new ConfigManager(config, apiManager, trackingManager);

  const murmurHash = new MurmurHash();

  const OnFlagStatusChanged =
    jest.fn<({ status, reason }: FlagsStatus) => void>();

  const fetchEAIScore = jest.fn<() => Promise<EAIScore | undefined>>();

  const collectEAIEventsAsync =
    jest.fn<(currentPage?: Omit<IPageView, 'toApiKeys'>) => void>();

  const reportVisitorEvent = jest.fn<(event: IVisitorEvent) => Promise<void>>();

  const reportPageView = jest.fn<(pageView: IPageView) => Promise<void>>();

  const onEAICollectStatusChange =
    jest.fn<(callback: (status: boolean) => void) => void>();

  const cleanup = jest.fn<() => void>();

  const emotionAi = {
    init: jest.fn<(visitor: VisitorAbstract) => void>(),
    fetchEAIScore,
    collectEAIEventsAsync,
    reportVisitorEvent,
    reportPageView,
    onEAICollectStatusChange,
    cleanup
  } as unknown as IEmotionAI;

  fetchEAIScore.mockResolvedValue(undefined);

  const visitorVariationState: VisitorVariationState = {};

  const visitorDelegate = new VisitorDelegate({
    visitorId,
    context,
    configManager,
    hasConsented: true,
    onFlagsStatusChanged: OnFlagStatusChanged,
    emotionAi,
    visitorVariationState
  });
  const defaultStrategy = new DefaultStrategy({
    visitor: visitorDelegate,
    murmurHash
  });

  const campaignDtoId = 'c2nrh1hjg50l9stringgu8bg';
  const campaignDTO = [
    {
      id: campaignDtoId,
      slug: 'slug',
      variationGroupId: 'id',
      variation: {
        id: '1dl',
        reference: false,
        modifications: {
          type: 'number',
          value: { key: 12 }
        }
      }
    }
  ];


  it('test fetchFlags and send visitor variable to QA assistant', async () => {
    config.isQAModeEnabled = true;
    mockGlobals({ __fsWebpackIsBrowser__: true });
    visitorDelegate.on('ready', (err) => {
      expect(err).toBeUndefined();
    });

    fetchEAIScore.mockResolvedValue({ eai: { eas: 'straightforward' } });

    const sendVisitorAllocatedVariationsSpy = jest.spyOn(qaMessages, 'sendVisitorAllocatedVariations');
    sendTroubleshootingHitSpy.mockResolvedValue();

    getCampaignsAsync.mockResolvedValue(campaignDTO);
    getModifications.mockReturnValue(returnFlag);
    await defaultStrategy.fetchFlags();
    expect(getCampaignsAsync).toBeCalledTimes(1);
    expect(getCampaignsAsync).toBeCalledWith(visitorDelegate);
    expect(visitorDelegate.flagsStatus).toEqual({
      status: FSFetchStatus.FETCHED,
      reason: FSFetchReasons.NONE
    });

    expect(visitorDelegate.onFetchFlagsStatusChanged).toBeCalledTimes(2);
    expect(visitorDelegate.onFetchFlagsStatusChanged).toHaveBeenNthCalledWith(
      1,
      {
        status: FSFetchStatus.FETCHING,
        reason: FSFetchReasons.NONE
      }
    );
    expect(visitorDelegate.onFetchFlagsStatusChanged).toHaveBeenNthCalledWith(
      2,
      {
        status: FSFetchStatus.FETCHED,
        reason: FSFetchReasons.NONE
      }
    );
    expect(emotionAi.fetchEAIScore).toBeCalledTimes(1);

    const visitorAllocatedVariations: Record<string, VisitorVariations> = {};

    visitorDelegate.flagsData.forEach((item) => {
      visitorAllocatedVariations[item.campaignId] = {
        variationId: item.variationId,
        variationGroupId: item.variationGroupId,
        campaignId: item.campaignId
      };
    });
    await sleep(10);
    expect(sendVisitorAllocatedVariationsSpy).toBeCalledTimes(1);
    expect(sendVisitorAllocatedVariationsSpy).toBeCalledWith(visitorVariationState);
  });

});


describe('test DefaultStrategy with QA mode', () => {
  const methodNow = Date.now;
  const mockNow = jest.fn<typeof Date.now>();
  beforeAll(() => {
    Date.now = mockNow;
    mockNow.mockReturnValue(1);
  });
  afterAll(() => {
    Date.now = methodNow;
  });
  const visitorId = 'ca0594f5-4a37-4a7d-91be-27c63f829380';

  const context: any = { isVip: true };

  const logManager = new FlagshipLogManager();

  const config = new DecisionApiConfig({
    envId: 'envId',
    apiKey: 'apiKey',
    hitDeduplicationTime: 0
  });
  config.logManager = logManager;
  config.isQAModeEnabled = true;

  const httpClient = new HttpClient();

  const post = jest.fn<typeof httpClient.postAsync>();
  httpClient.postAsync = post;
  post.mockResolvedValue({} as IHttpResponse);


  const trackingManager = new TrackingManager(httpClient, config);

  const apiManager = new ApiManager({
    httpClient,
    config,
    trackingManager
  });


  const addHit = jest.spyOn(trackingManager, 'addHit');
  addHit.mockResolvedValue();

  const configManager = new ConfigManager(config, apiManager, trackingManager);

  const fetchEAIScore = jest.fn<() => Promise<EAIScore | undefined>>();

  const emotionAi = {
    init: jest.fn<(visitor: VisitorAbstract) => void>(),
    fetchEAIScore
  } as unknown as IEmotionAI;

  fetchEAIScore.mockResolvedValue(undefined);

  const FsInstanceId = 'FsInstanceId';
  const murmurHash = new MurmurHash();
  const visitorDelegate = new VisitorDelegate({
    visitorId,
    context,
    configManager,
    monitoringData: {
      instanceId: FsInstanceId,
      lastInitializationTimestamp: ''
    },
    hasConsented: true,
    emotionAi
  });
  const defaultStrategy = new DefaultStrategy({
    visitor: visitorDelegate,
    murmurHash
  });
  const returnMod = returnFlag.get('keyString') as FlagDTO;

  const activateFlag = jest.spyOn(trackingManager, 'activateFlag');
  activateFlag.mockResolvedValue();

  it('test visitorExposed', async () => {
    await defaultStrategy.visitorExposed({
      key: returnMod.key,
      flag: returnMod,
      defaultValue: returnMod.value,
      hasGetValueBeenCalled: true
    });
    expect(activateFlag).toBeCalledTimes(1);
    const activateHit: ActivateConstructorParam = {
      variationGroupId: returnMod.variationGroupId,
      variationId: returnMod.variationId,
      visitorId,
      flagKey: returnMod.key,
      flagValue: returnMod.value,
      flagDefaultValue: returnMod.value,
      qaMode: true,
      visitorContext: visitorDelegate.context,
      flagMetadata: {
        campaignId: returnMod.campaignId,
        variationGroupId: returnMod.variationGroupId,
        variationId: returnMod.variationId,
        isReference: returnMod.isReference as boolean,
        campaignType: returnMod.campaignType as string,
        slug: returnMod.slug,
        campaignName: returnMod.campaignName,
        variationGroupName: returnMod.variationGroupName,
        variationName: returnMod.variationName
      },
      anonymousId: visitorDelegate.anonymousId
    };

    expect(activateFlag).toBeCalledWith(activateHit);
  });

  it('test sendHitAsync with literal object Event ', async () => {
    const hit = {
      type: HitType.EVENT,
      action: 'action_1',
      category: EventCategory.ACTION_TRACKING
    };
    await defaultStrategy.sendHit(hit);
    expect(addHit).toBeCalledTimes(1);
    expect(addHit).toBeCalledWith(
      expect.objectContaining({
        ...hit,
        visitorId,
        ds: SDK_APP,
        config,
        qaMode: true
      })
    );
  });
});


describe('test Panic', () => {
  const methodNow = Date.now;
  const mockNow = jest.fn<typeof Date.now>();
  beforeAll(() => {
    Date.now = mockNow;
    mockNow.mockReturnValue(1);
  });
  afterAll(() => {
    Date.now = methodNow;
  });

  afterEach(() => {
    mockGlobals({
      __fsWebpackIsBrowser__: false,
      __fsWebpackIsReactNative__: false
    });
  });

  beforeEach(() => {
    config.isQAModeEnabled = false;
  });

  const visitorId = 'visitorId';

  const context: any = { isVip: true };

  const logManager = new FlagshipLogManager();

  const config = new DecisionApiConfig({
    envId: 'envId',
    apiKey: 'apiKey',
    hitDeduplicationTime: 0,
    fetchFlagsBufferingTime: 0
  });
  config.logManager = logManager;

  const httpClient = new HttpClient();

  const post = jest.fn<typeof httpClient.postAsync>();
  httpClient.postAsync = post;
  post.mockResolvedValue({} as IHttpResponse);

  const trackingManager = new TrackingManager(httpClient, config);

  const apiManager = new ApiManager({
    httpClient,
    config,
    trackingManager
  });

  const isPanicFn = jest.fn<() => boolean>();
  apiManager.isPanic = isPanicFn;

  const getCampaignsAsync = jest.spyOn(apiManager, 'getCampaignsAsync');

  const getModifications = jest.spyOn(apiManager, 'getModifications');



  const sendTroubleshootingHitSpy = jest.spyOn(
    trackingManager,
    'sendTroubleshootingHit'
  );

  const addHit = jest.spyOn(trackingManager, 'addHit');
  addHit.mockResolvedValue();

  const activateFlag = jest.spyOn(trackingManager, 'activateFlag');
  activateFlag.mockResolvedValue();

  const configManager = new ConfigManager(config, apiManager, trackingManager);

  const murmurHash = new MurmurHash();

  const OnFlagStatusChanged =
    jest.fn<({ status, reason }: FlagsStatus) => void>();

  const fetchEAIScore = jest.fn<() => Promise<EAIScore | undefined>>();

  const collectEAIEventsAsync =
    jest.fn<(currentPage?: Omit<IPageView, 'toApiKeys'>) => void>();

  const reportVisitorEvent = jest.fn<(event: IVisitorEvent) => Promise<void>>();

  const reportPageView = jest.fn<(pageView: IPageView) => Promise<void>>();

  const onEAICollectStatusChange =
    jest.fn<(callback: (status: boolean) => void) => void>();

  const cleanup = jest.fn<() => void>();

  const emotionAi = {
    init: jest.fn<(visitor: VisitorAbstract) => void>(),
    fetchEAIScore,
    collectEAIEventsAsync,
    reportVisitorEvent,
    reportPageView,
    onEAICollectStatusChange,
    cleanup
  } as unknown as IEmotionAI;

  fetchEAIScore.mockResolvedValue(undefined);

  const visitorVariationState: VisitorVariationState = {};

  const visitorDelegate = new VisitorDelegate({
    visitorId,
    context,
    configManager,
    hasConsented: true,
    onFlagsStatusChanged: OnFlagStatusChanged,
    emotionAi,
    visitorVariationState
  });
  const defaultStrategy = new PanicStrategy({
    visitor: visitorDelegate,
    murmurHash
  });

  const campaignDtoId = 'c2nrh1hjg50l9stringgu8bg';
  const campaignDTO = [
    {
      id: campaignDtoId,
      slug: 'slug',
      variationGroupId: 'id',
      variation: {
        id: '1dl',
        reference: false,
        modifications: {
          type: 'number',
          value: { key: 12 }
        }
      }
    }
  ];


  it('test fetchFlags and send visitor variable to QA assistant', async () => {
    config.isQAModeEnabled = true;
    mockGlobals({ __fsWebpackIsBrowser__: true });
    visitorDelegate.on('ready', (err) => {
      expect(err).toBeUndefined();
    });

    fetchEAIScore.mockResolvedValue({ eai: { eas: 'straightforward' } });

    const sendVisitorAllocatedVariationsSpy = jest.spyOn(qaMessages, 'sendVisitorAllocatedVariations');
    sendTroubleshootingHitSpy.mockResolvedValue();

    getCampaignsAsync.mockResolvedValue(campaignDTO);
    getModifications.mockReturnValue(returnFlag);

    await defaultStrategy.fetchFlags();

    expect(getCampaignsAsync).toBeCalledTimes(1);
    expect(getCampaignsAsync).toBeCalledWith(visitorDelegate);
    expect(visitorDelegate.flagsStatus).toEqual({
      status: FSFetchStatus.FETCHED,
      reason: FSFetchReasons.NONE
    });

    expect(visitorDelegate.onFetchFlagsStatusChanged).toBeCalledTimes(2);
    expect(visitorDelegate.onFetchFlagsStatusChanged).toHaveBeenNthCalledWith(
      1,
      {
        status: FSFetchStatus.FETCHING,
        reason: FSFetchReasons.NONE
      }
    );
    expect(visitorDelegate.onFetchFlagsStatusChanged).toHaveBeenNthCalledWith(
      2,
      {
        status: FSFetchStatus.FETCHED,
        reason: FSFetchReasons.NONE
      }
    );
    expect(emotionAi.fetchEAIScore).toBeCalledTimes(1);

    const visitorAllocatedVariations: Record<string, VisitorVariations> = {};

    visitorDelegate.flagsData.forEach((item) => {
      visitorAllocatedVariations[item.campaignId] = {
        variationId: item.variationId,
        variationGroupId: item.variationGroupId,
        campaignId: item.campaignId
      };
    });
    await sleep(10);
    expect(sendVisitorAllocatedVariationsSpy).toBeCalledTimes(0);
  });

});

describe('test NotReady', () => {
  const methodNow = Date.now;
  const mockNow = jest.fn<typeof Date.now>();
  beforeAll(() => {
    Date.now = mockNow;
    mockNow.mockReturnValue(1);
  });
  afterAll(() => {
    Date.now = methodNow;
  });

  afterEach(() => {
    mockGlobals({
      __fsWebpackIsBrowser__: false,
      __fsWebpackIsReactNative__: false
    });
  });

  beforeEach(() => {
    config.isQAModeEnabled = false;
  });

  const visitorId = 'visitorId';

  const context: any = { isVip: true };

  const logManager = new FlagshipLogManager();

  const config = new DecisionApiConfig({
    envId: 'envId',
    apiKey: 'apiKey',
    hitDeduplicationTime: 0,
    fetchFlagsBufferingTime: 0
  });
  config.logManager = logManager;

  const httpClient = new HttpClient();

  const post = jest.fn<typeof httpClient.postAsync>();
  httpClient.postAsync = post;
  post.mockResolvedValue({} as IHttpResponse);

  const trackingManager = new TrackingManager(httpClient, config);

  const apiManager = new ApiManager({
    httpClient,
    config,
    trackingManager
  });

  const isPanicFn = jest.fn<() => boolean>();
  apiManager.isPanic = isPanicFn;

  const getCampaignsAsync = jest.spyOn(apiManager, 'getCampaignsAsync');

  const getModifications = jest.spyOn(apiManager, 'getModifications');



  const sendTroubleshootingHitSpy = jest.spyOn(
    trackingManager,
    'sendTroubleshootingHit'
  );

  const addHit = jest.spyOn(trackingManager, 'addHit');
  addHit.mockResolvedValue();

  const activateFlag = jest.spyOn(trackingManager, 'activateFlag');
  activateFlag.mockResolvedValue();

  const configManager = new ConfigManager(config, apiManager, trackingManager);

  const murmurHash = new MurmurHash();

  const OnFlagStatusChanged =
    jest.fn<({ status, reason }: FlagsStatus) => void>();

  const fetchEAIScore = jest.fn<() => Promise<EAIScore | undefined>>();

  const collectEAIEventsAsync =
    jest.fn<(currentPage?: Omit<IPageView, 'toApiKeys'>) => void>();

  const reportVisitorEvent = jest.fn<(event: IVisitorEvent) => Promise<void>>();

  const reportPageView = jest.fn<(pageView: IPageView) => Promise<void>>();

  const onEAICollectStatusChange =
    jest.fn<(callback: (status: boolean) => void) => void>();

  const cleanup = jest.fn<() => void>();

  const emotionAi = {
    init: jest.fn<(visitor: VisitorAbstract) => void>(),
    fetchEAIScore,
    collectEAIEventsAsync,
    reportVisitorEvent,
    reportPageView,
    onEAICollectStatusChange,
    cleanup
  } as unknown as IEmotionAI;

  fetchEAIScore.mockResolvedValue(undefined);

  const visitorVariationState: VisitorVariationState = {};

  const visitorDelegate = new VisitorDelegate({
    visitorId,
    context,
    configManager,
    hasConsented: true,
    onFlagsStatusChanged: OnFlagStatusChanged,
    emotionAi,
    visitorVariationState
  });
  const defaultStrategy = new NotReadyStrategy({
    visitor: visitorDelegate,
    murmurHash
  });

  const campaignDtoId = 'c2nrh1hjg50l9stringgu8bg';
  const campaignDTO = [
    {
      id: campaignDtoId,
      slug: 'slug',
      variationGroupId: 'id',
      variation: {
        id: '1dl',
        reference: false,
        modifications: {
          type: 'number',
          value: { key: 12 }
        }
      }
    }
  ];


  it('test fetchFlags and send visitor variable to QA assistant', async () => {
    config.isQAModeEnabled = true;
    mockGlobals({ __fsWebpackIsBrowser__: true });
    visitorDelegate.on('ready', (err) => {
      expect(err).toBeUndefined();
    });

    fetchEAIScore.mockResolvedValue({ eai: { eas: 'straightforward' } });

    const sendVisitorAllocatedVariationsSpy = jest.spyOn(qaMessages, 'sendVisitorAllocatedVariations');
    sendTroubleshootingHitSpy.mockResolvedValue();

    getCampaignsAsync.mockResolvedValue(campaignDTO);
    getModifications.mockReturnValue(returnFlag);

    await defaultStrategy.fetchFlags();

    expect(getCampaignsAsync).toBeCalledTimes(0);

    const visitorAllocatedVariations: Record<string, VisitorVariations> = {};

    visitorDelegate.flagsData.forEach((item) => {
      visitorAllocatedVariations[item.campaignId] = {
        variationId: item.variationId,
        variationGroupId: item.variationGroupId,
        campaignId: item.campaignId
      };
    });
    await sleep(10);
    expect(sendVisitorAllocatedVariationsSpy).toBeCalledTimes(0);
  });

});
