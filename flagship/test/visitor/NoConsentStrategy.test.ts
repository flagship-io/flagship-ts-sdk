import { jest, expect, it, describe } from '@jest/globals'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager, DecisionApiConfig } from '../../src/config/index'
import { DecisionManager } from '../../src/decision/DecisionManager'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'
import { NoConsentStrategy } from '../../src/visitor/index'
import { FLAG_USER_EXPOSED, HitType, LogLevel, METHOD_DEACTIVATED_CONSENT_ERROR } from '../../src/enum/index'
import { sprintf } from '../../src/utils/utils'
import { HttpClient } from '../../src/utils/HttpClient'

describe('test NoConsentStrategy', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()
  const logInfo = jest.spyOn(logManager, 'info')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', logLevel: LogLevel.INFO })
  config.logManager = logManager

  const trackingManager = new TrackingManager({} as HttpClient, config)

  const configManager = new ConfigManager(config, {} as DecisionManager, trackingManager)
  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true })
  const noConsentStrategy = new NoConsentStrategy(visitorDelegate)

  it('test activateModification', () => {
    noConsentStrategy.activateModification('key').then(() => {
      const methodName = 'activateModification'
      expect(logInfo).toBeCalledTimes(1)
      expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_CONSENT_ERROR, methodName, visitorDelegate.visitorId), methodName)
    })
  })

  it('test activateModifications', () => {
    noConsentStrategy.activateModifications(['key']).then(() => {
      const methodName = 'activateModifications'
      expect(logInfo).toBeCalledTimes(1)
      expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_CONSENT_ERROR, methodName, visitorDelegate.visitorId), methodName)
    })
  })

  it('test sendHit', () => {
    noConsentStrategy.sendHit({ type: HitType.PAGE, documentLocation: 'home' }).then(() => {
      const methodName = 'sendHit'
      expect(logInfo).toBeCalledTimes(1)
      expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_CONSENT_ERROR, methodName, visitorDelegate.visitorId), methodName)
    })
  })

  it('test sendHits', () => {
    noConsentStrategy.sendHits([{ type: HitType.PAGE, documentLocation: 'home' }]).then(() => {
      const methodName = 'sendHits'
      expect(logInfo).toBeCalledTimes(1)
      expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_CONSENT_ERROR, methodName, visitorDelegate.visitorId), methodName)
    })
  })

  it('test userExposed', () => {
    noConsentStrategy.visitorExposed().then(() => {
      expect(logInfo).toBeCalledTimes(1)
      expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_CONSENT_ERROR, FLAG_USER_EXPOSED, visitorDelegate.visitorId), FLAG_USER_EXPOSED)
    })
  })
})
