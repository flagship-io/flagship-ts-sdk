import { jest, expect, it, describe } from '@jest/globals'
import { DecisionApiConfig, FlagshipStatus } from '../../src'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager } from '../../src/config'
import { ApiManager } from '../../src/decision/ApiManager'
import { ACTIVATE_MODIFICATION_ERROR, METHOD_DEACTIVATED_CONSENT_ERROR, METHOD_DEACTIVATED_ERROR, PROCESS_ACTIVE_MODIFICATION } from '../../src/enum'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { IHttpClient } from '../../src/utils/HttpClient'
import { sprintf } from '../../src/utils/utils'
import { VisitorDelegate } from '../../src/visitor'
import { VisitorAbstract } from '../../src/visitor/VisitorAbstract'

describe('test getStrategy', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')
  const logInfo = jest.spyOn(logManager, 'info')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  const trackingManager = new TrackingManager({} as IHttpClient, config)
  const configManager = new ConfigManager(config, {} as ApiManager, trackingManager)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, hasConsented: false, configManager: configManager as ConfigManager })

  it('test NotReadyStrategy flagship status is undefined', async () => {
    const methodName = 'activateModification'
    await visitorDelegate.activateModification('key')
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, methodName, FlagshipStatus[FlagshipStatus.NOT_INITIALIZED]), methodName)
  })

  it('test NotReadyStrategy flagship with status  NOT_INITIALIZED', async () => {
    VisitorAbstract.SdkStatus = FlagshipStatus.NOT_INITIALIZED
    const methodName = 'activateModification'
    await visitorDelegate.activateModification('key')
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, methodName, FlagshipStatus[FlagshipStatus.NOT_INITIALIZED]), methodName)
  })

  it('test PanicStrategy', async () => {
    VisitorAbstract.SdkStatus = FlagshipStatus.READY_PANIC_ON
    const methodName = 'activateModification'
    await visitorDelegate.activateModification('key')
    await visitorDelegate.activateModification('key')
    expect(logInfo).toBeCalledTimes(2)
    expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
  })

  it('test NoConsent', async () => {
    VisitorAbstract.SdkStatus = FlagshipStatus.READY
    const methodName = 'activateModification'
    await visitorDelegate.activateModification('key')
    expect(logInfo).toBeCalledTimes(1)
    expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_CONSENT_ERROR, methodName, visitorDelegate.visitorId), methodName)
  })

  it('test DefaultStrategy', async () => {
    VisitorAbstract.SdkStatus = FlagshipStatus.READY
    visitorDelegate.setConsent(true)
    await visitorDelegate.activateModification('key')
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(ACTIVATE_MODIFICATION_ERROR, 'key'),
      PROCESS_ACTIVE_MODIFICATION)
  })
})
