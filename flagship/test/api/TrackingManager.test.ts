import { jest, expect, it, describe } from '@jest/globals'
import { TrackingManager } from '../../src/api/TrackingManager'
import { DecisionApiConfig } from '../../src/config/index'
import { HttpClient } from '../../src/utils/HttpClient'
import { Campaign } from '../../src/hit/Campaign'
import { BatchingContinuousCachingStrategy } from '../../src/api/BatchingContinuousCachingStrategy'
import { BatchingPeriodicCachingStrategy } from '../../src/api/BatchingPeriodicCachingStrategy'
import { BatchStrategy, Event, EventCategory, HitCacheDTO, Item, Page, Screen, Transaction } from '../../src'
import { HIT_CACHE_VERSION, NO_BATCHING_WITH_CONTINUOUS_CACHING_STRATEGY } from '../../src/enum'
import { NoBatchingContinuousCachingStrategy } from '../../src/api/NoBatchingContinuousCachingStrategy'
import { sleep, uuidV4 } from '../../src/utils/utils'
import { Mock } from 'jest-mock'
import { Consent } from '../../src/hit/Consent'
import { Segment } from '../../src/hit/Segment'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'

describe('test TrackingManager', () => {
  const httpClient = new HttpClient()

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })

  const trackingManager = new TrackingManager(httpClient, config)

  it('Test properties ', async () => {
    expect(config).toBe(trackingManager.config)
    expect(httpClient).toBe(trackingManager.httpClient)
  })

  it('Test addHit method', async () => {
    const CampaignHit = new Campaign({
      variationGroupId: 'variationGrID',
      campaignId: 'campaignID'
    })

    await trackingManager.addHit(CampaignHit)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _hitsPoolQueue = (trackingManager as any)._hitsPoolQueue

    expect(_hitsPoolQueue.size).toBe(1)
  })
})

describe('test TrackingManager Strategy ', () => {
  const httpClient = new HttpClient()

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })

  it('Test instance of BatchingContinuousCachingStrategy ', async () => {
    const trackingManager = new TrackingManager(httpClient, config)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((trackingManager as any).strategy).toBeInstanceOf(BatchingContinuousCachingStrategy)
  })

  it('Test instance of BatchingContinuousCachingStrategy ', async () => {
    config.trackingMangerConfig.batchStrategy = BatchStrategy.BATCHING_WITH_PERIODIC_CACHING_STRATEGY
    const trackingManager = new TrackingManager(httpClient, config)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((trackingManager as any).strategy).toBeInstanceOf(BatchingPeriodicCachingStrategy)
  })

  it('Test instance of BatchingContinuousCachingStrategy ', async () => {
    config.trackingMangerConfig.batchStrategy = NO_BATCHING_WITH_CONTINUOUS_CACHING_STRATEGY
    const trackingManager = new TrackingManager(httpClient, config)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((trackingManager as any).strategy).toBeInstanceOf(NoBatchingContinuousCachingStrategy)
  })
})

describe('test TrackingManager Strategy ', () => {
  const httpClient = new HttpClient()

  const postAsync = jest.spyOn(httpClient, 'postAsync')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })

  const trackingManager = new TrackingManager(httpClient, config)

  it('Test startBatchingLoop and  stopBatchingLoop methods', async () => {
    postAsync.mockImplementation(async () => {
      await sleep(250)
      return { status: 200, body: null }
    })
    const CampaignHit = new Campaign({
      variationGroupId: 'variationGrID',
      campaignId: 'campaignID'
    })
    config.trackingMangerConfig.batchIntervals = 0.2

    await trackingManager.addHit(CampaignHit)

    trackingManager.startBatchingLoop()

    await sleep(500)

    trackingManager.stopBatchingLoop()

    expect(postAsync).toBeCalledTimes(1)
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

  const flushHits:Mock<Promise<void>, [hitKeys: string[]]> = jest.fn()
  const lookupHits:Mock<Promise<Record<string, HitCacheDTO>>, []> = jest.fn()
  const cacheHit:Mock<Promise<void>, [Record<string, HitCacheDTO>]> = jest.fn()
  const hitCacheImplementation = {
    cacheHit,
    lookupHits,
    flushHits
  }
  config.hitCacheImplementation = hitCacheImplementation

  it('test lookupHits', async () => {
    const campaignHit = new Campaign({
      variationGroupId: 'variationGrID',
      campaignId: 'campaignID'
    })

    const consentHit = new Consent({
      visitorConsent: true
    })

    const eventHit = new Event({
      category: EventCategory.ACTION_TRACKING,
      action: 'click'
    })

    const itemHit = new Item({
      transactionId: 'transactionId',
      productName: 'productName',
      productSku: 'productSku'
    })

    const pageHit = new Page({
      documentLocation: 'http://127.0.0.1:5500'
    })

    const screenHit = new Screen({
      documentLocation: 'home'
    })

    const segmentHit = new Segment({
      sl: {
        any: 'value'
      }
    })

    const transactionHit = new Transaction({
      transactionId: 'transactionId',
      affiliation: 'affiliation'
    })

    const hits = [campaignHit, consentHit, eventHit, itemHit, pageHit, screenHit, segmentHit, transactionHit]
    const data:Record<string, HitCacheDTO> = {}

    hits.forEach(hit => {
      hit.anonymousId = anonymousId
      hit.visitorId = visitorId
      hit.config = config

      const hitData: HitCacheDTO = {
        version: HIT_CACHE_VERSION,
        data: {
          visitorId: visitorId,
          anonymousId: anonymousId,
          type: hit.type,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: hit.toObject() as any,
          time: Date.now()
        }
      }

      data[uuidV4()] = hitData
    })

    data[uuidV4()] = {
      version: HIT_CACHE_VERSION,
      data: {
        visitorId: visitorId,
        anonymousId: anonymousId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: 'any' as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: {} as any,
        time: Date.now()
      }
    }

    const wrongKey = uuidV4()

    data[wrongKey] = {
      version: HIT_CACHE_VERSION,
      data: {
        visitorId: visitorId,
        anonymousId: anonymousId,
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

    expect(_hitsPoolQueue.size).toBe(8)

    expect(lookupHits).toBeCalledTimes(1)

    expect(flushHits).toBeCalledTimes(1)
    expect(flushHits).toBeCalledWith([wrongKey])
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
    expect(logError).toBeCalledWith(error.message, 'lookupHits')
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
