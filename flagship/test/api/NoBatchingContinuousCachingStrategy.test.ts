import { jest, expect, it, describe, beforeAll, afterAll } from '@jest/globals'
import { Mock } from 'jest-mock'
import { DecisionApiConfig, HitAbstract, Page } from '../../src'
import { NoBatchingContinuousCachingStrategy } from '../../src/api/NoBatchingContinuousCachingStrategy'
import { HEADER_X_API_KEY, HEADER_X_ENV_ID, HEADER_X_SDK_CLIENT, SDK_LANGUAGE, HEADER_X_SDK_VERSION, SDK_VERSION, HEADER_CONTENT_TYPE, HEADER_APPLICATION_JSON, HIT_EVENT_URL, SEND_BATCH, BASE_API_URL, URL_ACTIVATE_MODIFICATION, SEND_HIT, SEND_ACTIVATE } from '../../src/enum'
import { Activate } from '../../src/hit/Activate'
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

  const logManager = new FlagshipLogManager()
  config.logManager = logManager

  const logError = jest.spyOn(logManager, 'error')

  config.logManager = logManager

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
      campaignId: 'campaignID',
      visitorId
    })
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
      visitorConsent: true,
      visitorId
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
      documentLocation: 'http://127.0.0.1:5500',
      visitorId
    })
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
      visitorConsent: false,
      visitorId
    })

    consentHitFalse.visitorId = visitorId

    await batchingStrategy.addHit(consentHitFalse)

    expect(hitsPoolQueue.size).toBe(0)
    expect(cacheHit).toBeCalledTimes(4)
    expect(cacheHit).toHaveBeenNthCalledWith(4, new Map().set(expect.stringContaining(visitorId), consentHitFalse))
    expect(flushHits).toBeCalledTimes(4)
    expect(flushHits).toHaveBeenNthCalledWith(4, [expect.stringContaining(visitorId)])

    // Test activate
    const activateHit = new Activate({
      variationGroupId: 'varGrId',
      variationId: 'varId',
      visitorId
    })
    activateHit.config = config

    await batchingStrategy.addHit(activateHit)

    expect(postAsync).toHaveBeenCalledTimes(5)
    expect(postAsync).toHaveBeenNthCalledWith(5, urlActivate, { headers: headersActivate, body: activateHit.toApiKeys() })
    expect(hitsPoolQueue.size).toBe(0)
    expect(cacheHit).toBeCalledTimes(5)
    expect(cacheHit).toHaveBeenNthCalledWith(5, new Map().set(expect.stringContaining(visitorId), activateHit))
    expect(flushHits).toBeCalledTimes(5)
    expect(flushHits).toHaveBeenNthCalledWith(5, [expect.stringContaining(visitorId)])
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
      campaignId: 'campaignID',
      visitorId
    })
    campaignHit.visitorId = visitorId
    campaignHit.config = config

    await batchingStrategy.addHit(campaignHit)

    expect(postAsync).toHaveBeenCalledTimes(1)

    expect(cacheHit).toBeCalledTimes(1)
    expect(flushHits).toBeCalledTimes(0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cacheHitKeys = Object.keys((batchingStrategy as any).cacheHitKeys)
    expect(cacheHitKeys.length).toBe(1)

    expect(logError).toBeCalledTimes(1)
    expect(logError).toHaveBeenNthCalledWith(1, errorFormat(error, {
      url: HIT_EVENT_URL,
      headers,
      body: campaignHit.toApiKeys()
    }), SEND_HIT)

    // Test activate
    const activateHit = new Activate({
      variationGroupId: 'varGrId',
      variationId: 'varId',
      visitorId
    })
    activateHit.config = config

    await batchingStrategy.addHit(activateHit)

    expect(postAsync).toHaveBeenCalledTimes(2)
    expect(hitsPoolQueue.size).toBe(0)
    expect(cacheHit).toBeCalledTimes(2)
    expect(flushHits).toBeCalledTimes(0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cacheHitKeys = Object.keys((batchingStrategy as any).cacheHitKeys)

    expect(cacheHitKeys.length).toBe(2)
    expect(logError).toBeCalledTimes(2)
    expect(logError).toHaveBeenNthCalledWith(2, errorFormat(error, {
      url: urlActivate,
      headers: headersActivate,
      body: activateHit.toApiKeys()
    }), SEND_ACTIVATE)

    // Test consent false
    const consentHitFalse = new Consent({
      visitorConsent: false,
      visitorId
    })
    consentHitFalse.config = config

    const campaignHitLoaded = new Campaign({
      variationGroupId: 'variationGrID',
      campaignId: 'campaignID',
      visitorId
    })

    const consentHitLoaded = new Consent({
      visitorConsent: true,
      visitorId
    })

    hitsPoolQueue.set(visitorId + 'campaign', campaignHitLoaded).set(visitorId + 'consent', consentHitLoaded)

    await batchingStrategy.addHit(consentHitFalse)

    expect(postAsync).toHaveBeenCalledTimes(3)
    expect(hitsPoolQueue.size).toBe(1)
    expect(cacheHit).toBeCalledTimes(3)
    expect(flushHits).toBeCalledTimes(1)

    expect(flushHits).toHaveBeenCalledWith(expect.arrayContaining([expect.stringContaining(visitorId)]))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cacheHitKeys = Object.keys((batchingStrategy as any).cacheHitKeys)

    expect(cacheHitKeys.length).toBe(0)
    expect(logError).toBeCalledTimes(3)
    expect(logError).toHaveBeenNthCalledWith(3, errorFormat(error, {
      url: HIT_EVENT_URL,
      headers,
      body: consentHitFalse.toApiKeys()
    }), SEND_HIT)
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
    campaignId: 'campaignID21',
    visitorId
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
      const key = `${visitorId}:${uuidV4()}`
      const campaignHit = new Campaign({
        variationGroupId: 'variationGrID' + index,
        campaignId: 'campaignID' + index,
        visitorId
      })
      campaignHit.key = key
      campaignHit.visitorId = visitorId

      batch.hits.push(campaignHit)
      hitsPoolQueue.set(key, campaignHit)
    }

    hitsPoolQueue.set(globalCampaignHit.key, globalCampaignHit)

    const activateHit = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate',
      variationId: 'variationId'
    })
    activateHit.config = config
    activateHit.key = visitorId + 'activate'
    hitsPoolQueue.set(activateHit.key, activateHit)

    expect(hitsPoolQueue.size).toBe(22)

    await batchingStrategy.sendBatch()

    expect(hitsPoolQueue.size).toBe(2)

    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toBeCalledWith(HIT_EVENT_URL, { headers, body: batch.toApiKeys() })
    expect(flushHits).toBeCalledTimes(1)
    expect(flushHits).toHaveBeenCalledWith(expect.arrayContaining([expect.stringContaining(visitorId)]))

    await batchingStrategy.sendBatch()

    expect(hitsPoolQueue.size).toBe(0)

    expect(postAsync).toBeCalledTimes(3)

    const newBatch:Batch = new Batch({ hits: [globalCampaignHit] })
    newBatch.config = config

    expect(postAsync).toHaveBeenNthCalledWith(2, urlActivate, { headers: headersActivate, body: activateHit.toApiKeys() })
    expect(postAsync).toHaveBeenNthCalledWith(3, HIT_EVENT_URL, { headers, body: newBatch.toApiKeys() })
    expect(flushHits).toBeCalledTimes(3)
    expect(flushHits).toHaveBeenCalledWith(expect.arrayContaining([expect.stringContaining(visitorId)]))
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

    expect(cacheHit).toBeCalledTimes(0)
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

    expect(cacheHit).toBeCalledTimes(0)
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
    const batchingStrategy = new NoBatchingContinuousCachingStrategy(config, httpClient, hitsPoolQueue)
    await batchingStrategy.sendBatch()
    expect(postAsync).toBeCalledTimes(0)
  })
})
