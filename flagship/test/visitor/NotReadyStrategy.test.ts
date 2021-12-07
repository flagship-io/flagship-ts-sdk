import { jest, expect, it, describe } from '@jest/globals'
import { DecisionApiConfig } from '../../src'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager } from '../../src/config'
import { DecisionManager } from '../../src/decision/DecisionManager'
import { FlagshipStatus, HitType, METHOD_DEACTIVATED_ERROR } from '../../src/enum'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient } from '../../src/utils/HttpClient'
import { sprintf } from '../../src/utils/utils'
import { VisitorDelegate, NotReadyStrategy } from '../../src/visitor'

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

  const trackingManager = new TrackingManager({} as HttpClient, config)
  const sendConsentHit = jest.spyOn(trackingManager, 'sendConsentHit')
  sendConsentHit.mockResolvedValue()

  const configManager = new ConfigManager(config, {} as DecisionManager, trackingManager)
  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true })
  const notReadyStrategy = new NotReadyStrategy(visitorDelegate)

  it('test synchronizedModifications', () => {
    notReadyStrategy.synchronizeModifications().then(() => {
      const methodName = 'synchronizeModifications'
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.NOT_INITIALIZED]), methodName)
    })
  })

  it('test fetchFlags', () => {
    notReadyStrategy.fetchFlags().then(() => {
      const methodName = 'fetchFlags'
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.NOT_INITIALIZED]), methodName)
    })
  })

  it('test getModification', () => {
    const defaultValue = 'value'
    notReadyStrategy.getModification({ key: 'key', defaultValue }).then((value) => {
      const methodName = 'getModification'

      expect(value).toBe(defaultValue)
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.NOT_INITIALIZED]), methodName)
    })
  })

  it('test getFlagValue', () => {
    const defaultValue = 'value'
    const flagValue = notReadyStrategy.getFlagValue({ key: 'key', defaultValue })
    const methodName = 'Flag.value'
    expect(flagValue).toBe(defaultValue)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.NOT_INITIALIZED]), methodName)
  })

  it('test getModification array', () => {
    const defaultValue = 'value'
    notReadyStrategy.getModifications([{ key: 'key', defaultValue }]).then((value) => {
      const methodName = 'getModifications'

      expect(value).toEqual({ key: defaultValue })
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.NOT_INITIALIZED]), methodName)
    })
  })

  it('test getModificationInfo', () => {
    notReadyStrategy.getModificationInfo('key').then((modification) => {
      const methodName = 'getModificationInfo'

      expect(modification).toBeNull()
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.NOT_INITIALIZED]), methodName)
    })
  })

  it('test getFlagMetadata', () => {
    const metadata = notReadyStrategy.getFlagMetadata()
    const methodName = 'flag.metadata'
    expect(metadata).toEqual({
      campaignId: '',
      variationGroupId: '',
      campaignType: '',
      variationId: '',
      isReference: false
    })
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.NOT_INITIALIZED]), methodName)
  })

  it('test activateModification', () => {
    notReadyStrategy.activateModification('key').then(() => {
      const methodName = 'activateModification'
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.NOT_INITIALIZED]), methodName)
    })
  })

  it('test userExposed', async () => {
    await notReadyStrategy.userExposed()
    const methodName = 'userExposed'
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.NOT_INITIALIZED]), methodName)
  })

  it('test activateModifications', () => {
    notReadyStrategy.activateModifications(['key']).then(() => {
      const methodName = 'activateModifications'
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.NOT_INITIALIZED]), methodName)
    })
  })

  it('test sendHit', () => {
    notReadyStrategy.sendHit({ type: HitType.PAGE, documentLocation: 'home' }).then(() => {
      const methodName = 'sendHit'
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.NOT_INITIALIZED]), methodName)
    })
  })

  it('test sendHits', () => {
    notReadyStrategy.sendHits([{ type: HitType.PAGE, documentLocation: 'home' }]).then(() => {
      const methodName = 'sendHits'
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.NOT_INITIALIZED]), methodName)
    })
  })
})
