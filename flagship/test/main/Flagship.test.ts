import { jest, expect, it, describe } from '@jest/globals'
import { ConfigManager, DecisionApiConfig, DecisionMode } from '../../src/config/index'
import {
  FlagshipStatus,
  INITIALIZATION_PARAM_ERROR,
  PROCESS_INITIALIZATION,
  SDK_STARTED_INFO,
  SDK_VERSION
} from '../../src/enum/index'
import { Flagship } from '../../src/main/Flagship'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { sprintf } from '../../src/utils/utils'

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
          expect(status).toBe(FlagshipStatus.NOT_READY)
          break
        case 1:
          expect(status).toBe(FlagshipStatus.READY)
          break
        case 2:
          expect(status).toBe(FlagshipStatus.NOT_READY)
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
    Flagship.start(envId, apiKey, config)
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
  })

  it('should ', () => {
    Flagship.start('', '', config)
    expect(Flagship.getStatus()).toBe(FlagshipStatus.NOT_READY)
    expect(errorLog).toBeCalledTimes(1)
    expect(errorLog).toBeCalledWith(
      INITIALIZATION_PARAM_ERROR,
      PROCESS_INITIALIZATION
    )
  })
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNull = (): any => {
  return null
}

describe('test Flagship newVisitor', () => {
  it('should ', () => {
    Flagship.start('envId', 'apiKey')
    const visitorId = 'visitorId'
    const context = { isVip: true }
    const visitor = Flagship.newVisitor(visitorId, context)
    expect(visitor?.visitorId).toBe(visitorId)
    expect(visitor?.context).toEqual(context)
    expect(visitor?.configManager).toBeInstanceOf(ConfigManager)

    const visitorNull = Flagship.newVisitor(getNull(), context)
    expect(visitorNull).toBeNull()

    const newVisitor = Flagship.newVisitor(visitorId)
    expect(newVisitor?.context).toEqual({})
  })
})
