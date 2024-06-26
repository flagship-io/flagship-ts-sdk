import { jest, expect, it, describe, beforeAll } from '@jest/globals'
// import { mocked } from 'ts-jest/utils'
import { DecisionApiConfig, DecisionMode } from '../../src/config/index'
import {
  CONSENT_NOT_SPECIFY_WARNING,
  FSSdkStatus,
  PROCESS_NEW_VISITOR,
  SDK_INFO
} from '../../src/enum/index'
import { Flagship } from '../../src/main/Flagship'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { sleep } from '../../src/utils/utils'
import * as utils from '../../src/utils/utils'
import { Visitor } from '../../src/visitor/Visitor'
import { DefaultVisitorCache } from '../../src/cache/DefaultVisitorCache'
import { DefaultHitCache } from '../../src/cache/DefaultHitCache'
import { EdgeConfig } from '../../src/config/EdgeConfig'
import { NewVisitor } from '../../src'
import * as qaAssistant from '../../src/qaAssistant'

const getCampaignsAsync = jest.fn().mockReturnValue(Promise.resolve([]))

jest.mock('../../src/decision/ApiManager', () => {
  return {
    ApiManager: jest.fn().mockImplementation(() => {
      return {
        getCampaignsAsync,
        getModifications: jest.fn(),
        statusChangedCallback: jest.fn()
      }
    })
  }
})
const startBatchingLoop = jest.fn<()=>Promise<void>>()
startBatchingLoop.mockResolvedValue()
const addHit = jest.fn<()=>Promise<void>>()

const stopBatchingLoop = jest.fn<()=>Promise<void>>()

const sendBatch = jest.fn<()=>Promise<void>>()

const sendTroubleshootingHit = jest.fn<()=>Promise<void>>()

const addTroubleshootingHit = jest.fn<()=>Promise<void>>()

const sendUsageHit = jest.fn<()=>Promise<void>>()

addHit.mockResolvedValue()

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
      }
    })
  }
})

describe('test Flagship class', () => {
  const envId = 'envId'
  const apiKey = 'apiKey'
  const isBrowserSpy = jest.spyOn(utils, 'isBrowser')
  isBrowserSpy.mockReturnValue(true)
  const launchQaAssistantSpy = jest.spyOn(qaAssistant, 'launchQaAssistant')
  launchQaAssistantSpy.mockImplementation(() => {
    //
  })

  it('test flagship start works properly', () => {
    Flagship.start(envId, apiKey)

    expect(Flagship.getConfig()).toBeDefined()
    expect(Flagship.getConfig()).toBeInstanceOf(DecisionApiConfig)

    expect(Flagship.getConfig().envId).toBe(envId)
    expect(Flagship.getConfig().apiKey).toBe(apiKey)
    expect(Flagship.getConfig().logManager).toBeDefined()
    expect(Flagship.getStatus()).toBe(FSSdkStatus.SDK_INITIALIZED)
    expect(Flagship.getConfig().logManager).toBeInstanceOf(FlagshipLogManager)
    expect(Flagship.getConfig().decisionMode).toBe(DecisionMode.DECISION_API)
    expect(Flagship.getConfig().visitorCacheImplementation).toBeInstanceOf(DefaultVisitorCache)
    expect(Flagship.getConfig().hitCacheImplementation).toBeInstanceOf(DefaultHitCache)
    expect(Flagship.getStatus()).toBe(FSSdkStatus.SDK_INITIALIZED)
    expect(startBatchingLoop).toBeCalledTimes(1)
    expect(launchQaAssistantSpy).toBeCalledTimes(1)
    expect(launchQaAssistantSpy).toBeCalledWith(Flagship.getConfig())
  })

  it('should test Flagship.close method', async () => {
    sendBatch.mockResolvedValue()
    await Flagship.close()
    expect(sendBatch).toBeCalledTimes(1)
  })

  it('should test Flagship.close method', async () => {
    const fs = Flagship.start(envId, apiKey)
    sendBatch.mockResolvedValue()
    await fs.close()
    expect(sendBatch).toBeCalledTimes(1)
  })
})

