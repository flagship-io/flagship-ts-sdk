import { jest, expect, it, describe, beforeAll } from '@jest/globals';
// import { mocked } from 'ts-jest/utils'
import { DecisionApiConfig, DecisionMode } from '../../src/config/index';
import { CONSENT_NOT_SPECIFY_WARNING,
  FSSdkStatus,
  PROCESS_NEW_VISITOR,
  SDK_INFO } from '../../src/enum/index';
import { Flagship } from '../../src/main/Flagship';
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager';
import * as utils from '../../src/utils/utils';
import { Visitor } from '../../src/visitor/Visitor';
import { EdgeConfig } from '../../src/config/EdgeConfig';
import { NewVisitor } from '../../src';
import * as qaAssistant from '../../src/qaAssistant';
import { sleep } from '../helpers';

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
  const isBrowserSpy = jest.spyOn(utils, 'isBrowser');
  isBrowserSpy.mockReturnValue(true);
  const launchQaAssistantSpy = jest.spyOn(qaAssistant, 'launchQaAssistant');
  launchQaAssistantSpy.mockImplementation(() => {
    //
  });

  it('test flagship start works properly', async () => {
    await Flagship.start(envId, apiKey);

    expect(Flagship.getConfig()).toBeDefined();
    expect(Flagship.getConfig()).toBeInstanceOf(DecisionApiConfig);

    expect(Flagship.getConfig().envId).toBe(envId);
    expect(Flagship.getConfig().apiKey).toBe(apiKey);
    expect(Flagship.getConfig().logManager).toBeDefined();
    expect(Flagship.getStatus()).toBe(FSSdkStatus.SDK_INITIALIZED);
    expect(Flagship.getConfig().logManager).toBeInstanceOf(FlagshipLogManager);
    expect(Flagship.getConfig().decisionMode).toBe(DecisionMode.DECISION_API);
    expect(Flagship.getConfig().visitorCacheImplementation).toBeUndefined();
    expect(Flagship.getConfig().hitCacheImplementation).toBeUndefined();
    expect(Flagship.getStatus()).toBe(FSSdkStatus.SDK_INITIALIZED);
    expect(startBatchingLoop).toBeCalledTimes(1);
    expect(launchQaAssistantSpy).not.toBeCalled();

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

  it('should test Flagship.close method', async () => {
    sendBatch.mockResolvedValue();
    await Flagship.close();
    expect(sendBatch).toBeCalledTimes(1);
  });

  it('should test Flagship.close method', async () => {
    const fs = await Flagship.start(envId, apiKey);
    sendBatch.mockResolvedValue();
    await fs.close();
    expect(sendBatch).toBeCalledTimes(1);
  });

  it('should test getVisitorProfile and setVisitorProfile', async () => {
    const visitorProfile = {
      visitorId: 'visitorId',
      anonymousId: 'anonymousId'
    };
    const extendedFlagship = Flagship as {
      setVisitorProfile?: (value: string|null) => void,
      getVisitorProfile?: () => string|null,
      setOnSaveVisitorProfile?: (value: (visitorProfile:string)=>void) => void,
      getOnSaveVisitorProfile?: () => (visitorProfile:string)=>void
    };
    const value = JSON.stringify(visitorProfile);
    extendedFlagship.setVisitorProfile?.(value);
    const result = extendedFlagship.getVisitorProfile?.();
    expect(result).toBe(value);
  });

  it('should test getOnSaveVisitorProfile and setOnSaveVisitorProfile', async () => {
    const extendedFlagship = Flagship as {
      setVisitorProfile?: (value: string|null) => void,
      getVisitorProfile?: () => string|null,
      setOnSaveVisitorProfile?: (value: (visitorProfile:string)=>void) => void,
      getOnSaveVisitorProfile?: () => (visitorProfile:string)=>void
    };
    const mockOnSave = jest.fn();
    extendedFlagship.setOnSaveVisitorProfile?.(mockOnSave);
    const result = extendedFlagship.getOnSaveVisitorProfile?.();
    result?.('test');
    expect(mockOnSave).toBeCalledTimes(1);
  });
});



