import { jest, expect, it, describe } from '@jest/globals'
import { TrackingManager } from '../../src/api/TrackingManager'
import { DecisionApiConfig } from '../../src/config/index'
import { HttpClient } from '../../src/utils/HttpClient'
import { BatchingContinuousCachingStrategy } from '../../src/api/BatchingContinuousCachingStrategy'
import { BatchingPeriodicCachingStrategy } from '../../src/api/BatchingPeriodicCachingStrategy'
import { CacheStrategy, EventCategory, HitCacheDTO, TroubleshootingLabel } from '../../src'
import { FS_CONSENT, HIT_CACHE_VERSION, NO_BATCHING_WITH_CONTINUOUS_CACHING_STRATEGY, PROCESS_CACHE, HIT_CACHE_ERROR, SDK_INFO, LogLevel } from '../../src/enum'
import { NoBatchingContinuousCachingStrategy } from '../../src/api/NoBatchingContinuousCachingStrategy'
import { sprintf, uuidV4 } from '../../src/utils/utils'
import { Segment } from '../../src/hit/Segment'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { Activate } from '../../src/hit/Activate'
import { BatchTriggeredBy } from '../../src/enum/BatchTriggeredBy'
import { Troubleshooting } from '../../src/hit/Troubleshooting'
import { sleep } from '../helpers'
import { Transaction } from '../../src/hit/Transaction'
import { Event } from '../../src/hit/Event'
import { Page } from '../../src/hit/Page'
import { Item } from '../../src/hit/Item'
import { Screen } from '../../src/hit/Screen'

describe('test TrackingManager', () => {
  const httpClient = new HttpClient()

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  const flagshipInstanceId = 'flagshipInstanceId'
  const visitorId = 'visitorId'
  const troubleshootingData = {
    startDate: new Date(),
    endDate: new Date(),
    traffic: 100,
    timezone: ''
  }
  const trackingManager = new TrackingManager(httpClient, config, flagshipInstanceId)
  trackingManager.troubleshootingData = troubleshootingData

  it('Test properties ', async () => {
    expect(config).toBe(trackingManager.config)
    expect(httpClient).toBe(trackingManager.httpClient)
    expect(trackingManager.flagshipInstanceId).toBe(flagshipInstanceId)
    expect(trackingManager.troubleshootingData).toEqual(troubleshootingData)
  })

  it('Test addHit method', async () => {
    const screenHit = new Screen({
      documentLocation: 'variationGrID',
      visitorId
    })

    screenHit.config = config

    await trackingManager.addHit(screenHit)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _hitsPoolQueue = (trackingManager as any)._hitsPoolQueue

    expect(_hitsPoolQueue.size).toBe(1)

    _hitsPoolQueue.clear()
  })

  it('Test activateFlag method', async () => {
    const CampaignHit = new Activate({
      variationGroupId: 'variationGrID',
      variationId: 'varId',
      visitorId,
      flagKey: 'flagKey',
      flagValue: 'value',
      flagDefaultValue: 'default-value',
      flagMetadata: {
        campaignId: 'campaignId',
        variationGroupId: 'variationGrID',
        variationId: 'varId',
        isReference: true,
        campaignType: 'ab',
        slug: 'slug',
        campaignName: 'campaignName',
        variationGroupName: 'variationGroupName',
        variationName: 'variationName'
      },
      visitorContext: { key: 'value' }
    })

    CampaignHit.config = config

    await trackingManager.activateFlag(CampaignHit)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _activatePoolQueue = (trackingManager as any)._activatePoolQueue

    expect(_activatePoolQueue.size).toBe(1)
  })

  it('Test sendBatch method', async () => {
    const postAsync = jest.spyOn(httpClient, 'postAsync')

    postAsync.mockResolvedValue({
      status: 200,
      body: null
    })

    const screenHit = new Screen({
      documentLocation: 'variationGrID',
      visitorId
    })

    screenHit.config = config

    await trackingManager.addHit(screenHit)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _hitsPoolQueue = (trackingManager as any)._hitsPoolQueue

    expect(_hitsPoolQueue.size).toBe(1)

    await trackingManager.sendBatch()

    expect(_hitsPoolQueue.size).toBe(0)
  })
})

describe('test TrackingManager Strategy ', () => {
  const httpClient = new HttpClient()

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })

  it('Test instance of BatchingContinuousCachingStrategy ', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (config.trackingManagerConfig as any)._batchStrategy = CacheStrategy.CONTINUOUS_CACHING
    const trackingManager = new TrackingManager(httpClient, config)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((trackingManager as any).strategy).toBeInstanceOf(BatchingContinuousCachingStrategy)
  })

  it('Test instance of BatchingContinuousCachingStrategy ', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (config.trackingManagerConfig as any)._batchStrategy = CacheStrategy.PERIODIC_CACHING
    const trackingManager = new TrackingManager(httpClient, config)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((trackingManager as any).strategy).toBeInstanceOf(BatchingPeriodicCachingStrategy)
  })

  it('Test instance of BatchingContinuousCachingStrategy ', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (config.trackingManagerConfig as any)._batchStrategy = NO_BATCHING_WITH_CONTINUOUS_CACHING_STRATEGY
    const trackingManager = new TrackingManager(httpClient, config)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((trackingManager as any).strategy).toBeInstanceOf(NoBatchingContinuousCachingStrategy)
  })
})

