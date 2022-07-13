import { jest, expect, it, describe, beforeAll, afterAll } from '@jest/globals'
import { Mock } from 'jest-mock'
import { HitAbstract, HitCacheDTO, Page } from '../../src'
import { BatchingContinuousCachingStrategy } from '../../src/api/BatchingContinuousCachingStrategy'
import { DecisionApiConfig } from '../../src/config/DecisionApiConfig'
import { BASE_API_URL, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_ENV_ID, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, HIT_CACHE_VERSION, HIT_EVENT_URL, PROCESS_CACHE_HIT, PROCESS_FLUSH_HIT, SDK_LANGUAGE, SDK_VERSION, SEND_ACTIVATE, SEND_BATCH, URL_ACTIVATE_MODIFICATION } from '../../src/enum/FlagshipConstant'
import { Activate } from '../../src/hit/Activate'
import { Batch } from '../../src/hit/Batch'
import { Campaign } from '../../src/hit/Campaign'
import { Consent } from '../../src/hit/Consent'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient } from '../../src/utils/HttpClient'
import { errorFormat } from '../../src/utils/utils'

describe('Test BatchingContinuousCachingStrategy', () => {
  const visitorId = 'visitorId'
  it('test addHit method', async () => {
    const httpClient = new HttpClient()
    const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
    const hitsPoolQueue = new Map<string, HitAbstract>()
    const batchingStrategy = new BatchingContinuousCachingStrategy(config, httpClient, hitsPoolQueue)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cacheHit = jest.spyOn(batchingStrategy as any, 'cacheHit')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flushHits = jest.spyOn(batchingStrategy as any, 'flushHits')

    const campaignHit = new Campaign({
      variationGroupId: 'variationGrID',
      campaignId: 'campaignID',
      visitorId
    })

    await batchingStrategy.addHit(campaignHit)

    expect(hitsPoolQueue.size).toBe(1)
    expect(cacheHit).toBeCalledTimes(1)
    expect(cacheHit).toHaveBeenNthCalledWith(1, new Map().set(expect.stringContaining(visitorId), campaignHit))

    const consentHit = new Consent({
      visitorConsent: true,
      visitorId
    })

    consentHit.visitorId = visitorId

    await batchingStrategy.addHit(consentHit)

    expect(hitsPoolQueue.size).toBe(2)
    expect(cacheHit).toBeCalledTimes(2)
    expect(cacheHit).toHaveBeenNthCalledWith(2, new Map().set(expect.stringContaining(visitorId), consentHit))

    const pageHit = new Page({
      documentLocation: 'http://127.0.0.1:5500',
      visitorId
    })

    pageHit.visitorId = visitorId

    await batchingStrategy.addHit(pageHit)

    expect(hitsPoolQueue.size).toBe(3)
    expect(cacheHit).toBeCalledTimes(3)
    expect(cacheHit).toHaveBeenNthCalledWith(3, new Map().set(expect.stringContaining(visitorId), pageHit))

    const consentHitFalse1 = new Consent({
      visitorConsent: false,
      visitorId
    })

    consentHitFalse1.visitorId = 'newVisitor'

    await batchingStrategy.addHit(consentHitFalse1)

    expect(hitsPoolQueue.size).toBe(4)
    expect(cacheHit).toBeCalledTimes(4)
    expect(cacheHit).toHaveBeenNthCalledWith(4, new Map().set(expect.stringContaining('newVisitor'), consentHitFalse1))
    expect(flushHits).toBeCalledTimes(0)

    const consentHitFalse2 = new Consent({
      visitorConsent: false,
      visitorId
    })

    consentHitFalse2.visitorId = visitorId

    await batchingStrategy.addHit(consentHitFalse2)

    expect(hitsPoolQueue.size).toBe(3)
    expect(cacheHit).toBeCalledTimes(5)
    expect(cacheHit).toHaveBeenNthCalledWith(5, new Map().set(expect.stringContaining(visitorId), consentHitFalse2))
    expect(flushHits).toBeCalledTimes(1)
    expect(flushHits).toHaveBeenNthCalledWith(1, expect.arrayContaining([expect.stringContaining(visitorId)]))
  })
})