describe('test Flagship with custom config literal object', () => {
  it('should ', async () => {
    const envId = 'envId';
    const apiKey = 'apiKey';
    const logManager = new FlagshipLogManager();

    await Flagship.start(envId, apiKey, {
      decisionMode: DecisionMode.DECISION_API,
      logManager
    });

    expect(Flagship.getConfig().envId).toBe(envId);
    expect(Flagship.getConfig().apiKey).toBe(apiKey);
    expect(Flagship.getConfig().logManager).toBe(logManager);
    expect(Flagship.getConfig().decisionMode).toBe(DecisionMode.DECISION_API);
  });
});

describe('test Flagship with custom config (Decision API)', () => {
  const envId = 'envId';
  const apiKey = 'apiKey';

  const onSdkStatusChanged = jest.fn<(status:FSSdkStatus)=>void>();

  it('should start in Decision API mode', async () => {
    const instance = await Flagship.start(envId, apiKey, {
      decisionMode: DecisionMode.DECISION_API,
      onSdkStatusChanged
    });
    expect(Flagship.getConfig()).toBeDefined();
    expect(Flagship.getConfig()).toBeInstanceOf(DecisionApiConfig);
    expect(Flagship.getConfig().envId).toBe(envId);
    expect(Flagship.getConfig().apiKey).toBe(apiKey);
    expect(Flagship.getConfig().logManager).toBeInstanceOf(FlagshipLogManager);
    expect(onSdkStatusChanged).toBeCalledTimes(2);
    expect(onSdkStatusChanged).toHaveBeenNthCalledWith(1, FSSdkStatus.SDK_INITIALIZING);
    expect(onSdkStatusChanged).toHaveBeenNthCalledWith(2, FSSdkStatus.SDK_INITIALIZED);

    expect(instance?.getStatus()).toBe(FSSdkStatus.SDK_INITIALIZED);

    expect(instance).toBeInstanceOf(Flagship);
  });

  it('should start in default mode', async () => {
    const instance = await Flagship.start('', '');
    expect(Flagship.getStatus()).toBe(FSSdkStatus.SDK_NOT_INITIALIZED);
    expect(instance).toBeInstanceOf(Flagship);
  });
});

describe('test Flagship with custom config (Bucketing Edge)', () => {
  const envId = 'envId';
  const apiKey = 'apiKey';

  const onSdkStatusChanged = jest.fn<(status:FSSdkStatus)=>void>();

  it('should start in Bucketing Edge mode', async () => {
    const instance = await Flagship.start(envId, apiKey, {
      decisionMode: DecisionMode.BUCKETING_EDGE,
      onSdkStatusChanged,
      initialBucketing: {}
    });
    expect(Flagship.getConfig()).toBeDefined();
    expect(Flagship.getConfig()).toBeInstanceOf(EdgeConfig);
    expect(Flagship.getConfig().envId).toBe(envId);
    expect(Flagship.getConfig().apiKey).toBe(apiKey);
    expect(Flagship.getConfig().logManager).toBeInstanceOf(FlagshipLogManager);

    expect(onSdkStatusChanged).toBeCalledTimes(2);
    expect(onSdkStatusChanged).toHaveBeenNthCalledWith(1, FSSdkStatus.SDK_INITIALIZING);
    expect(onSdkStatusChanged).toHaveBeenNthCalledWith(2, FSSdkStatus.SDK_INITIALIZED);

    expect(instance?.getStatus()).toBe(FSSdkStatus.SDK_INITIALIZED);

    expect(instance).toBeInstanceOf(Flagship);
  });

  it('should start in default mode', async () => {
    const onSdkStatusChanged = (status:FSSdkStatus) => {
      expect(status).toBe(FSSdkStatus.SDK_NOT_INITIALIZED);
    };

    const instance = await Flagship.start('', '', { onSdkStatusChanged });
    expect(Flagship.getStatus()).toBe(FSSdkStatus.SDK_NOT_INITIALIZED);
    expect(instance).toBeInstanceOf(Flagship);
  });
});


const getNull = (): any => {
  return null;
};

