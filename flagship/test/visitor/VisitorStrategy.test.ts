import { jest, expect, beforeAll, it, describe } from '@jest/globals'
import { DecisionApiConfig, Flagship, FlagshipStatus } from '../../src'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager } from '../../src/config'
import { ApiManager } from '../../src/decision/ApiManager'
import { GET_MODIFICATION_ERROR, METHOD_DEACTIVATED_CONSENT_ERROR, METHOD_DEACTIVATED_ERROR, PROCESS_ACTIVE_MODIFICATION } from '../../src/enum'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { IHttpClient } from '../../src/utils/httpClient'
import { sprintf } from '../../src/utils/utils'
import { VisitorDelegate } from '../../src/visitor'

describe('test getStrategy', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  const trackingManager = new TrackingManager({} as IHttpClient, config)
  const configManager = new ConfigManager(config, {} as ApiManager, trackingManager)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager: configManager as ConfigManager })

  it('test NotReadyStrategy flagship status is undefined', async () => {
    const methodName = 'activateModification'
    await visitorDelegate.activateModification('key')
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.NOT_INITIALIZED]), methodName)
  })

  it('test NotReadyStrategy flagship with status  NOT_INITIALIZED', async () => {
    Flagship.getStatus = jest.fn(() => {
      return FlagshipStatus.NOT_INITIALIZED
    })
    const methodName = 'activateModification'
    await visitorDelegate.activateModification('key')
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.NOT_INITIALIZED]), methodName)
  })

  it('test PanicStrategy', async () => {
    Flagship.getStatus = jest.fn(() => {
      return FlagshipStatus.READY_PANIC_ON
    })
    const methodName = 'activateModification'
    await visitorDelegate.activateModification('key')
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
  })

  it('test NoConsent', async () => {
    Flagship.getStatus = jest.fn(() => {
      return FlagshipStatus.READY
    })
    const methodName = 'activateModification'
    await visitorDelegate.activateModification('key')
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_CONSENT_ERROR, methodName, visitorDelegate.visitorId), methodName)
  })

  it('test DefaultStrategy', async () => {
    Flagship.getStatus = jest.fn(() => {
      return FlagshipStatus.READY
    })
    visitorDelegate.setConsent(true)
    await visitorDelegate.activateModification('key')
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(GET_MODIFICATION_ERROR, 'key'),
      PROCESS_ACTIVE_MODIFICATION)
  })
})
