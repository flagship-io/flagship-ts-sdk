import { jest, expect, it, describe } from '@jest/globals'
import { DecisionApiConfig } from '../../src'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager } from '../../src/config'
import { DecisionManager } from '../../src/decision/DecisionManager'
import { FlagshipStatus, HitType, METHOD_DEACTIVATED_ERROR } from '../../src/enum'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { sprintf } from '../../src/utils/utils'
import { VisitorDelegate, PanicStrategy } from '../../src/visitor'

describe('test NotReadyStrategy', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  const configManager = new ConfigManager(config, {} as DecisionManager, {} as TrackingManager)
  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true })
  const panicStrategy = new PanicStrategy(visitorDelegate)

  it('test setConsent', () => {
    const methodName = 'setConsent'
    panicStrategy.setConsent(true)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
  })

  it('test updateContext', () => {
    const methodName = 'updateContext'
    panicStrategy.updateContext({ key: 'value' })
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
  })

  it('test clearContext', () => {
    const methodName = 'clearContext'
    panicStrategy.clearContext()
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
  })

  it('test getModification', async () => {
    const defaultValue = 'value'
    const value = await panicStrategy.getModification({ key: 'key', defaultValue })
    const methodName = 'getModification'
    expect(value).toBe(defaultValue)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
  })

  it('test getModification array', () => {
    const defaultValue = 'value'
    panicStrategy.getModification([{ key: 'key', defaultValue }]).then((value) => {
      const methodName = 'getModification'

      expect(value).toEqual([defaultValue])
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
    })
  })

  it('test getModificationInfo', () => {
    panicStrategy.getModificationInfo('key').then((modification) => {
      const methodName = 'getModificationInfo'

      expect(modification).toBeNull()
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
    })
  })

  it('test activateModification', () => {
    panicStrategy.activateModification('key').then(() => {
      const methodName = 'activateModification'
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
    })
  })

  it('test sendHit', () => {
    panicStrategy.sendHit({ type: HitType.PAGE, documentLocation: 'home' }).then(() => {
      const methodName = 'sendHit'
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
    })
  })
})
