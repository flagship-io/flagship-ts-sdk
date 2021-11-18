import { jest, expect, it, describe } from '@jest/globals'
// import { mocked } from 'ts-jest/utils'
import { DecisionApiConfig, DecisionMode } from '../../src/config/index'
import {
  FlagshipStatus,
  INITIALIZATION_PARAM_ERROR,
  PROCESS_INITIALIZATION,
  SDK_LANGUAGE,
  SDK_STARTED_INFO,
  SDK_VERSION
} from '../../src/enum/index'
import { Flagship } from '../../src/main/Flagship'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { sleep, sprintf } from '../../src/utils/utils'
import { Visitor } from '../../src/visitor/Visitor'

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

describe('test newVisitor null', () => {
  const visitor = Flagship.newVisitor({ visitorId: 'visitor' })
  expect(visitor).toBeNull()
})

describe('test Flagship class', () => {
  const envId = 'envId'
  const apiKey = 'apiKey'

  it('should ', () => {
    Flagship.start(envId, apiKey)

    expect(Flagship.getConfig()).toBeDefined()
    expect(Flagship.getConfig()).toBeInstanceOf(DecisionApiConfig)

    expect(Flagship.getConfig().envId).toBe(envId)
    expect(Flagship.getConfig().apiKey).toBe(apiKey)
    expect(Flagship.getConfig().logManager).toBeDefined()
    expect(Flagship.getStatus()).toBe(FlagshipStatus.READY)
    expect(Flagship.getConfig().logManager).toBeInstanceOf(FlagshipLogManager)
    expect(Flagship.getConfig().decisionMode).toBe(DecisionMode.DECISION_API)
  })
})

describe('test Flagship with custom config literal object', () => {
  it('should ', () => {
    const envId = 'envId'
    const apiKey = 'apiKey'
    const logManager = new FlagshipLogManager()
    Flagship.start(envId, apiKey, { logManager })

    expect(Flagship.getConfig().envId).toBe(envId)
    expect(Flagship.getConfig().apiKey).toBe(apiKey)
    expect(Flagship.getConfig().logManager).toBe(logManager)
    expect(Flagship.getConfig().decisionMode).toBe(DecisionMode.DECISION_API)
  })
})