describe('test sendBatch method', () => {
  const methodNow = Date.now
  const mockNow:Mock<number, []> = jest.fn()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })

  const httpClient = new HttpClient()

  const postAsync = jest.spyOn(httpClient, 'postAsync')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

  config.logManager = logManager

  const hitsPoolQueue = new Map<string, HitAbstract>()
  const batchingStrategy = new BatchingContinuousCachingStrategy(config, httpClient, hitsPoolQueue)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cacheHit = jest.spyOn(batchingStrategy as any, 'cacheHit')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flushHits = jest.spyOn(batchingStrategy as any, 'flushHits')

  const visitorId = 'visitorId'

  const globalCampaignHit = new Campaign({
    variationGroupId: 'variationGrID21',
    campaignId: 'campaignID21',
    visitorId
  })

  const headers = {
    [HEADER_X_API_KEY]: `${config.apiKey}`,
    [HEADER_X_ENV_ID]: `${config.envId}`,
    [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE.name,
    [HEADER_X_SDK_VERSION]: SDK_VERSION,
    [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
  }

  const headersActivate = {
    [HEADER_X_API_KEY]: `${config.apiKey}`,
    [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE.name,
    [HEADER_X_SDK_VERSION]: SDK_VERSION,
    [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
  }

  const urlActivate = `${BASE_API_URL}${URL_ACTIVATE_MODIFICATION}`
  it('test sendBatch method success', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    postAsync.mockResolvedValue({ status: 200, body: null })

    const batch:Batch = new Batch({ hits: [] })
    batch.config = config

    for (let index = 0; index < 20; index++) {
      const campaignHit = new Campaign({
        variationGroupId: 'variationGrID' + index,
        campaignId: 'campaignID' + index,
        visitorId
      })

      batch.hits.push(campaignHit)

      await batchingStrategy.addHit(campaignHit)
    }

    await batchingStrategy.addHit(globalCampaignHit)

    const activateHit = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate',
      variationId: 'variationId'
    })
    activateHit.config = config
    await batchingStrategy.addHit(activateHit)

    expect(hitsPoolQueue.size).toBe(22)

    await batchingStrategy.sendBatch()

    expect(hitsPoolQueue.size).toBe(2)

    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toHaveBeenNthCalledWith(1, HIT_EVENT_URL, { headers, body: batch.toApiKeys() })
    expect(flushHits).toBeCalledTimes(1)
    expect(flushHits).toHaveBeenCalledWith(expect.arrayContaining([expect.stringContaining(visitorId)]))

    await batchingStrategy.sendBatch()

    expect(postAsync).toBeCalledTimes(3)

    expect(postAsync).toHaveBeenNthCalledWith(2, urlActivate, { headers: headersActivate, body: activateHit.toApiKeys() })

    const newBatch = new Batch({ hits: [globalCampaignHit] })
    newBatch.config = config

    expect(postAsync).toHaveBeenNthCalledWith(3, HIT_EVENT_URL, { headers, body: newBatch.toApiKeys() })
    expect(flushHits).toBeCalledTimes(3)
  })

  it('test sendBatch method throw exception ', async () => {
    const error = 'message error'
    postAsync.mockRejectedValue(error)

    const batch:Batch = new Batch({ hits: [globalCampaignHit] })
    batch.config = config
    hitsPoolQueue.set(globalCampaignHit.key, globalCampaignHit)

    await batchingStrategy.sendBatch()

    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toBeCalledWith(HIT_EVENT_URL, { headers, body: batch.toApiKeys() })
    expect(flushHits).toBeCalledTimes(0)

    expect(cacheHit).toBeCalledTimes(1)
    expect(cacheHit).toBeCalledWith(new Map().set(expect.stringContaining(visitorId), globalCampaignHit))
    expect(hitsPoolQueue.size).toBe(1)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(errorFormat(error, {
      url: HIT_EVENT_URL,
      headers,
      body: batch.toApiKeys()
    }), SEND_BATCH)
  })

  it('test sendActivate method throw exception ', async () => {
    const error = 'message error'
    postAsync.mockRejectedValue(error)

    const activateHit = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate',
      variationId: 'variationId'
    })
    activateHit.config = config
    activateHit.key = visitorId

    hitsPoolQueue.clear()

    hitsPoolQueue.set(activateHit.key, activateHit)

    await batchingStrategy.sendBatch()

    expect(postAsync).toBeCalledTimes(1)
    expect(flushHits).toBeCalledTimes(0)

    expect(cacheHit).toBeCalledTimes(1)
    expect(cacheHit).toBeCalledWith(new Map().set(expect.stringContaining(visitorId), activateHit))
    expect(hitsPoolQueue.size).toBe(1)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(errorFormat(error, {
      url: urlActivate,
      headers: headersActivate,
      body: activateHit.toApiKeys()
    }), SEND_ACTIVATE)
  })

  it('test sendBatch method with empty hitsPoolQueue', async () => {
    const hitsPoolQueue = new Map<string, HitAbstract>()
    const batchingStrategy = new BatchingContinuousCachingStrategy(config, httpClient, hitsPoolQueue)
    await batchingStrategy.sendBatch()
    expect(postAsync).toBeCalledTimes(0)
  })
})