describe('test Flagship newVisitor', () => {
  const isBrowserSpy = jest.spyOn(utils, 'isBrowser');
  const launchQaAssistantSpy = jest.spyOn(qaAssistant, 'launchQaAssistant');
  launchQaAssistantSpy.mockImplementation(() => {
    //
  });
  beforeAll(() => {
    isBrowserSpy.mockReturnValue(false);
  });
  it('should ', async () => {
    const logManager = new FlagshipLogManager();
    const logWarning = jest.spyOn(logManager, 'warning');

    await Flagship.start('envId', 'apiKey', {
      logManager,
      fetchNow: false
    });
    const visitorId = 'visitorId';
    const context = { isVip: true };
    const predefinedContext = {
      fs_client: SDK_INFO.name,
      fs_version: SDK_INFO.version,
      fs_users: visitorId
    };

    let visitor = Flagship.newVisitor({
      visitorId,
      context,
      hasConsented: true
    });

    expect(visitor?.visitorId).toBe(visitorId);
    expect(visitor?.context).toEqual({
      ...context,
      ...predefinedContext
    });
    expect(Flagship.getVisitor()).toBeUndefined();

    await sleep(10);

    expect(addHit).toBeCalledTimes(1);

    const visitorNull = Flagship.newVisitor({
      visitorId: getNull(),
      context,
      hasConsented: true
    });
    expect(visitorNull).toBeInstanceOf(Visitor);

    const newVisitor = Flagship.newVisitor({
      visitorId,
      hasConsented: true
    });
    expect(newVisitor?.context).toEqual({ ...predefinedContext });
    expect(newVisitor?.hasConsented).toBe(true);

    visitor = Flagship.newVisitor({
      visitorId,
      context,
      hasConsented: true
    });

    expect(visitor?.visitorId).toBe(visitorId);
    expect(visitor?.context).toEqual({
      ...context,
      ...predefinedContext
    });

    visitor = Flagship.newVisitor({} as NewVisitor);

    expect(visitor?.visitorId).toBeDefined();
    expect(visitor?.context).toEqual(expect.objectContaining({
      ...predefinedContext,
      fs_users: expect.anything()
    }));
    expect(visitor?.anonymousId).toBeNull();
    expect(visitor?.hasConsented).toBe(false);
    expect(logWarning).toBeCalledTimes(1);
    expect(logWarning).toBeCalledWith(CONSENT_NOT_SPECIFY_WARNING, PROCESS_NEW_VISITOR);

    visitor = Flagship.newVisitor({
      shouldSaveInstance: false,
      hasConsented: true
    });
    expect(Flagship.getVisitor()).toBeUndefined();

    // test client side true and shouldSaveInstance to false
    visitor = Flagship.newVisitor({
      shouldSaveInstance: true,
      hasConsented: false
    });
    expect(Flagship.getVisitor()).toBeDefined();
    expect(visitor).toBe(Flagship.getVisitor());

    // test client side true and shouldSaveInstance to false
    // Create a visitor: "visitor_1" as NEW_INSTANCE
    visitor = Flagship.newVisitor({
      visitorId: 'visitor_1',
      shouldSaveInstance: false,
      hasConsented: true
    });
    expect(Flagship.getVisitor()).toBeUndefined();

    // scenario 2
    visitor = Flagship.newVisitor({
      visitorId: 'visitor_2',
      shouldSaveInstance: true,
      hasConsented: true
    });
    expect(Flagship.getVisitor()).toBeDefined();
    expect(Flagship.getVisitor()?.visitorId).toBe('visitor_2');

    // scenario 3
    visitor = Flagship.newVisitor({
      visitorId: 'visitor_3',
      shouldSaveInstance: true,
      hasConsented: true
    });
    expect(Flagship.getVisitor()).toBeDefined();
    expect(Flagship.getVisitor()?.visitorId).toBe('visitor_3');

    // scenario 4

    const visitor1 = Flagship.newVisitor({
      visitorId: 'visitor_1',
      shouldSaveInstance: true,
      hasConsented: true
    });
    visitor1?.updateContext({ color: 'blue' });
    expect(Flagship.getVisitor()?.context.color).toBe('blue');

    const visitor2 = Flagship.newVisitor({
      visitorId: 'visitor_2',
      shouldSaveInstance: true,
      hasConsented: true
    });
    expect(Flagship.getVisitor()?.context.color).toBeUndefined();
    Flagship.getVisitor()?.updateContext({ color: 'red' });

    expect(visitor1?.context.color).toBe('blue');
    expect(visitor2?.context.color).toBe('red');
    expect(Flagship.getVisitor()?.context.color).toBe('red');
  });
});