describe('test TrackingManager Strategy ', () => {
  const httpClient = new HttpClient()

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })

  const trackingManager = new TrackingManager(httpClient, config)

  const strategy = {
    sendBatch: jest.fn(),
    addHit: jest.fn(),
    sendTroubleshootingQueue: jest.fn(),
    sendTroubleshootingHit: jest.fn(),
    sendUsageHitQueue: jest.fn(),
    sendUsageHit: jest.fn()
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trackManagerMock = (trackingManager as any)

  trackManagerMock.strategy = strategy

  const visitorId = 'visitorId'
  const flagshipInstanceId = 'flagshipInstanceId'
  const visitorSessionId = 'visitorSessionId'

  it('Test startBatchingLoop and  stopBatchingLoop methods', async () => {
    const pageHit = new Page({
      documentLocation: 'https://myurl.com',
      visitorId
    })

    pageHit.config = config

    config.trackingManagerConfig.batchIntervals = 1

    await trackingManager.addHit(pageHit)

    trackingManager.startBatchingLoop()

    await sleep(1500)

    trackingManager.stopBatchingLoop()

    expect(strategy.addHit).toBeCalledTimes(1)
    expect(strategy.addHit).toBeCalledWith(pageHit)
    expect(strategy.sendBatch).toBeCalledTimes(1)
    expect(strategy.sendBatch).toBeCalledWith(BatchTriggeredBy.Timer)
    expect(strategy.sendTroubleshootingQueue).toBeCalledTimes(1)
    expect(strategy.sendUsageHitQueue).toBeCalledTimes(1)
  })

  it('Test addTroubleshootingHit methods', async () => {
    const pageHit = new Page({
      documentLocation: 'https://myurl.com',
      visitorId
    })

    const activateTroubleshooting = new Troubleshooting({
      label: TroubleshootingLabel.VISITOR_SEND_ACTIVATE,
      logLevel: LogLevel.INFO,
      traffic: 2,
      visitorId: pageHit.visitorId,
      flagshipInstanceId,
      visitorSessionId,
      anonymousId: pageHit.anonymousId,
      config,
      hitContent: pageHit.toApiKeys()
    })

    pageHit.config = config

    config.trackingManagerConfig.batchIntervals = 1

    await trackingManager.sendTroubleshootingHit(activateTroubleshooting)

    expect(strategy.sendTroubleshootingHit).toBeCalledTimes(1)
    expect(strategy.sendTroubleshootingHit).toBeCalledWith(activateTroubleshooting)
  })

  it('Test sendTroubleshootingHit methods', async () => {
    const pageHit = new Page({
      documentLocation: 'https://myurl.com',
      visitorId
    })

    const analyticHit = new Troubleshooting({
      label: TroubleshootingLabel.VISITOR_FETCH_CAMPAIGNS,
      logLevel: LogLevel.INFO,
      traffic: 2,
      visitorId: pageHit.visitorId,
      flagshipInstanceId,
      visitorSessionId,
      anonymousId: pageHit.anonymousId,
      config,
      hitContent: pageHit.toApiKeys()
    })

    pageHit.config = config

    await trackingManager.sendUsageHit(analyticHit)

    expect(strategy.sendUsageHit).toBeCalledTimes(1)
    expect(strategy.sendUsageHit).toBeCalledWith(analyticHit)
  })

  it('Test batchingLoop methods', async () => {
    const pageHit = new Page({
      documentLocation: 'https://myurl.com',
      visitorId
    })

    pageHit.config = config

    config.trackingManagerConfig.batchIntervals = 1

    await trackingManager.addHit(pageHit)

    await Promise.all([trackManagerMock.batchingLoop(), trackManagerMock.batchingLoop()])

    expect(strategy.addHit).toBeCalledTimes(1)
    expect(strategy.addHit).toBeCalledWith(pageHit)
    expect(strategy.sendBatch).toBeCalledTimes(1)
    expect(strategy.sendBatch).toBeCalledWith(BatchTriggeredBy.Timer)
    expect(strategy.sendTroubleshootingQueue).toBeCalledTimes(1)
    expect(strategy.sendUsageHitQueue).toBeCalledTimes(1)
  })
})

