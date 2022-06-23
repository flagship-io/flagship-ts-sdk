import { jest, expect, it, describe, beforeAll, afterAll } from '@jest/globals'
import { Mock } from 'jest-mock'
import { DecisionApiConfig, HitAbstract, Page } from '../../src'
import { NoBatchingContinuousCachingStrategy } from '../../src/api/NoBatchingContinuousCachingStrategy'
import { HEADER_X_API_KEY, HEADER_X_ENV_ID, HEADER_X_SDK_CLIENT, SDK_LANGUAGE, HEADER_X_SDK_VERSION, SDK_VERSION, HEADER_CONTENT_TYPE, HEADER_APPLICATION_JSON, HIT_EVENT_URL, SEND_BATCH } from '../../src/enum'
import { Batch } from '../../src/hit/Batch'
import { Campaign } from '../../src/hit/Campaign'
import { Consent } from '../../src/hit/Consent'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient } from '../../src/utils/HttpClient'
import { errorFormat, uuidV4 } from '../../src/utils/utils'

describe('Test NoBatchingContinuousCachingStrategy', () => {
  const methodNow = Date.now
  const mockNow:Mock<number, []> = jest.fn()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })
  const visitorId = 'visitorId'
  const httpClient = new HttpClient()
  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })

  const postAsync = jest.spyOn(httpClient, 'postAsync')

  const headers = {
    [HEADER_X_API_KEY]: `${config.apiKey}`,
    [HEADER_X_ENV_ID]: `${config.envId}`,
    [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE.name,
    [HEADER_X_SDK_VERSION]: SDK_VERSION,
    [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
  }
  it('test addHit method', async () => {
    postAsync.mockResolvedValue({ status: 200, body: null })
    const hitsPoolQueue = new Map<string, HitAbstract>()
    const batchingStrategy = new NoBatchingContinuousCachingStrategy(config, httpClient, hitsPoolQueue)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cacheHit = jest.spyOn(batchingStrategy as any, 'cacheHit')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flushHits = jest.spyOn(batchingStrategy as any, 'flushHits')

    const campaignHit = new Campaign({
      variationGroupId: 'variationGrID',
      campaignId: 'campaignID'
    })
    campaignHit.visitorId = visitorId
    campaignHit.config = config

    await batchingStrategy.addHit(campaignHit)

    expect(postAsync).toHaveBeenCalledTimes(1)
    expect(postAsync).toHaveBeenNthCalledWith(1, HIT_EVENT_URL, {
      headers,
      body: campaignHit.toApiKeys()
    })
    expect(hitsPoolQueue.size).toBe(0)
    expect(cacheHit).toBeCalledTimes(1)
    expect(cacheHit).toHaveBeenNthCalledWith(1, new Map().set(expect.stringContaining(visitorId), campaignHit))
    expect(flushHits).toBeCalledTimes(1)
    expect(flushHits).toHaveBeenNthCalledWith(1, [expect.stringContaining(visitorId)])

    const consentHit = new Consent({
      visitorConsent: true
    })

    consentHit.visitorId = visitorId

    await batchingStrategy.addHit(consentHit)

    expect(postAsync).toHaveBeenCalledTimes(2)
    expect(postAsync).toHaveBeenNthCalledWith(2, HIT_EVENT_URL, {
      headers,
      body: consentHit.toApiKeys()
    })
    expect(hitsPoolQueue.size).toBe(0)
    expect(cacheHit).toBeCalledTimes(2)
    expect(cacheHit).toHaveBeenNthCalledWith(2, new Map().set(expect.stringContaining(visitorId), consentHit))
    expect(flushHits).toBeCalledTimes(2)
    expect(flushHits).toHaveBeenNthCalledWith(2, [expect.stringContaining(visitorId)])

    const pageHit = new Page({
      documentLocation: 'http://127.0.0.1:5500'
    })
    pageHit.visitorId = visitorId
    pageHit.config = config

    await batchingStrategy.addHit(pageHit)

    expect(postAsync).toHaveBeenCalledTimes(3)
    expect(postAsync).toHaveBeenNthCalledWith(3, HIT_EVENT_URL, {
      headers,
      body: pageHit.toApiKeys()
    })
    expect(hitsPoolQueue.size).toBe(0)
    expect(cacheHit).toBeCalledTimes(3)
    expect(cacheHit).toHaveBeenNthCalledWith(3, new Map().set(expect.stringContaining(visitorId), pageHit))
    expect(flushHits).toBeCalledTimes(3)
    expect(flushHits).toHaveBeenNthCalledWith(3, [expect.stringContaining(visitorId)])

    const consentHitFalse = new Consent({
      visitorConsent: false
    })

    consentHitFalse.visitorId = visitorId

    await batchingStrategy.addHit(consentHitFalse)

    expect(hitsPoolQueue.size).toBe(0)
    expect(cacheHit).toBeCalledTimes(4)
    expect(cacheHit).toHaveBeenNthCalledWith(4, new Map().set(expect.stringContaining(visitorId), consentHitFalse))
    expect(flushHits).toBeCalledTimes(4)
    expect(flushHits).toHaveBeenNthCalledWith(4, [expect.stringContaining(visitorId)])
  })

  it('test addHit method throw error', async () => {
    const error = 'message error'
    postAsync.mockRejectedValue(error)

    const hitsPoolQueue = new Map<string, HitAbstract>()
    const batchingStrategy = new NoBatchingContinuousCachingStrategy(config, httpClient, hitsPoolQueue)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cacheHit = jest.spyOn(batchingStrategy as any, 'cacheHit')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flushHits = jest.spyOn(batchingStrategy as any, 'flushHits')

    const campaignHit = new Campaign({
      variationGroupId: 'variationGrID',
      campaignId: 'campaignID'
    })
    campaignHit.visitorId = visitorId
    campaignHit.config = config

    await batchingStrategy.addHit(campaignHit)

    expect(postAsync).toHaveBeenCalledTimes(1)
    expect(postAsync).toHaveBeenNthCalledWith(1, HIT_EVENT_URL, {
      headers,
      body: campaignHit.toApiKeys()
    })
    expect(hitsPoolQueue.size).toBe(0)
    expect(cacheHit).toBeCalledTimes(1)
    expect(cacheHit).toHaveBeenNthCalledWith(1, new Map().set(expect.stringContaining(visitorId), campaignHit))
    expect(flushHits).toBeCalledTimes(0)

    const consentHitFalse = new Consent({
      visitorConsent: false
    })

    consentHitFalse.visitorId = visitorId

    await batchingStrategy.addHit(consentHitFalse)
    expect(hitsPoolQueue.size).toBe(0)
    expect(cacheHit).toBeCalledTimes(2)
    expect(cacheHit).toHaveBeenNthCalledWith(2, new Map().set(expect.stringContaining(visitorId), consentHitFalse))
    expect(flushHits).toBeCalledTimes(1)
    expect(flushHits).toHaveBeenNthCalledWith(1, [expect.stringContaining(visitorId)])
  })

  it('test addHit method throw error', async () => {
    const error = 'message error'
    postAsync.mockRejectedValue(error)

    const hitsPoolQueue = new Map<string, HitAbstract>()
    const batchingStrategy = new NoBatchingContinuousCachingStrategy(config, httpClient, hitsPoolQueue)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cacheHit = jest.spyOn(batchingStrategy as any, 'cacheHit')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flushHits = jest.spyOn(batchingStrategy as any, 'flushHits')

    const campaignHit = new Campaign({
      variationGroupId: 'variationGrID',
      campaignId: 'campaignID'
    })
    campaignHit.visitorId = visitorId
    campaignHit.config = config

    await batchingStrategy.addHit(campaignHit)

    expect(postAsync).toHaveBeenCalledTimes(1)
    expect(postAsync).toHaveBeenNthCalledWith(1, HIT_EVENT_URL, {
      headers,
      body: campaignHit.toApiKeys()
    })
    expect(hitsPoolQueue.size).toBe(0)
    expect(cacheHit).toBeCalledTimes(1)
    expect(cacheHit).toHaveBeenNthCalledWith(1, new Map().set(expect.stringContaining(visitorId), campaignHit))
    expect(flushHits).toBeCalledTimes(0)

    const consentHitLoaded = new Consent({
      visitorConsent: true
    })

    const campaignHitLoaded = new Campaign({
      variationGroupId: 'variationGrID',
      campaignId: 'campaignID'
    })

    hitsPoolQueue.set(`${visitorId}:${uuidV4()}`, consentHitLoaded).set(`${visitorId}:${uuidV4()}`, campaignHitLoaded)

    expect(hitsPoolQueue.size).toBe(2)

    const consentHitFalse = new Consent({
      visitorConsent: false
    })

    consentHitFalse.visitorId = visitorId

    await batchingStrategy.addHit(consentHitFalse)
    expect(hitsPoolQueue.size).toBe(1)
    expect(cacheHit).toBeCalledTimes(2)
    expect(cacheHit).toHaveBeenNthCalledWith(2, new Map().set(expect.stringContaining(visitorId), consentHitFalse))
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
  const batchingStrategy = new NoBatchingContinuousCachingStrategy(config, httpClient, hitsPoolQueue)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cacheHit = jest.spyOn(batchingStrategy as any, 'cacheHit')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flushHits = jest.spyOn(batchingStrategy as any, 'flushHits')

  const visitorId = 'visitorId'

  const globalCampaignHit = new Campaign({
    variationGroupId: 'variationGrID21',
    campaignId: 'campaignID21'
  })

  globalCampaignHit.visitorId = visitorId
  globalCampaignHit.key = `${visitorId}:${uuidV4()}`

  const headers = {
    [HEADER_X_API_KEY]: `${config.apiKey}`,
    [HEADER_X_ENV_ID]: `${config.envId}`,
    [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE.name,
    [HEADER_X_SDK_VERSION]: SDK_VERSION,
    [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
  }
  it('test sendBatch method success', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    postAsync.mockResolvedValue({ status: 200, body: null })

    const batch:Batch = new Batch({ hits: [] })
    batch.config = config

    for (let index = 0; index < 20; index++) {
      const key = `${visitorId}:${uuidV4()}`
      const campaignHit = new Campaign({
        variationGroupId: 'variationGrID' + index,
        campaignId: 'campaignID' + index
      })
      campaignHit.key = key
      campaignHit.visitorId = visitorId

      batch.hits.push(campaignHit)
      hitsPoolQueue.set(key, campaignHit)
    }

    hitsPoolQueue.set(globalCampaignHit.key, globalCampaignHit)

    expect(hitsPoolQueue.size).toBe(21)

    await batchingStrategy.sendBatch()

    expect(hitsPoolQueue.size).toBe(1)

    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toBeCalledWith(HIT_EVENT_URL, { headers, body: batch.toApiKeys() })
    expect(flushHits).toBeCalledTimes(1)
    expect(flushHits).toHaveBeenCalledWith(expect.arrayContaining([expect.stringContaining(visitorId)]))
  })

  it('test sendBatch method throw exception ', async () => {
    const error = 'message error'
    postAsync.mockRejectedValue(error)

    const batch:Batch = new Batch({ hits: [globalCampaignHit] })
    batch.config = config

    await batchingStrategy.sendBatch()

    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toBeCalledWith(HIT_EVENT_URL, { headers, body: batch.toApiKeys() })
    expect(flushHits).toBeCalledTimes(0)

    expect(cacheHit).toBeCalledTimes(0)
    expect(hitsPoolQueue.size).toBe(1)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(errorFormat(error, {
      url: HIT_EVENT_URL,
      headers,
      body: batch.toApiKeys()
    }), SEND_BATCH)
  })

  it('test sendBatch method with empty hitsPoolQueue', async () => {
    const hitsPoolQueue = new Map<string, HitAbstract>()
    const batchingStrategy = new NoBatchingContinuousCachingStrategy(config, httpClient, hitsPoolQueue)
    await batchingStrategy.sendBatch()
    expect(postAsync).toBeCalledTimes(0)
  })
})
