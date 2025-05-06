/**
 * @jest-environment jsdom
 */
import { jest, it, describe } from '@jest/globals';
import { TrackingManager } from '../../src/api/TrackingManager';
import { ConfigManager, DecisionApiConfig } from '../../src/config';
import { ApiManager } from '../../src/decision/ApiManager';
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager';
import { HttpClient } from '../../src/utils/HttpClient';
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate';
import * as utils from '../../src/utils/utils';
import * as messages from '../../src/qaAssistant/messages';
import { primitive, VisitorVariations } from '../../src/types';
import { VisitorAbstract } from '../../src/visitor/VisitorAbstract';
import { IEmotionAI } from '../../src/emotionAI/IEmotionAI';
import { mockGlobals, sleep } from '../helpers';
import { DecisionManager } from '../../src/decision/DecisionManager';
import { VisitorProfileCache } from '../../src/visitor/VisitorProfileCache.browser';
import { VisitorVariationState } from '../../src/type.local';

describe('test sendExposedVariation', () => {
  beforeEach(() => {
    config.isQAModeEnabled = true;
    isBrowserSpy.mockReturnValue(true);
    sendVisitorExposedVariationsSpy.mockImplementation(() => {
      //
    });
    mockGlobals({ __fsWebpackIsBrowser__: true });
  });

  const visitorVariationState: VisitorVariationState = {};
  const isBrowserSpy = jest.spyOn(utils, 'isBrowser');
  const sendVisitorExposedVariationsSpy = jest.spyOn(messages, 'sendVisitorExposedVariations');
  const visitorId = 'visitorId';

  const context: any = { isVip: true };

  const logManager = new FlagshipLogManager();

  const config = new DecisionApiConfig({
    envId: 'envId',
    apiKey: 'apiKey'
  });
  config.logManager = logManager;

  const httpClient = new HttpClient();

  const apiManager = new ApiManager(httpClient, config);

  const trackingManager = new TrackingManager(httpClient, config);

  const configManager = new ConfigManager(config, apiManager, trackingManager);

  const init = jest.fn<(visitor:VisitorAbstract) => void>();

  const emotionAi = { init } as unknown as IEmotionAI;

  it('Test sendExposedVariation flag is undefined ', () => {
    const visitorDelegate = new VisitorDelegate({
      visitorId,
      hasConsented: true,
      context,
      configManager: configManager as ConfigManager,
      emotionAi,
      visitorVariationState
    });

    visitorDelegate.sendExposedVariation(undefined);
    expect(visitorVariationState.exposedVariations).toBeUndefined();
  });

  it('Test sendExposedVariation flag is undefined ', () => {
    isBrowserSpy.mockReturnValue(false);
    const visitorDelegate = new VisitorDelegate({
      visitorId,
      hasConsented: true,
      context,
      configManager: configManager as ConfigManager,
      emotionAi,
      visitorVariationState
    });

    visitorDelegate.sendExposedVariation(undefined);
    expect(visitorVariationState.exposedVariations).toBeUndefined();
  });

  it('Test sendExposedVariation QA mode is disabled ', () => {
    config.isQAModeEnabled = false;
    const visitorDelegate = new VisitorDelegate({
      visitorId,
      hasConsented: true,
      context,
      configManager: configManager as ConfigManager,
      emotionAi,
      visitorVariationState
    });

    const flag = {
      key: 'newKey',
      campaignId: 'cma',
      variationGroupId: 'var',
      variationId: 'varId',
      isReference: true,
      value: 'value',
      campaignName: 'campaignName',
      variationGroupName: 'variationGroupName',
      variationName: 'variationName'
    };

    const exposedVariations = {
      [flag.campaignId]: {
        campaignId: flag.campaignId,
        variationGroupId: flag.variationGroupId,
        variationId: flag.variationId
      }
    };

    visitorDelegate.sendExposedVariation(flag);
    expect(visitorVariationState.exposedVariations).toEqual(exposedVariations);
    expect(sendVisitorExposedVariationsSpy).toBeCalledTimes(0);
  });

  it('Test sendExposedVariation', async () => {
    const visitorDelegate = new VisitorDelegate({
      visitorId,
      hasConsented: true,
      context,
      configManager: configManager as ConfigManager,
      emotionAi,
      visitorVariationState
    });

    const flag = {
      key: 'newKey',
      campaignId: 'cma',
      variationGroupId: 'var',
      variationId: 'varId',
      isReference: true,
      value: 'value',
      campaignName: 'campaignName',
      variationGroupName: 'variationGroupName',
      variationName: 'variationName'
    };

    const exposedVariations = {
      [flag.campaignId]: {
        campaignId: flag.campaignId,
        variationGroupId: flag.variationGroupId,
        variationId: flag.variationId
      }
    };

    visitorDelegate.sendExposedVariation(flag);
    visitorDelegate.sendExposedVariation(flag);
    await sleep(150);
    expect(visitorVariationState.exposedVariations).toEqual(exposedVariations);
    expect(sendVisitorExposedVariationsSpy).toHaveBeenCalledTimes(1);
    expect(sendVisitorExposedVariationsSpy).toHaveBeenCalledWith(visitorVariationState);
  });

  it('Test sendExposedVariation', async () => {
    const visitorDelegate = new VisitorDelegate({
      visitorId,
      hasConsented: true,
      context,
      configManager: configManager as ConfigManager,
      emotionAi,
      visitorVariationState
    });

    const flag = {
      key: 'newKey',
      campaignId: 'cma',
      variationGroupId: 'var',
      variationId: 'varId',
      isReference: true,
      value: 'value',
      campaignName: 'campaignName',
      variationGroupName: 'variationGroupName',
      variationName: 'variationName'
    };
    const flag2 = {
      key: 'newKey2',
      campaignId: 'cma2',
      variationGroupId: 'var2',
      variationId: 'varId2',
      isReference: true,
      value: 'value2',
      campaignName: 'campaignName2',
      variationGroupName: 'variationGroupName2',
      variationName: 'variationName2'
    };

    const exposedVariations = {
      [flag.campaignId]: {
        campaignId: flag.campaignId,
        variationGroupId: flag.variationGroupId,
        variationId: flag.variationId
      },
      [flag2.campaignId]: {
        campaignId: flag2.campaignId,
        variationGroupId: flag2.variationGroupId,
        variationId: flag2.variationId
      }
    };

    visitorDelegate.sendExposedVariation(flag);
    visitorDelegate.sendExposedVariation(flag2);
    await sleep(150);
    expect(visitorVariationState.exposedVariations).toEqual(exposedVariations);
    expect(sendVisitorExposedVariationsSpy).toHaveBeenCalledTimes(1);
    expect(sendVisitorExposedVariationsSpy).toHaveBeenCalledWith(visitorVariationState);
  });

  it('Test sendExposedVariation', async () => {
    const visitorDelegate = new VisitorDelegate({
      visitorId,
      hasConsented: true,
      context,
      configManager: configManager as ConfigManager,
      emotionAi,
      visitorVariationState
    });

    const exposedVariations:Record<string, VisitorVariations> = {};

    for (let index = 0; index < 10; index++) {
      const flag = {
        key: 'newKey' + index,
        campaignId: 'cma' + index,
        variationGroupId: 'var' + index,
        variationId: 'varId' + index,
        isReference: true,
        value: 'value' + index,
        campaignName: 'campaignName' + index,
        variationGroupName: 'variationGroupName' + index,
        variationName: 'variationName' + index
      };
      exposedVariations[flag.campaignId] = {
        campaignId: flag.campaignId,
        variationGroupId: flag.variationGroupId,
        variationId: flag.variationId
      };
      visitorDelegate.sendExposedVariation(flag);
    }
    await sleep(150);
    expect(visitorVariationState.exposedVariations).toEqual(exposedVariations);
    expect(sendVisitorExposedVariationsSpy).toHaveBeenCalledTimes(1);
    expect(sendVisitorExposedVariationsSpy).toHaveBeenCalledWith(visitorVariationState);
  });
});

