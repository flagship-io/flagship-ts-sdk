import { jest, expect, it, describe } from '@jest/globals'
import { FLAGSHIP_SDK, LogLevel } from '../../src/enum/index'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getTwoDigit = (value: any) => {
  return value.toString().length === 1 ? `0${value}` : value
}
const getOut = (level: LogLevel, message: string, tag: string) => {
  const now = new Date()
  return `[${getTwoDigit(now.getFullYear())}-${getTwoDigit(
    now.getMonth()
  )}-${getTwoDigit(now.getDay())} ${getTwoDigit(now.getHours())}:${getTwoDigit(
    now.getMinutes()
  )}] [${FLAGSHIP_SDK}] [${LogLevel[level]}] [${tag}] : ${message}`
}
describe('test FlagshipLogManager', () => {
  const logError = jest.spyOn(console, 'log')
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
    expect(logError).toBeCalledWith(getOut(LogLevel.DEBUG, message, tag))
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
    expect(logError).toBeCalledWith(getOut(LogLevel.INFO, message, tag))
  })

  it('test notice', () => {
    logManager.notice(message, tag)
    expect(logError).toBeCalledWith(getOut(LogLevel.NOTICE, message, tag))
  })

  it('test warning', () => {
    logManager.warning(message, tag)
    expect(logError).toBeCalledWith(getOut(LogLevel.WARNING, message, tag))
  })
})