describe('test cacheHit and flushHits methods', () => {
  const methodNow = Date.now
  const mockNow:Mock<number, []> = jest.fn()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })

  const httpClient = new HttpClient()

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  const flushHits:Mock<Promise<void>, [hitKeys: string[]]> = jest.fn()
  const lookupHits:Mock<Promise<Record<string, HitCacheDTO>>, []> = jest.fn()
  const cacheHit:Mock<Promise<void>, [Record<string, HitCacheDTO>]> = jest.fn()
  const hitCacheImplementation = {
    cacheHit,
    lookupHits,
    flushHits
  }
  config.hitCacheImplementation = hitCacheImplementation
  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

  config.logManager = logManager

  const hitsPoolQueue = new Map<string, HitAbstract>()
  const batchingStrategy = new BatchingContinuousCachingStrategy(config, httpClient, hitsPoolQueue)
  const visitorId = 'visitorId'
  it('test cacheHit success ', async () => {
    cacheHit.mockResolvedValue()
    const campaignHit = new Campaign({
      variationGroupId: 'variationGrID',
      campaignId: 'campaignID',
      visitorId
    })

    campaignHit.visitorId = visitorId
    campaignHit.key = 'key'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (batchingStrategy as any).cacheHit(new Map().set(campaignHit.key, campaignHit))

    const cacheData = {
      version: HIT_CACHE_VERSION,
      data: {
        visitorId: campaignHit.visitorId,
        anonymousId: campaignHit.anonymousId,
        type: campaignHit.type,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: campaignHit.toObject() as any,
        time: Date.now()
      }
    }

    expect(cacheHit).toBeCalledTimes(1)
    expect(cacheHit).toBeCalledWith({ [campaignHit.key]: cacheData })
  })

  it('test cacheHit throw exception', async () => {
    const error = 'message'
    cacheHit.mockRejectedValue(error)
    const campaignHit = new Campaign({
      variationGroupId: 'variationGrID',
      campaignId: 'campaignID',
      visitorId
    })

    campaignHit.visitorId = visitorId
    campaignHit.key = 'key'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (batchingStrategy as any).cacheHit(new Map().set(campaignHit.key, campaignHit))

    expect(cacheHit).toBeCalledTimes(1)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(error, PROCESS_CACHE_HIT)
  })

  it('test flushHits method', async () => {
    const keys = ['key1', 'key2']
    await batchingStrategy.flushHits(keys)
    expect(flushHits).toBeCalledTimes(1)
    expect(flushHits).toBeCalledWith(keys)
  })

  it('test flushHits method throw exception', async () => {
    const error = 'message'
    flushHits.mockRejectedValue(error)
    const keys = ['key1', 'key2']
    await batchingStrategy.flushHits(keys)
    expect(flushHits).toBeCalledTimes(1)
    expect(flushHits).toBeCalledWith(keys)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(error, PROCESS_FLUSH_HIT)
  })
})
