import { jest, expect, it, describe } from '@jest/globals'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager, DecisionApiConfig } from '../../src/config/index'
import { DecisionManager } from '../../src/decision/DecisionManager'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'
import { NoConsentStrategy } from '../../src/visitor/index'
import { HitType, METHOD_DEACTIVATED_CONSENT_ERROR } from '../../src/enum/index'
import { sprintf } from '../../src/utils/utils'

describe('test NoConsentStrategy', () => {
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
  const visitorDelegate = new VisitorDelegate(visitorId, context, configManager)
  const noConsentStrategy = new NoConsentStrategy(visitorDelegate)

  it('test activateModification', () => {
    noConsentStrategy.activateModification('key').then(() => {
      const methodName = 'activateModification'
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_CONSENT_ERROR, methodName, visitorDelegate.visitorId), methodName)
    })
  })

  it('test sendHit', () => {
    noConsentStrategy.sendHit({ type: HitType.PAGE, documentLocation: 'home' }).then(() => {
      const methodName = 'sendHit'
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_CONSENT_ERROR, methodName, visitorDelegate.visitorId), methodName)
    })
  })
})
