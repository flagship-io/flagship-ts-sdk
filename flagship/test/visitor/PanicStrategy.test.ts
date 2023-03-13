import { jest, expect, it, describe } from '@jest/globals'
import { DecisionApiConfig, IVisitorCacheImplementation, VisitorCacheDTO } from '../../src'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager } from '../../src/config'
import { ApiManager } from '../../src/decision/ApiManager'
import { FlagshipStatus, FLAG_METADATA, FLAG_USER_EXPOSED, HitType, LogLevel, METADATA_PANIC_MODE, METHOD_DEACTIVATED_ERROR, VISITOR_CACHE_VERSION } from '../../src/enum'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient } from '../../src/utils/HttpClient'
import { sprintf } from '../../src/utils/utils'
import { VisitorDelegate, PanicStrategy } from '../../src/visitor'
import { campaigns } from '../decision/campaigns'

import { Mock } from 'jest-mock'

describe('test NotReadyStrategy', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const cacheVisitor:Mock<Promise<void>, [visitorId: string, data: VisitorCacheDTO]> = jest.fn()
  const lookupVisitor:Mock<Promise<VisitorCacheDTO>, [visitorId: string]> = jest.fn()
  const flushVisitor:Mock<Promise<void>, [visitorId: string]> = jest.fn()
  const visitorCacheImplementation:IVisitorCacheImplementation = {
    cacheVisitor,
    lookupVisitor,
    flushVisitor
  }

  const logManager = new FlagshipLogManager()
  const logInfo = jest.spyOn(logManager, 'info')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', visitorCacheImplementation, logLevel: LogLevel.INFO })
  config.logManager = logManager

  const apiManager = new ApiManager({} as HttpClient, config)

  const getCampaignsAsync = jest.spyOn(apiManager, 'getCampaignsAsync')

  const trackingManager = new TrackingManager({} as HttpClient, config)

  const configManager = new ConfigManager(config, apiManager, trackingManager)
  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true })
  const panicStrategy = new PanicStrategy(visitorDelegate)

  it('test setConsent', () => {
    panicStrategy.setConsent(true)
    expect(visitorDelegate.hasConsented).toBe(true)
  })

  it('test updateContext', () => {
    const methodName = 'updateContext'
    panicStrategy.updateContext()
    expect(logInfo).toBeCalledTimes(1)
    expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
  })

  it('test clearContext', () => {
    const methodName = 'clearContext'
    panicStrategy.clearContext()
    expect(logInfo).toBeCalledTimes(1)
    expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
  })

  it('test getModification', async () => {
    const defaultValue = 'value'
    const value = await panicStrategy.getModification({ key: 'key', defaultValue })
    const methodName = 'getModification'
    expect(value).toBe(defaultValue)
    expect(logInfo).toBeCalledTimes(1)
    expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
  })

  it('test getFlagValue', () => {
    const defaultValue = 'value'
    const flagValue = panicStrategy.getFlagValue({ key: 'key', defaultValue })
    const methodName = 'Flag.value'
    expect(flagValue).toBe(defaultValue)
    expect(logInfo).toBeCalledTimes(1)
    expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
  })

  it('test getModification array', async () => {
    const defaultValue = 'value'
    const value = await panicStrategy.getModifications([{ key: 'key', defaultValue }])

    const methodName = 'getModifications'

    expect(value).toEqual({ key: defaultValue })
    expect(logInfo).toBeCalledTimes(1)
    expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
  })

  it('test getModificationInfo', async () => {
    const modification = await panicStrategy.getModificationInfo('key')

    const methodName = 'getModificationInfo'

    expect(modification).toBeNull()
    expect(logInfo).toBeCalledTimes(1)
    expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
  })

  it('test getFlagMetadata', () => {
    const key = 'flagKey'
    const metadata = panicStrategy.getFlagMetadata(
      {
        metadata: {
          campaignId: '',
          variationGroupId: '',
          variationId: '',
          slug: '',
          campaignType: '',
          isReference: false
        },
        key,
        hasSameType: true
      }
    )
    expect(metadata).toEqual({
      campaignId: '',
      slug: null,
      variationGroupId: '',
      campaignType: '',
      variationId: '',
      isReference: false
    })
    expect(logInfo).toBeCalledTimes(1)
    expect(logInfo).toBeCalledWith(sprintf(METADATA_PANIC_MODE, visitorId, key, metadata), FLAG_METADATA)
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

  it('test activateModification', async () => {
    await panicStrategy.activateModification('key')

    const methodName = 'activateModification'
    expect(logInfo).toBeCalledTimes(1)
    expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
  })

  it('test userExposed', async () => {
    await panicStrategy.visitorExposed()
    expect(logInfo).toBeCalledTimes(1)
    expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, FLAG_USER_EXPOSED, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), FLAG_USER_EXPOSED)
  })

  it('test activateModifications', async () => {
    await panicStrategy.activateModifications(['key'])
    const methodName = 'activateModifications'
    expect(logInfo).toBeCalledTimes(1)
    expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
  })

  it('test sendHit', async () => {
    await panicStrategy.sendHit({ type: HitType.PAGE, documentLocation: 'home' })
    const methodName = 'sendHit'
    expect(logInfo).toBeCalledTimes(1)
    expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
  })

  it('test sendHits', async () => {
    await panicStrategy.sendHits([{ type: HitType.PAGE, documentLocation: 'home' }])
    const methodName = 'sendHits'
    expect(logInfo).toBeCalledTimes(1)
    expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
  })
})
