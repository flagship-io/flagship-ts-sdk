import { logDebug, logDebugSprintf, logError, logErrorSprintf, logInfo, logInfoSprintf, logWarning, logWarningSprintf, sprintf, visitorFlagSyncStatusMessage } from '../../src/utils/utils'
import { jest, expect, it, describe } from '@jest/globals'
import { DecisionApiConfig } from '../../src/config/index'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { LogLevel } from '../../src/enum/index'
import { FSFetchReasons } from '../../src/enum/FSFetchReasons'

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
  const warningMethod = jest.spyOn(logManager, 'warning')

  const onLog = jest.fn<(level: LogLevel, tag: string, message: string)=>void>()
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

    logWarning(config, messageNone, tag)
    logWarningSprintf(config, tag, messageNone)
    expect(warningMethod).toBeCalledTimes(0)

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
    expect(onLog).toBeCalledTimes(0)
  })

  it('test level WARNING', () => {
    config.logLevel = LogLevel.WARNING
    const messageWarning = 'this a message with Warning level'
    logWarning(config, messageWarning, tag)
    expect(warningMethod).toBeCalledTimes(1)
    expect(onLog).toBeCalledTimes(1)
    expect(onLog).toBeCalledWith(LogLevel.WARNING, tag, messageWarning)
  })

  it('test invalid config', () => {
    logError({} as DecisionApiConfig, messageAll, tag)
    expect(errorMethod).toBeCalledTimes(0)
  })
})

describe('Test visitorFlagSyncStatusMessage function', () => {
  it('should return a message containing "created" when FSFetchReasons.VISITOR_CREATED is passed', () => {
    const message = visitorFlagSyncStatusMessage(FSFetchReasons.VISITOR_CREATED)
    expect(message).toEqual(expect.stringContaining('created'))
  })

  it('should return a message containing "updated" when FSFetchReasons.UPDATE_CONTEXT is passed', () => {
    const message = visitorFlagSyncStatusMessage(FSFetchReasons.UPDATE_CONTEXT)
    expect(message).toEqual(expect.stringContaining('updated'))
  })

  it('should return a message containing "authenticated" when FSFetchReasons.AUTHENTICATE is passed', () => {
    const message = visitorFlagSyncStatusMessage(FSFetchReasons.AUTHENTICATE)
    expect(message).toEqual(expect.stringContaining('authenticated'))
  })

  it('should return a message containing "unauthenticated" when FSFetchReasons.UNAUTHENTICATE is passed', () => {
    const message = visitorFlagSyncStatusMessage(FSFetchReasons.UNAUTHENTICATE)
    expect(message).toEqual(expect.stringContaining('unauthenticated'))
  })

  it('should return an empty string when FSFetchReasons.NONE is passed', () => {
    const message = visitorFlagSyncStatusMessage(FSFetchReasons.NONE)
    expect(message).toBe('')
  })

  it('should return a message containing "error" when FSFetchReasons.FETCH_ERROR is passed', () => {
    const message = visitorFlagSyncStatusMessage(FSFetchReasons.FETCH_ERROR)
    expect(message).toEqual(expect.stringContaining('error'))
  })

  it('should return a message containing "fetched from cache" when FSFetchReasons.READ_FROM_CACHE is passed', () => {
    const message = visitorFlagSyncStatusMessage(FSFetchReasons.READ_FROM_CACHE)
    expect(message).toEqual(expect.stringContaining('fetched from cache'))
  })
})
