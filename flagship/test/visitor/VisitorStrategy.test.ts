import { jest, expect, it, describe } from '@jest/globals'
import { DecisionApiConfig } from '../../src'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager } from '../../src/config'
import { ApiManager } from '../../src/decision/ApiManager'
import { FLAG_VISITOR_EXPOSED, FSSdkStatus, METHOD_DEACTIVATED_CONSENT_ERROR, METHOD_DEACTIVATED_ERROR, USER_EXPOSED_FLAG_ERROR } from '../../src/enum'
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
  const logWarning = jest.spyOn(logManager, 'warning')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  const trackingManager = new TrackingManager({} as IHttpClient, config)
  const configManager = new ConfigManager(config, {} as ApiManager, trackingManager)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, hasConsented: true, configManager: configManager as ConfigManager })

  it('test NotReadyStrategy flagship status is undefined', async () => {
    await visitorDelegate.visitorExposed({ key: 'key', defaultValue: 'defaultValue', hasGetValueBeenCalled: true })
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, FLAG_VISITOR_EXPOSED, FSSdkStatus[FSSdkStatus.SDK_NOT_INITIALIZED]), FLAG_VISITOR_EXPOSED)
  })

  it('test NotReadyStrategy flagship with status  NOT_INITIALIZED', async () => {
    VisitorAbstract.SdkStatus = FSSdkStatus.SDK_NOT_INITIALIZED
    await visitorDelegate.visitorExposed({ key: 'key', defaultValue: 'defaultValue', hasGetValueBeenCalled: true })
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, FLAG_VISITOR_EXPOSED, FSSdkStatus[FSSdkStatus.SDK_NOT_INITIALIZED]), FLAG_VISITOR_EXPOSED)
  })

  it('test PanicStrategy', async () => {
    VisitorAbstract.SdkStatus = FSSdkStatus.SDK_PANIC
    await visitorDelegate.visitorExposed({ key: 'key', defaultValue: 'defaultValue', hasGetValueBeenCalled: true })
    expect(logInfo).toBeCalledTimes(1)
    expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, FLAG_VISITOR_EXPOSED, FSSdkStatus[FSSdkStatus.SDK_PANIC]), FLAG_VISITOR_EXPOSED)
  })

  it('test NoConsent', async () => {
    visitorDelegate.hasConsented = false
    VisitorAbstract.SdkStatus = FSSdkStatus.SDK_INITIALIZED
    await visitorDelegate.visitorExposed({ key: 'key', defaultValue: 'defaultValue', hasGetValueBeenCalled: true })
    expect(logInfo).toBeCalledTimes(1)
    expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_CONSENT_ERROR, FLAG_VISITOR_EXPOSED, visitorDelegate.visitorId), FLAG_VISITOR_EXPOSED)
    visitorDelegate.hasConsented = true
  })

  it('test DefaultStrategy', async () => {
    VisitorAbstract.SdkStatus = FSSdkStatus.SDK_INITIALIZED
    await visitorDelegate.visitorExposed({ key: 'key', defaultValue: 'defaultValue', hasGetValueBeenCalled: true })
    expect(logWarning).toBeCalledTimes(1)
    expect(logWarning).toBeCalledWith(sprintf(USER_EXPOSED_FLAG_ERROR, visitorId, 'key'),
      FLAG_VISITOR_EXPOSED)
  })
})