describe('Initialization tests', () => {

  beforeEach(()=>{
    mockGlobals({ __fsWebpackIsBrowser__: true });
  });

  const config = new DecisionApiConfig();
  config.reuseVisitorIds = true;

  const visitorId = 'visitorId';
  const anonymousId = 'anonymousId';

  const visitorProfileCache = new VisitorProfileCache(config);
  const loadVisitorProfile = jest.spyOn(visitorProfileCache, 'loadVisitorProfile');
  const saveVisitorProfile = jest.spyOn(visitorProfileCache, 'saveVisitorProfile');

  const init = jest.fn<(visitor:VisitorAbstract) => void>();

  const emotionAi = { init } as unknown as IEmotionAI;

  function createVisitorDelegate(
    visitorId?: string,
    isAuthenticated: boolean = false,
    hasConsented: boolean = true,
    context: Record<string, primitive> = {}
  ) {
    return new VisitorDelegate({
      visitorId,
      context,
      isAuthenticated,
      configManager: {
        config,
        decisionManager: {} as DecisionManager,
        trackingManager: { addHit: jest.fn() } as unknown as TrackingManager
      },
      visitorProfileCache,
      hasConsented,
      emotionAi
    });
  }


  describe('VisitorDelegate when authenticated is false', () => {
    const clientVisitorId = 'clientVisitorId';
    const abTastyVisitorId = 'ABTastyVisitorId';

    it('should use client-provided visitorId when no profile is loaded', () => {
      loadVisitorProfile.mockReturnValue(null);
      const visitorDelegate = createVisitorDelegate(clientVisitorId);
      expect(visitorDelegate.visitorId).toBe(clientVisitorId);
      expect(visitorDelegate.anonymousId).toBeNull();
      expect(loadVisitorProfile).toHaveBeenCalledTimes(1);
      expect(saveVisitorProfile).toHaveBeenCalledTimes(1);
      expect(saveVisitorProfile).toHaveBeenCalledWith({
        visitorId: clientVisitorId,
        anonymousId: null,
        isClientSuppliedId: visitorDelegate.isClientSuppliedID
      });
    });

    it('should override loaded visitorId with client-provided visitorId', () => {
      loadVisitorProfile.mockReturnValue({
        visitorId,
        anonymousId
      });
      const visitorDelegate = createVisitorDelegate(clientVisitorId);
      expect(visitorDelegate.visitorId).toBe(clientVisitorId);
      expect(visitorDelegate.anonymousId).toBeNull();
      expect(visitorDelegate.visitorId).not.toBe(visitorId);
      expect(loadVisitorProfile).toHaveBeenCalledTimes(1);
      expect(saveVisitorProfile).toHaveBeenCalledTimes(1);
      expect(saveVisitorProfile).toHaveBeenCalledWith({
        visitorId: clientVisitorId,
        anonymousId: null,
        isClientSuppliedId: visitorDelegate.isClientSuppliedID
      });
    });

    it('should skip loading profile when consent is not given', () => {
      loadVisitorProfile.mockReturnValue({
        visitorId,
        anonymousId
      });
      const visitorDelegate = createVisitorDelegate(clientVisitorId, false, false);
      expect(visitorDelegate.visitorId).toBe(clientVisitorId);
      expect(visitorDelegate.anonymousId).toBeNull();
      expect(visitorDelegate.visitorId).not.toBe(visitorId);
      expect(loadVisitorProfile).not.toHaveBeenCalled();
      expect(saveVisitorProfile).toHaveBeenCalledTimes(1);
      expect(saveVisitorProfile).toHaveBeenCalledWith(undefined);
    });

    it('should use loaded profile data when no client-provided visitorId is given', () => {
      loadVisitorProfile.mockReturnValue({
        visitorId,
        anonymousId
      });
      const visitorDelegate = createVisitorDelegate();
      expect(visitorDelegate.visitorId).toBe(anonymousId);
      expect(visitorDelegate.anonymousId).toBeNull();
      expect(loadVisitorProfile).toHaveBeenCalledTimes(1);
      expect(saveVisitorProfile).toHaveBeenCalledTimes(1);
      expect(saveVisitorProfile).toHaveBeenCalledWith({
        visitorId: anonymousId,
        anonymousId: null,
        isClientSuppliedId: visitorDelegate.isClientSuppliedID
      });
    });

    it('should use loaded profile visitorId when anonymousId is null', () => {
      loadVisitorProfile.mockReturnValue({
        visitorId,
        anonymousId: null
      });
      const visitorDelegate = createVisitorDelegate();
      expect(visitorDelegate.visitorId).toBe(visitorId);
      expect(visitorDelegate.anonymousId).toBeNull();
      expect(loadVisitorProfile).toHaveBeenCalledTimes(1);
      expect(saveVisitorProfile).toHaveBeenCalledTimes(1);
      expect(saveVisitorProfile).toHaveBeenCalledWith({
        visitorId,
        anonymousId: null,
        isClientSuppliedId: visitorDelegate.isClientSuppliedID
      });
    });


    it('should generate a visitorId when no client-provided visitorId, profile, is available', () => {
      loadVisitorProfile.mockReturnValue(null);
      const visitorDelegate = createVisitorDelegate();
      expect(visitorDelegate.visitorId).not.toBe(abTastyVisitorId);
      expect(visitorDelegate.visitorId).not.toBe(visitorId);
      expect(visitorDelegate.visitorId).not.toBe(anonymousId);
      expect(visitorDelegate.visitorId).toBeDefined();
      expect(visitorDelegate.visitorId).toHaveLength(36);
      expect(visitorDelegate.anonymousId).toBeNull();
      expect(loadVisitorProfile).toHaveBeenCalledTimes(1);
      expect(saveVisitorProfile).toHaveBeenCalledTimes(1);
      expect(saveVisitorProfile).toHaveBeenCalledWith({
        visitorId: visitorDelegate.visitorId,
        anonymousId: null,
        isClientSuppliedId: visitorDelegate.isClientSuppliedID
      });
    });

    it('should generate a visitorId when no client-provided visitorId, profile, or browser environment', () => {
      loadVisitorProfile.mockReturnValue(null);
      mockGlobals({ __fsWebpackIsBrowser__: false });
      const visitorDelegate = createVisitorDelegate();
      expect(visitorDelegate.visitorId).not.toBe(abTastyVisitorId);
      expect(visitorDelegate.visitorId).not.toBe(visitorId);
      expect(visitorDelegate.visitorId).not.toBe(anonymousId);
      expect(visitorDelegate.visitorId).toBeDefined();
      expect(visitorDelegate.visitorId).toHaveLength(36);
      expect(visitorDelegate.anonymousId).toBeNull();
      expect(loadVisitorProfile).toHaveBeenCalledTimes(1);
      expect(saveVisitorProfile).toHaveBeenCalledTimes(1);
      expect(saveVisitorProfile).toHaveBeenCalledWith({
        visitorId: visitorDelegate.visitorId,
        anonymousId: null,
        isClientSuppliedId: visitorDelegate.isClientSuppliedID
      });
    });
  });

  describe('VisitorDelegate when authenticated is true', () => {
    const clientVisitorId = 'clientVisitorId';

    it('should use client-provided visitorId and generate anonymousId when no profile is loaded', () => {
      loadVisitorProfile.mockReturnValue(null);
      const visitorDelegate = createVisitorDelegate(clientVisitorId, true);
      expect(visitorDelegate.visitorId).toBe(clientVisitorId);
      expect(visitorDelegate.anonymousId).toBeDefined();
      expect(visitorDelegate.anonymousId).toHaveLength(36);
      expect(loadVisitorProfile).toHaveBeenCalledTimes(1);
      expect(saveVisitorProfile).toHaveBeenCalledTimes(1);
      expect(saveVisitorProfile).toHaveBeenCalledWith({
        visitorId: clientVisitorId,
        anonymousId: visitorDelegate.anonymousId,
        isClientSuppliedId: visitorDelegate.isClientSuppliedID
      });
    });

    it('should override loaded visitorId with client-provided visitorId and keep anonymousId', () => {
      loadVisitorProfile.mockReturnValue({
        visitorId,
        anonymousId
      });
      const visitorDelegate = createVisitorDelegate(clientVisitorId, true);
      expect(visitorDelegate.visitorId).toBe(clientVisitorId);
      expect(visitorDelegate.anonymousId).toBe(anonymousId);
      expect(visitorDelegate.visitorId).not.toBe(visitorId);
      expect(loadVisitorProfile).toHaveBeenCalledTimes(1);
      expect(saveVisitorProfile).toHaveBeenCalledTimes(1);
      expect(saveVisitorProfile).toHaveBeenCalledWith({
        visitorId: clientVisitorId,
        anonymousId,
        isClientSuppliedId: visitorDelegate.isClientSuppliedID
      });
    });

    it('should skip loading profile and generate anonymousId when consent is not given', () => {
      loadVisitorProfile.mockReturnValue({
        visitorId,
        anonymousId
      });
      const visitorDelegate = createVisitorDelegate(clientVisitorId, true, false);
      expect(visitorDelegate.visitorId).toBe(clientVisitorId);
      expect(visitorDelegate.anonymousId).toBeDefined();
      expect(visitorDelegate.anonymousId).toHaveLength(36);
      expect(visitorDelegate.visitorId).not.toBe(visitorId);
      expect(loadVisitorProfile).not.toHaveBeenCalled();
      expect(saveVisitorProfile).toHaveBeenCalledTimes(1);
      expect(saveVisitorProfile).toHaveBeenCalledWith(undefined);
    });

    it('should use loaded profile visitorId and anonymousId when no client-provided visitorId is given', () => {
      loadVisitorProfile.mockReturnValue({
        visitorId,
        anonymousId
      });
      const visitorDelegate = createVisitorDelegate(undefined, true);
      expect(visitorDelegate.visitorId).toBe(visitorId);
      expect(visitorDelegate.anonymousId).toBe(anonymousId);
      expect(loadVisitorProfile).toHaveBeenCalledTimes(1);
      expect(saveVisitorProfile).toHaveBeenCalledTimes(1);
      expect(saveVisitorProfile).toHaveBeenCalledWith({
        visitorId,
        anonymousId,
        isClientSuppliedId: visitorDelegate.isClientSuppliedID
      });
    });

    it('should use loaded profile visitorId and generate anonymousId when anonymousId is null', () => {
      loadVisitorProfile.mockReturnValue({
        visitorId,
        anonymousId: null
      });
      const visitorDelegate = createVisitorDelegate(undefined, true);
      expect(visitorDelegate.visitorId).toBe(visitorId);
      expect(visitorDelegate.anonymousId).toBeDefined();
      expect(visitorDelegate.anonymousId).toHaveLength(36);
      expect(loadVisitorProfile).toHaveBeenCalledTimes(1);
      expect(saveVisitorProfile).toHaveBeenCalledTimes(1);
      expect(saveVisitorProfile).toHaveBeenCalledWith({
        visitorId,
        anonymousId: visitorDelegate.anonymousId,
        isClientSuppliedId: visitorDelegate.isClientSuppliedID
      });
    });



    it('should generate visitorId and anonymousId when no client-provided visitorId, profile is available', () => {
      loadVisitorProfile.mockReturnValue(null);

      const visitorDelegate = createVisitorDelegate(undefined, true);
      expect(visitorDelegate.visitorId).not.toBe(visitorId);
      expect(visitorDelegate.visitorId).not.toBe(anonymousId);
      expect(visitorDelegate.visitorId).toBeDefined();
      expect(visitorDelegate.visitorId).toHaveLength(36);
      expect(visitorDelegate.anonymousId).toBeDefined();
      expect(visitorDelegate.anonymousId).toHaveLength(36);
      expect(loadVisitorProfile).toHaveBeenCalledTimes(1);
      expect(saveVisitorProfile).toHaveBeenCalledTimes(1);
      expect(saveVisitorProfile).toHaveBeenCalledWith({
        visitorId: visitorDelegate.visitorId,
        anonymousId: visitorDelegate.anonymousId,
        isClientSuppliedId: visitorDelegate.isClientSuppliedID
      });
    });
  });

});