describe('test Flagship with custom config', () => {
  const envId = 'envId'
  const apiKey = 'apiKey'
  const config = new DecisionApiConfig()

  it('should ', () => {
    let countStatus = 0
    config.statusChangedCallback = (status) => {
      switch (countStatus) {
        case 0:
          expect(status).toBe(FlagshipStatus.STARTING)
          break
        case 1:
          expect(status).toBe(FlagshipStatus.READY)
          break
        case 2:
          expect(status).toBe(FlagshipStatus.STARTING)
          break

        default:
          break
      }
      countStatus++
    }
  })

  const logManager = new FlagshipLogManager()
  const errorLog = jest.spyOn(logManager, 'error')
  const infoLog = jest.spyOn(logManager, 'info')
  config.logManager = logManager

  it('should ', () => {
    const instance = Flagship.start(envId, apiKey, config)
    expect(Flagship.getConfig()).toBeDefined()
    expect(Flagship.getConfig()).toBe(config)
    expect(Flagship.getConfig().envId).toBe(envId)
    expect(Flagship.getConfig().apiKey).toBe(apiKey)
    expect(Flagship.getConfig().logManager).toBe(logManager)

    expect(Flagship.getStatus()).toBe(FlagshipStatus.READY)

    expect(infoLog).toBeCalledTimes(1)
    expect(infoLog).toBeCalledWith(
      sprintf(SDK_STARTED_INFO, SDK_VERSION),
      PROCESS_INITIALIZATION
    )
    expect(instance).toBeInstanceOf(Flagship)
  })

  it('should ', () => {
    const instance = Flagship.start('', '', config)
    expect(Flagship.getStatus()).toBe(FlagshipStatus.NOT_INITIALIZED)
    expect(errorLog).toBeCalledTimes(1)
    expect(errorLog).toBeCalledWith(
      INITIALIZATION_PARAM_ERROR,
      PROCESS_INITIALIZATION
    )
    expect(instance).toBeNull()
  })
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNull = (): any => {
  return null
}

describe('test Flagship newVisitor', () => {
  it('should ', async () => {
    Flagship.start('envId', 'apiKey')
    const visitorId = 'visitorId'
    const context = { isVip: true }
    const predefinedContext = {
      fs_client: SDK_LANGUAGE,
      fs_version: SDK_VERSION,
      fs_users: visitorId
    }
    let visitor = Flagship.newVisitor({ visitorId, context })

    expect(visitor?.visitorId).toBe(visitorId)
    expect(visitor?.context).toEqual({ ...context, ...predefinedContext })
    expect(Flagship.getVisitor()).toBeUndefined()

    const visitorNull = Flagship.newVisitor({ visitorId: getNull(), context })
    expect(visitorNull).toBeInstanceOf(Visitor)

    const newVisitor = Flagship.newVisitor({ visitorId })
    expect(newVisitor?.context).toEqual({ ...predefinedContext })

    await sleep(500)
    expect(getCampaignsAsync).toBeCalledTimes(3)
    expect(getCampaignsAsync).toBeCalledWith(expect.objectContaining({ visitorId: visitor?.visitorId, context: visitor?.context }))

    visitor = Flagship.newVisitor({ visitorId, context })

    expect(visitor?.visitorId).toBe(visitorId)
    expect(visitor?.context).toEqual({ ...context, ...predefinedContext })

    visitor = Flagship.newVisitor({})

    expect(visitor?.visitorId).toBeDefined()
    expect(visitor?.context).toEqual(expect.objectContaining({ ...predefinedContext, fs_users: expect.anything() }))
    expect(visitor?.anonymousId).toBeNull()

    visitor = Flagship.newVisitor({ isNewInstance: true })
    expect(Flagship.getVisitor()).toBeUndefined()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.window = jest.fn() as any

    // test client side true and isNewInstance to false
    visitor = Flagship.newVisitor({ isNewInstance: false, hasConsented: false })
    expect(Flagship.getVisitor()).toBeDefined()
    expect(visitor).toBe(Flagship.getVisitor())

    visitor = Flagship.newVisitor()
    expect(Flagship.getVisitor()).toBeDefined()
    expect(visitor).toBe(Flagship.getVisitor())

    // test client side true and isNewInstance to true
    // Create a visitor: "visitor_1" as NEW_INSTANCE
    visitor = Flagship.newVisitor({ visitorId: 'visitor_1', isNewInstance: true })
    expect(Flagship.getVisitor()).toBeUndefined()

    // scenario 2
    visitor = Flagship.newVisitor({ visitorId: 'visitor_2', isNewInstance: false })
    expect(Flagship.getVisitor()).toBeDefined()
    expect(Flagship.getVisitor()?.visitorId).toBe('visitor_2')

    // scenario 3
    visitor = Flagship.newVisitor({ visitorId: 'visitor_3', isNewInstance: false })
    expect(Flagship.getVisitor()).toBeDefined()
    expect(Flagship.getVisitor()?.visitorId).toBe('visitor_3')

    // scenario 4

    const visitor1 = Flagship.newVisitor({ visitorId: 'visitor_1', isNewInstance: false })
    visitor1?.updateContext({ color: 'blue' })
    expect(Flagship.getVisitor()?.context.color).toBe('blue')

    const visitor2 = Flagship.newVisitor({ visitorId: 'visitor_2', isNewInstance: false })
    expect(Flagship.getVisitor()?.context.color).toBeUndefined()
    Flagship.getVisitor()?.updateContext({ color: 'red' })

    expect(visitor1?.context.color).toBe('blue')
    expect(visitor2?.context.color).toBe('red')
    expect(Flagship.getVisitor()?.context.color).toBe('red')
  })

  describe('test not ready', () => {
    const visitorId = 'visitorId'
    const context = { isVip: true }
    const visitor = Flagship.newVisitor({ visitorId, context })
    expect(visitor).toBeNull()
  })
})
