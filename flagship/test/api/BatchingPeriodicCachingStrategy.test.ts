import { jest, expect, it, describe, beforeAll, afterAll } from '@jest/globals'
import { Mock } from 'jest-mock'
import { BatchingPeriodicCachingStrategy } from '../../src/api/BatchingPeriodicCachingStrategy'
import { DecisionApiConfig } from '../../src/config/DecisionApiConfig'
import { HEADER_X_API_KEY, HEADER_X_ENV_ID, HEADER_X_SDK_CLIENT, SDK_LANGUAGE, HEADER_X_SDK_VERSION, SDK_VERSION, HEADER_CONTENT_TYPE, HEADER_APPLICATION_JSON, HIT_EVENT_URL } from '../../src/enum'
import { Batch } from '../../src/hit/Batch'
import { Campaign } from '../../src/hit/Campaign'
import { Consent } from '../../src/hit/Consent'
import { HitAbstract } from '../../src/hit/HitAbstract'
import { Page } from '../../src/hit/Page'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient } from '../../src/utils/HttpClient'
describe('Test BatchingPeriodicCachingStrategy', () => {
  const visitorId = 'visitorId'
  it('test addHit method', async () => {
    const httpClient = new HttpClient()
    const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
    const hitsPoolQueue = new Map<string, HitAbstract>()
    const batchingStrategy = new BatchingPeriodicCachingStrategy(config, httpClient, hitsPoolQueue)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cacheHit = jest.spyOn(batchingStrategy as any, 'cacheHit')

    const campaignHit = new Campaign({
      variationGroupId: 'variationGrID',
      campaignId: 'campaignID'
    })

    campaignHit.visitorId = visitorId

    await batchingStrategy.addHit(campaignHit)

    expect(hitsPoolQueue.size).toBe(1)
    expect(cacheHit).toBeCalledTimes(0)

    const consentHit = new Consent({
      visitorConsent: true
    })

    consentHit.visitorId = visitorId

    await batchingStrategy.addHit(consentHit)

    expect(hitsPoolQueue.size).toBe(2)
    expect(cacheHit).toBeCalledTimes(0)

    const pageHit = new Page({
      documentLocation: 'http://127.0.0.1:5500'
    })

    pageHit.visitorId = visitorId

    await batchingStrategy.addHit(pageHit)

    expect(hitsPoolQueue.size).toBe(3)
    expect(cacheHit).toBeCalledTimes(0)

    const consentHitFalse1 = new Consent({
      visitorConsent: false
    })

    consentHitFalse1.visitorId = 'newVisitor'

    await batchingStrategy.addHit(consentHitFalse1)

    expect(hitsPoolQueue.size).toBe(4)
    expect(cacheHit).toBeCalledTimes(1)
    expect(cacheHit).toBeCalledWith(hitsPoolQueue)

    const consentHitFalse2 = new Consent({
      visitorConsent: false
    })

    consentHitFalse2.visitorId = visitorId

    await batchingStrategy.addHit(consentHitFalse2)

    expect(hitsPoolQueue.size).toBe(3)
    expect(cacheHit).toBeCalledTimes(2)
    expect(cacheHit).toBeCalledWith(hitsPoolQueue)
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
  const batchingStrategy = new BatchingPeriodicCachingStrategy(config, httpClient, hitsPoolQueue)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cacheHit = jest.spyOn(batchingStrategy as any, 'cacheHit')

  const visitorId = 'visitorId'

  const globalCampaignHit = new Campaign({
    variationGroupId: 'variationGrID21',
    campaignId: 'campaignID21'
  })

  globalCampaignHit.visitorId = visitorId

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
      const campaignHit = new Campaign({
        variationGroupId: 'variationGrID' + index,
        campaignId: 'campaignID' + index
      })

      campaignHit.visitorId = visitorId

      batch.hits.push(campaignHit)

      await batchingStrategy.addHit(campaignHit)
    }

    await batchingStrategy.addHit(globalCampaignHit)

    expect(hitsPoolQueue.size).toBe(21)

    await batchingStrategy.sendBatch()

    expect(hitsPoolQueue.size).toBe(1)

    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toBeCalledWith(HIT_EVENT_URL, { headers, body: batch.toApiKeys() })
    expect(cacheHit).toBeCalledTimes(1)
    expect(cacheHit).toHaveBeenCalledWith(hitsPoolQueue)
  })

  it('test sendBatch method throw exception ', async () => {
    const error = 'message error'
    postAsync.mockRejectedValue(error)

    const batch:Batch = new Batch({ hits: [globalCampaignHit] })
    batch.config = config

    await batchingStrategy.sendBatch()

    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toBeCalledWith(HIT_EVENT_URL, { headers, body: batch.toApiKeys() })

    expect(cacheHit).toBeCalledTimes(1)
    expect(cacheHit).toBeCalledWith(hitsPoolQueue)
    expect(hitsPoolQueue.size).toBe(1)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(error, 'sendBatch')
  })

  it('test sendBatch method with empty hitsPoolQueue', async () => {
    const hitsPoolQueue = new Map<string, HitAbstract>()
    const batchingStrategy = new BatchingPeriodicCachingStrategy(config, httpClient, hitsPoolQueue)
    await batchingStrategy.sendBatch()
    expect(postAsync).toBeCalledTimes(0)
  })
})