describe('test Flagship with custom config literal object', () => {
  it('should ', () => {
    const envId = 'envId'
    const apiKey = 'apiKey'
    const logManager = new FlagshipLogManager()

    Flagship.start(envId, apiKey, { decisionMode: DecisionMode.DECISION_API, logManager })

    expect(Flagship.getConfig().envId).toBe(envId)
    expect(Flagship.getConfig().apiKey).toBe(apiKey)
    expect(Flagship.getConfig().logManager).toBe(logManager)
    expect(Flagship.getConfig().decisionMode).toBe(DecisionMode.DECISION_API)
  })
})

describe('test Flagship with custom config (Decision API)', () => {
  const envId = 'envId'
  const apiKey = 'apiKey'

  const onSdkStatusChanged = (status:FSSdkStatus) => {
    expect(status).toBe(FSSdkStatus.SDK_INITIALIZED)
  }

  it('should start in Decision API mode', () => {
    const instance = Flagship.start(envId, apiKey, {
      decisionMode: DecisionMode.DECISION_API,
      onSdkStatusChanged
    })
    expect(Flagship.getConfig()).toBeDefined()
    expect(Flagship.getConfig()).toBeInstanceOf(DecisionApiConfig)
    expect(Flagship.getConfig().envId).toBe(envId)
    expect(Flagship.getConfig().apiKey).toBe(apiKey)
    expect(Flagship.getConfig().logManager).toBeInstanceOf(FlagshipLogManager)

    expect(instance?.getStatus()).toBe(FSSdkStatus.SDK_INITIALIZED)

    expect(instance).toBeInstanceOf(Flagship)
  })

  it('should start in default mode', () => {
    const instance = Flagship.start('', '')
    expect(Flagship.getStatus()).toBe(FSSdkStatus.SDK_NOT_INITIALIZED)
    expect(instance).toBeInstanceOf(Flagship)
  })
})

