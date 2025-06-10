import { jest, expect, it, describe } from '@jest/globals';
import { DecisionApiConfig, EAIScore, IVisitorCacheImplementation, VisitorCacheDTO } from '../../src';
import { TrackingManager } from '../../src/api/TrackingManager';
import { ConfigManager } from '../../src/config';
import { ApiManager } from '../../src/decision/ApiManager';
import { FLAG_METADATA, FLAG_VISITOR_EXPOSED, FSSdkStatus, HitType, LogLevel, METADATA_PANIC_MODE, METHOD_DEACTIVATED_ERROR, VISITOR_CACHE_VERSION } from '../../src/enum';
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager';
import { HttpClient } from '../../src/utils/HttpClient';
import { sprintf } from '../../src/utils/utils';
import { VisitorDelegate, PanicStrategy } from '../../src/visitor';
import { campaigns } from '../decision/campaigns';
import { MurmurHash } from '../../src/utils/MurmurHash';
import { IEmotionAI } from '../../src/emotionAI/IEmotionAI';
import { VisitorAbstract } from '../../src/visitor/VisitorAbstract';
import { IPageView } from '../../src/emotionAI/hit/IPageView';
import { IVisitorEvent } from '../../src/emotionAI/hit/IVisitorEvent';

describe('test NotReadyStrategy', () => {
  const visitorId = 'visitorId';

  const context: any = { isVip: true };

  const cacheVisitor = jest.fn<(visitorId: string, data: VisitorCacheDTO)=>Promise<void>>();
  const lookupVisitor = jest.fn<(visitorId: string)=>Promise<VisitorCacheDTO>>();
  const flushVisitor = jest.fn<(visitorId: string)=>Promise<void>>();
  const visitorCacheImplementation:IVisitorCacheImplementation = {
    cacheVisitor,
    lookupVisitor,
    flushVisitor
  };

  const logManager = new FlagshipLogManager();
  const logInfo = jest.spyOn(logManager, 'info');

  const config = new DecisionApiConfig({
    envId: 'envId',
    apiKey: 'apiKey',
    visitorCacheImplementation,
    logLevel: LogLevel.INFO
  });
  config.logManager = logManager;

  const trackingManager = new TrackingManager({} as HttpClient, config);

  const apiManager = new ApiManager({
    httpClient: {} as HttpClient,
    config,
    trackingManager
  });

  const getCampaignsAsync = jest.spyOn(apiManager, 'getCampaignsAsync');



  const sendUsageHitSpy = jest.spyOn(trackingManager, 'sendUsageHit');
  const sendTroubleshootingHit = jest.spyOn(trackingManager, 'sendTroubleshootingHit');

  const configManager = new ConfigManager(config, apiManager, trackingManager);
  const fetchEAIScore = jest.fn<() => Promise<EAIScore|undefined>>();

  const collectEAIData = jest.fn<(currentPage?: Omit<IPageView, 'toApiKeys'>) => void>();

  const reportVisitorEvent = jest.fn<(event: IVisitorEvent)=> Promise<void>>();

  const reportPageView = jest.fn<(pageView: IPageView) => Promise<void>>();

  const onEAICollectStatusChange = jest.fn<(callback: (status: boolean) => void) => void>();

  const cleanup = jest.fn<() => void>();

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>(),
    fetchEAIScore,
    collectEAIData,
    reportVisitorEvent,
    reportPageView,
    onEAICollectStatusChange,
    cleanup
  } as unknown as IEmotionAI;

  const visitorDelegate = new VisitorDelegate({
    visitorId,
    context,
    configManager,
    hasConsented: true,
    emotionAi
  });
  const murmurHash = new MurmurHash();

  const panicStrategy = new PanicStrategy({
    visitor: visitorDelegate,
    murmurHash
  });

  it('test setConsent', () => {
    panicStrategy.setConsent(true);
    expect(visitorDelegate.hasConsented).toBe(true);
  });

  it('test updateContext', () => {
    const methodName = 'updateContext';
    panicStrategy.updateContext();
    expect(logInfo).toBeCalledTimes(1);
    expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, methodName, FSSdkStatus[FSSdkStatus.SDK_PANIC]), methodName);
  });

  it('test clearContext', () => {
    const methodName = 'clearContext';
    panicStrategy.clearContext();
    expect(logInfo).toBeCalledTimes(1);
    expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, methodName, FSSdkStatus[FSSdkStatus.SDK_PANIC]), methodName);
  });

  it('test getFlagValue', () => {
    const defaultValue = 'value';
    const flagValue = panicStrategy.getFlagValue({
      key: 'key',
      defaultValue
    });
    const methodName = 'Flag.value';
    expect(flagValue).toBe(defaultValue);
    expect(logInfo).toBeCalledTimes(1);
    expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, methodName, FSSdkStatus[FSSdkStatus.SDK_PANIC]), methodName);
  });

  it('test getFlagMetadata', () => {
    const key = 'flagKey';
    const metadata = panicStrategy.getFlagMetadata({ key });
    expect(metadata).toEqual({
      campaignId: '',
      slug: null,
      variationGroupId: '',
      campaignType: '',
      variationId: '',
      isReference: false,
      campaignName: '',
      variationGroupName: '',
      variationName: ''
    });
    expect(logInfo).toBeCalledTimes(1);
    expect(logInfo).toBeCalledWith(sprintf(METADATA_PANIC_MODE, visitorId, key, metadata), FLAG_METADATA);
  });

  it('test fetchVisitorCacheCampaigns', async () => {
    getCampaignsAsync.mockResolvedValue([]);
    visitorDelegate.visitorCache = {
      version: VISITOR_CACHE_VERSION,
      data: {
        visitorId: visitorDelegate.visitorId,
        anonymousId: visitorDelegate.anonymousId,
        consent: visitorDelegate.hasConsented,
        context: visitorDelegate.context,
        campaigns: campaigns.campaigns.map(campaign => {
          return {
            campaignId: campaign.id,
            variationGroupId: campaign.variationGroupId,
            variationId: campaign.variation.id,
            isReference: campaign.variation.reference,
            type: campaign.variation.modifications.type,
            activated: false,
            flags: campaign.variation.modifications.value
          };
        })
      }
    };
    await panicStrategy.fetchFlags();
    expect(visitorDelegate.campaigns).toEqual([]);
    expect(cacheVisitor).toBeCalledTimes(0);
    await panicStrategy.lookupHits();
    await panicStrategy.lookupVisitor();
  });

  it('test visitorExposed', async () => {
    await panicStrategy.visitorExposed();
    expect(logInfo).toBeCalledTimes(1);
    expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, FLAG_VISITOR_EXPOSED, FSSdkStatus[FSSdkStatus.SDK_PANIC]), FLAG_VISITOR_EXPOSED);
  });

  it('test sendHit', async () => {
    await panicStrategy.sendHit({
      type: HitType.PAGE,
      documentLocation: 'home'
    });
    const methodName = 'sendHit';
    expect(logInfo).toBeCalledTimes(1);
    expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, methodName, FSSdkStatus[FSSdkStatus.SDK_PANIC]), methodName);
  });

  it('test sendHits', async () => {
    await panicStrategy.sendHits([{
      type: HitType.PAGE,
      documentLocation: 'home'
    }]);
    const methodName = 'sendHits';
    expect(logInfo).toBeCalledTimes(1);
    expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, methodName, FSSdkStatus[FSSdkStatus.SDK_PANIC]), methodName);
  });

  it('test sendTroubleshootingHit', () => {
    panicStrategy.sendTroubleshootingHit();
    expect(sendTroubleshootingHit).toBeCalledTimes(0);
  });

  it('test sendAnalyticHit', () => {
    panicStrategy.sendSdkConfigAnalyticHit();
    expect(sendUsageHitSpy).toBeCalledTimes(0);
  });

  it('test collectEAIData', () => {
    panicStrategy.collectEAIEventsAsync();
    expect(logInfo).toBeCalledTimes(1);
  });

  it('test reportEaiPageView', () => {
    panicStrategy.reportEaiPageView();
    expect(logInfo).toBeCalledTimes(0);
    expect(emotionAi.reportPageView).toBeCalledTimes(0);
  });

  it('test reportEaiVisitorEvent', () => {
    panicStrategy.reportEaiVisitorEvent();
    expect(logInfo).toBeCalledTimes(0);
    expect(emotionAi.reportVisitorEvent).toBeCalledTimes(0);
  });

  it('test onEAICollectStatusChange', () => {
    panicStrategy.onEAICollectStatusChange();
    expect(logInfo).toBeCalledTimes(0);
    expect(emotionAi.onEAICollectStatusChange).toBeCalledTimes(0);
  });
});
