/**
 * @jest-environment jsdom
 */
import { jest, expect, it, describe, beforeAll } from '@jest/globals';

import { Flagship } from '../../src/main/Flagship';
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager';
import * as utils from '../../src/utils/utils';
import * as qaAssistant from '../../src/qaAssistant';
import { ABTastyWebSDKPostMessageType } from '../../src/types';
import { DefaultVisitorCache } from '../../src/cache/DefaultVisitorCache';
import { DefaultHitCache } from '../../src/cache/DefaultHitCache';
import { FSSdkStatus } from '../../src/enum/FSSdkStatus';
import { DecisionMode } from '../../src/config/DecisionMode';
import { mockGlobals, sleep } from '../helpers';

const getCampaignsAsync = jest.fn().mockReturnValue(Promise.resolve([]));

jest.mock('../../src/decision/ApiManager', () => {
  return {
    ApiManager: jest.fn().mockImplementation(() => {
      return {
        getCampaignsAsync,
        getModifications: jest.fn(),
        statusChangedCallback: jest.fn()
      };
    })
  };
});

const startBatchingLoop = jest.fn<()=>Promise<void>>();
startBatchingLoop.mockResolvedValue();
const addHit = jest.fn<()=>Promise<void>>();

const stopBatchingLoop = jest.fn<()=>Promise<void>>();

const sendBatch = jest.fn<()=>Promise<void>>();

const sendTroubleshootingHit = jest.fn<()=>Promise<void>>();

const addTroubleshootingHit = jest.fn<()=>Promise<void>>();

const sendUsageHit = jest.fn<()=>Promise<void>>();

addHit.mockResolvedValue();

jest.mock('../../src/api/TrackingManager', () => {
  return {
    TrackingManager: jest.fn().mockImplementation(() => {
      return {
        startBatchingLoop,
        stopBatchingLoop,
        sendBatch,
        addHit,
        sendTroubleshootingHit,
        addTroubleshootingHit,
        sendUsageHit
      };
    })
  };
});

describe('test Flagship newVisitor', () => {
  const envId = 'envId';
  const apiKey = 'apiKey';
  const isBrowserSpy = jest.spyOn(utils, 'isBrowser');
  isBrowserSpy.mockReturnValue(true);
  const launchQaAssistantSpy = jest.spyOn(qaAssistant, 'launchQaAssistant');
  launchQaAssistantSpy.mockImplementation(() => {
    //
  });

  beforeEach(() => {
    mockGlobals({ __fsWebpackIsBrowser__: true });
  });

  it('test flagship start works properly', async () => {
    await Flagship.start(envId, apiKey);

    expect(Flagship.getConfig()).toBeDefined();
    expect(Flagship.getConfig().envId).toBe(envId);
    expect(Flagship.getConfig().apiKey).toBe(apiKey);
    expect(Flagship.getConfig().logManager).toBeDefined();
    expect(Flagship.getStatus()).toBe(FSSdkStatus.SDK_INITIALIZED);
    expect(Flagship.getConfig().logManager).toBeInstanceOf(FlagshipLogManager);
    expect(Flagship.getConfig().decisionMode).toBe(DecisionMode.DECISION_API);
    expect(Flagship.getConfig().visitorCacheImplementation).toBeInstanceOf(DefaultVisitorCache);
    expect(Flagship.getConfig().hitCacheImplementation).toBeInstanceOf(DefaultHitCache);
    expect(Flagship.getStatus()).toBe(FSSdkStatus.SDK_INITIALIZED);
    await sleep(10);
    expect(startBatchingLoop).toBeCalledTimes(1);
    expect(launchQaAssistantSpy).toBeCalledTimes(1);
    expect(launchQaAssistantSpy).toBeCalledWith(Flagship.getConfig());

    const extendedFlagship = Flagship as {
        setVisitorProfile?: (value: string|null) => void,
        getVisitorProfile?: () => string|null,
        setOnSaveVisitorProfile?: (value: (visitorProfile:string)=>void) => void,
        getOnSaveVisitorProfile?: () => (visitorProfile:string)=>void
      };

    expect(extendedFlagship.getVisitorProfile).toBeDefined();
    expect(extendedFlagship.setVisitorProfile).toBeDefined();
    expect(extendedFlagship.setOnSaveVisitorProfile).toBeDefined();
    expect(extendedFlagship.getOnSaveVisitorProfile).toBeDefined();
  });
});

describe('test Flagship newVisitor', () => {
  const isBrowserSpy = jest.spyOn(utils, 'isBrowser');
  const launchQaAssistantSpy = jest.spyOn(qaAssistant, 'launchQaAssistant');
  launchQaAssistantSpy.mockImplementation(() => {
    //
  });

  const postmessageSpy = jest.spyOn(window, 'postMessage');

  beforeAll(() => {
    isBrowserSpy.mockReturnValue(true);
  });
  it('should ', async () => {
    const logManager = new FlagshipLogManager();

    await Flagship.start('envId', 'apiKey', {
      logManager,
      fetchNow: false
    });

    expect(window?.ABTastyWebSdk?.internal?._getActionTrackingNonce).toBeDefined();
    expect(window?.ABTastyWebSdk?.internal?._getActionTrackingNonce()).toBeUndefined();

    const visitor4 = Flagship.newVisitor({
      visitorId: 'visitor_4',
      hasConsented: true
    });
    expect(Flagship.getVisitor()).toBeDefined();
    expect(visitor4).toEqual(Flagship.getVisitor());

    expect(window?.ABTastyWebSdk?.internal?._getActionTrackingNonce()).toEqual(expect.any(String));
    expect(postmessageSpy).toBeCalledTimes(1);
    expect(postmessageSpy).toBeCalledWith({ action: ABTastyWebSDKPostMessageType.AB_TASTY_WEB_SDK_INITIALIZED }, '*');
  });
});