describe('test TrackingManager lookupHits', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getNull:()=>any = () => null
  const httpClient = new HttpClient()

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })

  const visitorId = 'visitorId'
  const anonymousId = 'anonymousId'

  const trackingManager = new TrackingManager(httpClient, config)

  const flushHits = jest.fn<typeof config.hitCacheImplementation.flushHits>()
  const lookupHits = jest.fn<typeof config.hitCacheImplementation.lookupHits>()
  const cacheHit = jest.fn<typeof config.hitCacheImplementation.cacheHit>()
  const flushAllHits = jest.fn<typeof config.hitCacheImplementation.flushAllHits>()
  const hitCacheImplementation = {
    cacheHit,
    lookupHits,
    flushHits,
    flushAllHits
  }
  config.hitCacheImplementation = hitCacheImplementation

  it('test lookupHits success', async () => {
    const campaignHit = new Activate({
      variationGroupId: 'variationGrID',
      variationId: 'campaignID',
      visitorId,
      flagKey: 'flagKey',
      flagValue: 'value',
      flagDefaultValue: 'default-value',
      flagMetadata: {
        campaignId: 'campaignId',
        variationGroupId: 'variationGrID',
        variationId: 'varId',
        isReference: true,
        campaignType: 'ab',
        slug: 'slug',
        campaignName: 'campaignName',
        variationGroupName: 'variationGroupName',
        variationName: 'variationName'
      },
      visitorContext: { key: 'value' }
    })

    const consentHit = new Event({
      visitorId,
      label: `${SDK_INFO.name}:${true}`,
      action: FS_CONSENT,
      category: EventCategory.USER_ENGAGEMENT
    })

    const eventHit = new Event({
      category: EventCategory.ACTION_TRACKING,
      action: 'click',
      visitorId
    })

    const itemHit = new Item({
      transactionId: 'transactionId',
      productName: 'productName',
      productSku: 'productSku',
      visitorId
    })

    const pageHit = new Page({
      documentLocation: 'http://127.0.0.1:5500',
      visitorId
    })

    const screenHit = new Screen({
      documentLocation: 'home',
      visitorId
    })

    const segmentHit = new Segment({
      context: {
        any: 'value'
      },
      visitorId
    })

    const transactionHit = new Transaction({
      transactionId: 'transactionId',
      affiliation: 'affiliation',
      visitorId
    })

    const activate = new Activate({
      visitorId,
      variationGroupId: 'varGrId',
      variationId: 'varId',
      flagKey: 'flagKey',
      flagValue: 'value',
      flagDefaultValue: 'default-value',
      flagMetadata: {
        campaignId: 'campaignId',
        variationGroupId: 'variationGrID',
        variationId: 'varId',
        isReference: true,
        campaignType: 'ab',
        slug: 'slug',
        campaignName: 'campaignName',
        variationGroupName: 'variationGroupName',
        variationName: 'variationName'
      },
      visitorContext: { key: 'value' }
    })

    const hits = [campaignHit, consentHit, eventHit, itemHit, pageHit, screenHit, segmentHit, transactionHit, activate]
    const data:Record<string, HitCacheDTO> = {}

    hits.forEach(hit => {
      hit.anonymousId = anonymousId
      hit.visitorId = visitorId
      hit.config = config

      const hitData: HitCacheDTO = {
        version: HIT_CACHE_VERSION,
        data: {
          visitorId,
          anonymousId,
          type: hit.type,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: hit.toObject() as any,
          time: Date.now()
        }
      }

      data[uuidV4()] = hitData
    })

    const wrongKey1 = uuidV4()

    data[wrongKey1] = {
      version: HIT_CACHE_VERSION,
      data: {
        visitorId,
        anonymousId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: 'any' as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: {} as any,
        time: Date.now()
      }
    }

    const wrongKey2 = uuidV4()

    data[wrongKey2] = {
      version: HIT_CACHE_VERSION,
      data: {
        visitorId,
        anonymousId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: getNull() as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: getNull() as any,
        time: Date.now()
      }
    }

    lookupHits.mockResolvedValue(data)
    await trackingManager.lookupHits()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _hitsPoolQueue = (trackingManager as any)._hitsPoolQueue

    expect(_hitsPoolQueue.size).toBe(7)

    expect(lookupHits).toBeCalledTimes(1)

    expect(flushHits).toBeCalledTimes(1)
    expect(flushHits).toBeCalledWith([wrongKey1, wrongKey2])
  })

  it('test lookupHits error ', async () => {
    const logManager = new FlagshipLogManager()
    const logError = jest.spyOn(logManager, 'error')
    const error = new Error('message error')
    lookupHits.mockRejectedValue(error)
    config.hitCacheImplementation = getNull()
    const trackingManager = new TrackingManager(httpClient, config)
    config.logManager = logManager
    config.hitCacheImplementation = hitCacheImplementation
    await trackingManager.lookupHits()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _hitsPoolQueue = (trackingManager as any)._hitsPoolQueue

    expect(_hitsPoolQueue.size).toBe(0)

    expect(lookupHits).toBeCalledTimes(1)

    expect(flushHits).toBeCalledTimes(0)

    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(HIT_CACHE_ERROR, 'lookupHits', error.message), PROCESS_CACHE)
  })

  it('test lookupHits empty ', async () => {
    lookupHits.mockResolvedValue({})
    config.hitCacheImplementation = getNull()
    const trackingManager = new TrackingManager(httpClient, config)
    config.hitCacheImplementation = hitCacheImplementation
    await trackingManager.lookupHits()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _hitsPoolQueue = (trackingManager as any)._hitsPoolQueue

    expect(_hitsPoolQueue.size).toBe(0)

    expect(lookupHits).toBeCalledTimes(1)

    expect(flushHits).toBeCalledTimes(0)
  })
})
