import { jest, expect, it, describe } from '@jest/globals';
import { Flagship } from '../../src/main/Flagship';
import * as qaAssistant from '../../src/qaAssistant';
import { mockGlobals } from '../helpers';

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



describe('test Flagship class', () => {
  const envId = 'envId';
  const apiKey = 'apiKey';
  const launchQaAssistantSpy = jest.spyOn(qaAssistant, 'launchQaAssistant');
  launchQaAssistantSpy.mockImplementation(() => {
    //
  });

  it('test flagship start works properly', async () => {
    mockGlobals({ __fsWebpackIsNode__: true });

    await Flagship.start(envId, apiKey);

    expect((global as any).__flagship_instance__).toBeInstanceOf(Flagship);
  });
});
