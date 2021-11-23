import { jest, expect, it, describe } from '@jest/globals'
import { DecisionApiConfig } from '../../src'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager } from '../../src/config'
import { ApiManager } from '../../src/decision/ApiManager'
import { FlagshipStatus, HitType, METHOD_DEACTIVATED_ERROR, METHOD_DEACTIVATED_SEND_CONSENT_ERROR, VISITOR_CACHE_VERSION } from '../../src/enum'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient } from '../../src/utils/HttpClient'
import { sprintf } from '../../src/utils/utils'
import { VisitorDelegate, PanicStrategy } from '../../src/visitor'
import { campaigns } from '../decision/campaigns'

import { Mock } from 'jest-mock'
import { IVisitorCacheImplementation } from '../../src/visitor/IVisitorCacheImplementation '

describe('test NotReadyStrategy', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const cacheVisitor:Mock<void, [visitorId: string, data: string]> = jest.fn()
  const lookupVisitor:Mock<string, [visitorId: string]> = jest.fn()
  const flushVisitor:Mock<void, [visitorId: string]> = jest.fn()
  const visitorCacheImplementation:IVisitorCacheImplementation = {
    cacheVisitor,
    lookupVisitor,
    flushVisitor
  }

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', visitorCacheImplementation })
  config.logManager = logManager

  const apiManager = new ApiManager({} as HttpClient, config)

  const getCampaignsAsync = jest.spyOn(apiManager, 'getCampaignsAsync')

  const trackingManager = new TrackingManager({} as HttpClient, config)
  const sendConsentHit = jest.spyOn(trackingManager, 'sendConsentHit')
  sendConsentHit.mockResolvedValue()

  const configManager = new ConfigManager(config, apiManager, trackingManager)
  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true })
  const panicStrategy = new PanicStrategy(visitorDelegate)

  it('test setConsent', () => {
    const methodName = 'setConsent'
    panicStrategy.setConsent(true)
    expect(visitorDelegate.hasConsented).toBe(true)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_SEND_CONSENT_ERROR, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
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
    panicStrategy.getModifications([{ key: 'key', defaultValue }]).then((value) => {
      const methodName = 'getModifications'

      expect(value).toEqual({ key: defaultValue })
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

  it('test fetchVisitorCacheCampaigns', async () => {
    getCampaignsAsync.mockResolvedValue([])
    visitorDelegate.visitorCache = {
      version: VISITOR_CACHE_VERSION,
      data: {
        visitorId: visitorDelegate.visitorId,
        anonymousId: visitorDelegate.anonymousId,
        consent: visitorDelegate.hasConsented,
        context: visitorDelegate.context,
        campaigns: campaigns.campaigns.map(campaign => {
          return {
            campaignId: campaign.id,
            variationGroupId: campaign.variationGroupId,
            variationId: campaign.variation.id,
            isReference: campaign.variation.reference,
            type: campaign.variation.modifications.type,
            activated: false,
            flags: campaign.variation.modifications.value
          }
        })
      }
    }
    await panicStrategy.synchronizeModifications()
    expect(visitorDelegate.campaigns).toEqual([])
    expect(cacheVisitor).toBeCalledTimes(0)
    await panicStrategy.lookupHits()
    await panicStrategy.lookupVisitor()
  })

  it('test activateModification', () => {
    panicStrategy.activateModification('key').then(() => {
      const methodName = 'activateModification'
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
    })
  })

  it('test activateModifications', () => {
    panicStrategy.activateModifications(['key']).then(() => {
      const methodName = 'activateModifications'
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

  it('test sendHits', () => {
    panicStrategy.sendHits([{ type: HitType.PAGE, documentLocation: 'home' }]).then(() => {
      const methodName = 'sendHits'
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
    })
  })
})
