import { jest, expect, it, describe } from '@jest/globals';
import { Flagship } from '../../src/main/Flagship';
import * as mobileQaAssistant from '../../src/qaAssistant/mobile';
import { mockGlobals } from '../helpers';
import { DecisionMode } from '../../src';

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


describe('Flagship SDK for React Native platform', () => {
  const envId = 'envId';
  const apiKey = 'apiKey';
  const launchQaAssistantSpy = jest.spyOn(mobileQaAssistant, 'launchQaAssistant');
  launchQaAssistantSpy.mockImplementation(() => {
    //
  });

  it('should initialize Flagship SDK correctly in React Native environment', async () => {
    mockGlobals({
      __fsWebpackIsBrowser__: false,
      __fsWebpackIsDeno__: false,
      __fsWebpackIsReactNative__: true
    });

    await Flagship.start(envId, apiKey, {
      decisionMode: DecisionMode.DECISION_API,
      isQAModeEnabled: true
    } as any);

    expect(launchQaAssistantSpy).toHaveBeenCalledTimes(1);
    expect(launchQaAssistantSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        envId,
        apiKey,
        decisionMode: DecisionMode.DECISION_API,
        isQAModeEnabled: true
      }),
      expect.anything()
    );
  });

  it('should not launch QA Assistant when isQAModeEnabled is false', async () => {
    mockGlobals({
      __fsWebpackIsBrowser__: false,
      __fsWebpackIsDeno__: false,
      __fsWebpackIsReactNative__: true
    });

    await Flagship.start(envId, apiKey, {
      decisionMode: DecisionMode.DECISION_API,
      isQAModeEnabled: false
    } as any);

    expect(launchQaAssistantSpy).not.toHaveBeenCalled();
  });

  it('should not launch QA Assistant when not on React Native platform', async () => {
    mockGlobals({
      __fsWebpackIsBrowser__: true,
      __fsWebpackIsDeno__: false,
      __fsWebpackIsReactNative__: false
    });

    await Flagship.start(envId, apiKey, {
      decisionMode: DecisionMode.DECISION_API,
      isQAModeEnabled: true
    } as any);

    expect(launchQaAssistantSpy).not.toHaveBeenCalled();
  });
});
