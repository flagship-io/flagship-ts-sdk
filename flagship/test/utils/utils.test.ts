import { logDebug, logDebugSprintf, logError, logErrorSprintf, logInfo, logInfoSprintf, sprintf } from '../../src/utils/utils'
import { jest, expect, it, describe } from '@jest/globals'
import { DecisionApiConfig } from '../../src/config/index'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { LogLevel } from '../../src/enum/index'

describe('test sprintf function', () => {
  it('should ', () => {
    const textToTest = 'My name is {0} {1}'
    const output = sprintf(textToTest, 'merveille', 'kitoko')
    expect(output).toBe('My name is merveille kitoko')
  })
})

describe('test logError function', () => {
  const config = new DecisionApiConfig()

  const logManager = new FlagshipLogManager()

  const errorMethod = jest.spyOn(logManager, 'error')
  const infoMethod = jest.spyOn(logManager, 'info')
  const debugMethod = jest.spyOn(logManager, 'debug')

  const onLog = jest.fn<void, [level: LogLevel, tag: string, message: string]>()
  config.onLog = onLog

  config.logManager = logManager

  const messageAll = 'this is a log message'
  const tag = 'tag'

  it('test logError level ALL', () => {
    logError(config, messageAll, tag)
    expect(errorMethod).toBeCalledTimes(1)
    expect(errorMethod).toBeCalledWith(messageAll, tag)
    expect(onLog).toBeCalledTimes(1)
    expect(onLog).toBeCalledWith(LogLevel.ERROR, tag, messageAll)
  })

  it('test level EMERGENCY', () => {
    config.logLevel = LogLevel.EMERGENCY
    const messageEmergency = 'emergency'
    logError(config, messageEmergency, tag)
    expect(errorMethod).toBeCalledTimes(0)
    expect(onLog).toBeCalledTimes(0)
  })

  it('test level NONE', () => {
    config.logLevel = LogLevel.NONE
    const messageNone = 'none'
    logError(config, messageNone, tag)
    logErrorSprintf(config, tag, messageNone)
    expect(errorMethod).toBeCalledTimes(0)

    logDebug(config, messageNone, tag)
    logDebugSprintf(config, tag, messageNone)
    expect(debugMethod).toBeCalledTimes(0)

    logInfo(config, messageNone, tag)
    logInfoSprintf(config, tag, messageNone)
    expect(infoMethod).toBeCalledTimes(0)

    expect(onLog).toBeCalledTimes(0)
  })

  it('test level INFO', () => {
    config.logLevel = LogLevel.INFO
    const messageInfo = 'this a message with info level'
    logInfo(config, messageInfo, tag)
    expect(infoMethod).toBeCalledTimes(1)
    expect(infoMethod).toBeCalledWith(messageInfo, tag)
    expect(onLog).toBeCalledTimes(1)
    expect(onLog).toBeCalledWith(LogLevel.INFO, tag, messageInfo)
  })

  it('test level DEBUG', () => {
    config.logLevel = LogLevel.DEBUG
    const messageDebug = 'this a message with DEBUG level'
    logDebug(config, messageDebug, tag)
    expect(debugMethod).toBeCalledTimes(1)
    expect(debugMethod).toBeCalledWith(messageDebug, tag)
    expect(onLog).toBeCalledTimes(1)
    expect(onLog).toBeCalledWith(LogLevel.DEBUG, tag, messageDebug)
  })

  it('test level DEBUG', () => {
    config.logLevel = LogLevel.INFO
    const messageDebug = 'this a message with DEBUG level'
    logDebug(config, messageDebug, tag)
    expect(debugMethod).toBeCalledTimes(0)
  })

  it('test invalid config', () => {
    logError({} as DecisionApiConfig, messageAll, tag)
    expect(errorMethod).toBeCalledTimes(0)
  })
})

describe('test logInfo function', () => {
  const config = new DecisionApiConfig()

  const logManager = new FlagshipLogManager()

  const infoMethod = jest.spyOn(logManager, 'info')

  config.logManager = logManager

  const messageAll = 'this is a log message'
  const tag = 'tag'

  it('test logError level ALL', () => {
    logInfo(config, messageAll, tag)
    expect(infoMethod).toBeCalledTimes(1)
    expect(infoMethod).toBeCalledWith(messageAll, tag)
  })

  it('test level EMERGENCY', () => {
    config.logLevel = LogLevel.EMERGENCY
    const messageEmergency = 'emergency'
    logInfo(config, messageEmergency, tag)
    expect(infoMethod).toBeCalledTimes(0)
  })

  it('test level NONE', () => {
    config.logLevel = LogLevel.NONE
    const messageNone = 'none'
    logInfo(config, messageNone, tag)
    expect(infoMethod).toBeCalledTimes(0)
  })

  it('test level INFO', () => {
    config.logLevel = LogLevel.INFO
    const messageInfo = 'this a message with info level'
    logInfo(config, messageInfo, tag)
    expect(infoMethod).toBeCalledTimes(1)
    expect(infoMethod).toBeCalledWith(messageInfo, tag)
  })

  it('test invalid config', () => {
    logError({} as DecisionApiConfig, messageAll, tag)
    expect(infoMethod).toBeCalledTimes(0)
  })
})
