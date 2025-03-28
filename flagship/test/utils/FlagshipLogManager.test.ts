import { jest, expect, it, describe, beforeAll, afterAll } from '@jest/globals'
import { FLAGSHIP_SDK, LogLevel } from '../../src/enum/index'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'

 
const getTwoDigit = (value: any) => {
  return value.toString().length === 1 ? `0${value}` : value
}
const getOut = (level: LogLevel, message: string, tag: string) => {
  const now = new Date(Date.now())
  return `[${getTwoDigit(now.getFullYear())}-${getTwoDigit(
    now.getMonth() + 1
  )}-${getTwoDigit(now.getDate())} ${getTwoDigit(now.getHours())}:${getTwoDigit(now.getMinutes())}:${getTwoDigit(now.getSeconds())}.${getTwoDigit(now.getMilliseconds())}] [${FLAGSHIP_SDK}] [${LogLevel[level]}] [${tag}] : ${message}`
}
describe('test FlagshipLogManager', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now >()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })
  const log = jest.spyOn(console, 'log')
  const logError = jest.spyOn(console, 'error')
  const logDebug = jest.spyOn(console, 'debug')
  const logInfo = jest.spyOn(console, 'info')
  const logWarn = jest.spyOn(console, 'warn')

  const logManager = new FlagshipLogManager()
  const message = 'this is a log message'
  const tag = 'tag'

  it('test alert', () => {
    logManager.alert(message, tag)
    expect(logError).toBeCalledWith(getOut(LogLevel.ALERT, message, tag))
  })

  it('test critical', () => {
    logManager.critical(message, tag)
    expect(logError).toBeCalledWith(getOut(LogLevel.CRITICAL, message, tag))
  })

  it('test critical debug', () => {
    logManager.debug(message, tag)
    expect(logDebug).toBeCalledWith(getOut(LogLevel.DEBUG, message, tag))
  })

  it('test emergency', () => {
    logManager.emergency(message, tag)
    expect(logError).toBeCalledWith(getOut(LogLevel.EMERGENCY, message, tag))
  })

  it('test error', () => {
    logManager.error(message, tag)
    expect(logError).toBeCalledWith(getOut(LogLevel.ERROR, message, tag))
  })

  it('test info', () => {
    logManager.info(message, tag)
    expect(logInfo).toBeCalledWith(getOut(LogLevel.INFO, message, tag))
  })

  it('test notice', () => {
    logManager.notice(message, tag)
    expect(log).toBeCalledWith(getOut(LogLevel.NOTICE, message, tag))
  })

  it('test warning', () => {
    logManager.warning(message, tag)
    expect(logWarn).toBeCalledWith(getOut(LogLevel.WARNING, message, tag))
  })
})