describe('test Flagship with custom config (Bucketing Edge)', () => {
  const envId = 'envId'
  const apiKey = 'apiKey'

  const onSdkStatusChanged = (status:FSSdkStatus) => {
    expect(status).toBe(FSSdkStatus.SDK_INITIALIZED)
  }

  it('should start in Bucketing Edge mode', () => {
    const instance = Flagship.start(envId, apiKey, {
      decisionMode: DecisionMode.BUCKETING_EDGE,
      onSdkStatusChanged,
      initialBucketing: {}
    })
    expect(Flagship.getConfig()).toBeDefined()
    expect(Flagship.getConfig()).toBeInstanceOf(EdgeConfig)
    expect(Flagship.getConfig().envId).toBe(envId)
    expect(Flagship.getConfig().apiKey).toBe(apiKey)
    expect(Flagship.getConfig().logManager).toBeInstanceOf(FlagshipLogManager)

    expect(instance?.getStatus()).toBe(FSSdkStatus.SDK_INITIALIZED)

    expect(instance).toBeInstanceOf(Flagship)
  })

  it('should start in default mode', () => {
    const onSdkStatusChanged = (status:FSSdkStatus) => {
      expect(status).toBe(FSSdkStatus.SDK_NOT_INITIALIZED)
    }

    const instance = Flagship.start('', '', {
      onSdkStatusChanged
    })
    expect(Flagship.getStatus()).toBe(FSSdkStatus.SDK_NOT_INITIALIZED)
    expect(instance).toBeInstanceOf(Flagship)
  })
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNull = (): any => {
  return null
}

describe('test Flagship newVisitor', () => {
  const isBrowserSpy = jest.spyOn(utils, 'isBrowser')
  const launchQaAssistantSpy = jest.spyOn(qaAssistant, 'launchQaAssistant')
  launchQaAssistantSpy.mockImplementation(() => {
    //
  })
  beforeAll(() => {
    isBrowserSpy.mockReturnValue(false)
  })
  it('should ', async () => {
    const logManager = new FlagshipLogManager()
    const logWarning = jest.spyOn(logManager, 'warning')

    Flagship.start('envId', 'apiKey', {
      logManager
    })
    const visitorId = 'visitorId'
    const context = { isVip: true }
    const predefinedContext = {
      fs_client: SDK_INFO.name,
      fs_version: SDK_INFO.version,
      fs_users: visitorId
    }
    // expect(addHit).toBeCalledTimes(1)
    let visitor = Flagship.newVisitor({ visitorId, context, hasConsented: true })

    expect(visitor?.visitorId).toBe(visitorId)
    expect(visitor?.context).toEqual({ ...context, ...predefinedContext })
    expect(Flagship.getVisitor()).toBeUndefined()

    expect(addHit).toBeCalledTimes(1)

    const visitorNull = Flagship.newVisitor({ visitorId: getNull(), context, hasConsented: true })
    expect(visitorNull).toBeInstanceOf(Visitor)

    const newVisitor = Flagship.newVisitor({ visitorId, hasConsented: true })
    expect(newVisitor?.context).toEqual({ ...predefinedContext })
    expect(newVisitor?.hasConsented).toBe(true)

    await sleep(500)
    expect(getCampaignsAsync).toBeCalledTimes(3)
    expect(getCampaignsAsync).toBeCalledWith(expect.objectContaining({ visitorId: visitor?.visitorId, context: visitor?.context }))

    visitor = Flagship.newVisitor({ visitorId, context, hasConsented: true })

    expect(visitor?.visitorId).toBe(visitorId)
    expect(visitor?.context).toEqual({ ...context, ...predefinedContext })

    visitor = Flagship.newVisitor({} as NewVisitor)

    expect(visitor?.visitorId).toBeDefined()
    expect(visitor?.context).toEqual(expect.objectContaining({ ...predefinedContext, fs_users: expect.anything() }))
    expect(visitor?.anonymousId).toBeNull()
    expect(visitor?.hasConsented).toBe(false)
    expect(logWarning).toBeCalledTimes(1)
    expect(logWarning).toBeCalledWith(CONSENT_NOT_SPECIFY_WARNING, PROCESS_NEW_VISITOR)

    visitor = Flagship.newVisitor({ shouldSaveInstance: false, hasConsented: true })
    expect(Flagship.getVisitor()).toBeUndefined()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.window = jest.fn() as any

    // test client side true and shouldSaveInstance to false
    visitor = Flagship.newVisitor({ shouldSaveInstance: true, hasConsented: false })
    expect(Flagship.getVisitor()).toBeDefined()
    expect(visitor).toBe(Flagship.getVisitor())

    // test client side true and shouldSaveInstance to false
    // Create a visitor: "visitor_1" as NEW_INSTANCE
    visitor = Flagship.newVisitor({ visitorId: 'visitor_1', shouldSaveInstance: false, hasConsented: true })
    expect(Flagship.getVisitor()).toBeUndefined()

    // scenario 2
    visitor = Flagship.newVisitor({ visitorId: 'visitor_2', shouldSaveInstance: true, hasConsented: true })
    expect(Flagship.getVisitor()).toBeDefined()
    expect(Flagship.getVisitor()?.visitorId).toBe('visitor_2')

    // scenario 3
    visitor = Flagship.newVisitor({ visitorId: 'visitor_3', shouldSaveInstance: true, hasConsented: true })
    expect(Flagship.getVisitor()).toBeDefined()
    expect(Flagship.getVisitor()?.visitorId).toBe('visitor_3')

    // scenario 4

    const visitor1 = Flagship.newVisitor({ visitorId: 'visitor_1', shouldSaveInstance: true, hasConsented: true })
    visitor1?.updateContext({ color: 'blue' })
    expect(Flagship.getVisitor()?.context.color).toBe('blue')

    const visitor2 = Flagship.newVisitor({ visitorId: 'visitor_2', shouldSaveInstance: true, hasConsented: true })
    expect(Flagship.getVisitor()?.context.color).toBeUndefined()
    Flagship.getVisitor()?.updateContext({ color: 'red' })

    expect(visitor1?.context.color).toBe('blue')
    expect(visitor2?.context.color).toBe('red')
    expect(Flagship.getVisitor()?.context.color).toBe('red')
  })
})
