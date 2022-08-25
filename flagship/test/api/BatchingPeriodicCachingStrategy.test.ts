import { jest, expect, it, describe, beforeAll, afterAll } from '@jest/globals'
import { Mock } from 'jest-mock'
import { Event, EventCategory } from '../../src'
import { BatchingPeriodicCachingStrategy } from '../../src/api/BatchingPeriodicCachingStrategy'
import { DecisionApiConfig } from '../../src/config/DecisionApiConfig'
import { HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, SDK_LANGUAGE, HEADER_X_SDK_VERSION, SDK_VERSION, HEADER_CONTENT_TYPE, HEADER_APPLICATION_JSON, HIT_EVENT_URL, SEND_BATCH, BASE_API_URL, URL_ACTIVATE_MODIFICATION, SEND_ACTIVATE, FS_CONSENT } from '../../src/enum'
import { Segment } from '../../src/hit'
import { Activate } from '../../src/hit/Activate'
import { Batch } from '../../src/hit/Batch'
import { HitAbstract } from '../../src/hit/HitAbstract'
import { Page } from '../../src/hit/Page'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient } from '../../src/utils/HttpClient'
import { errorFormat } from '../../src/utils/utils'
describe('Test BatchingPeriodicCachingStrategy', () => {
  const visitorId = 'visitorId'
  it('test addHit method', async () => {
    const httpClient = new HttpClient()
    const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
    const hitsPoolQueue = new Map<string, HitAbstract>()
    const batchingStrategy = new BatchingPeriodicCachingStrategy(config, httpClient, hitsPoolQueue)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cacheHit = jest.spyOn(batchingStrategy as any, 'cacheHit')

    const activateHit = new Activate({
      variationGroupId: 'variationGrID',
      variationId: 'campaignID',
      visitorId
    })

    activateHit.visitorId = visitorId
    activateHit.config = config

    await batchingStrategy.addHit(activateHit)

    expect(hitsPoolQueue.size).toBe(1)
    expect(cacheHit).toBeCalledTimes(0)

    const consentHit = new Event({
      visitorId,
      label: `${SDK_LANGUAGE.name}:${true}`,
      action: FS_CONSENT,
      category: EventCategory.USER_ENGAGEMENT
    })

    consentHit.visitorId = visitorId

    await batchingStrategy.addHit(consentHit)

    expect(hitsPoolQueue.size).toBe(2)
    expect(cacheHit).toBeCalledTimes(0)

    const pageHit = new Page({
      documentLocation: 'http://127.0.0.1:5500',
      visitorId
    })

    pageHit.visitorId = visitorId

    await batchingStrategy.addHit(pageHit)

    expect(hitsPoolQueue.size).toBe(3)
    expect(cacheHit).toBeCalledTimes(0)

    const consentHitFalse1 = new Event({
      visitorId,
      label: `${SDK_LANGUAGE.name}:${false}`,
      action: FS_CONSENT,
      category: EventCategory.USER_ENGAGEMENT
    })

    consentHitFalse1.visitorId = 'newVisitor'

    await batchingStrategy.addHit(consentHitFalse1)

    expect(hitsPoolQueue.size).toBe(4)
    expect(cacheHit).toBeCalledTimes(1)
    expect(cacheHit).toBeCalledWith(hitsPoolQueue)

    const consentHitFalse2 = new Event({
      visitorId,
      label: `${SDK_LANGUAGE.name}:${false}`,
      action: FS_CONSENT,
      category: EventCategory.USER_ENGAGEMENT
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

  const globalPageHit = new Page({
    documentLocation: 'http://page.com',
    visitorId
  })

  globalPageHit.visitorId = visitorId

  const headers = {
    [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
  }

  const headersActivate = {
    [HEADER_X_API_KEY]: `${config.apiKey}`,
    [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE.name,
    [HEADER_X_SDK_VERSION]: SDK_VERSION,
    [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
  }

  const urlActivate = `${BASE_API_URL}${URL_ACTIVATE_MODIFICATION}`
  const urlEvents = `${BASE_API_URL}${config.envId}/events`
  it('test sendBatch method success', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    postAsync.mockResolvedValue({ status: 200, body: null })

    const batch:Batch = new Batch({ hits: [] })
    batch.config = config

    for (let index = 0; index < 20; index++) {
      const pageHit = new Page({
        documentLocation: 'http://page.com',
        visitorId
      })

      pageHit.visitorId = visitorId

      batch.hits.push(pageHit)

      await batchingStrategy.addHit(pageHit)
    }

    await batchingStrategy.addHit(globalPageHit)

    const activateHit = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate',
      variationId: 'variationId'
    })
    activateHit.config = config
    await batchingStrategy.addHit(activateHit)

    const segmentHit = new Segment({
      visitorId,
      data: {
        key: 'value'
      }
    })

    segmentHit.config = config

    await batchingStrategy.addHit(segmentHit)

    expect(hitsPoolQueue.size).toBe(23)

    await batchingStrategy.sendBatch()

    expect(hitsPoolQueue.size).toBe(3)

    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toBeCalledWith(HIT_EVENT_URL, { headers, body: batch.toApiKeys() })
    expect(cacheHit).toBeCalledTimes(1)
    expect(cacheHit).toHaveBeenCalledWith(hitsPoolQueue)

    await batchingStrategy.sendBatch()

    expect(postAsync).toBeCalledTimes(4)

    expect(postAsync).toHaveBeenNthCalledWith(2, urlActivate, { headers: headersActivate, body: activateHit.toApiKeys() })
    expect(postAsync).toHaveBeenNthCalledWith(3, urlEvents, { headers: headersActivate, body: segmentHit.toApiKeys() })

    const newBatch = new Batch({ hits: [globalPageHit] })
    newBatch.config = config

    expect(postAsync).toHaveBeenNthCalledWith(4, HIT_EVENT_URL, { headers, body: newBatch.toApiKeys() })

    expect(cacheHit).toBeCalledTimes(2)
    expect(cacheHit).toHaveBeenCalledWith(hitsPoolQueue)
  })

  it('test sendBatch method throw exception ', async () => {
    const error = 'message error'
    postAsync.mockRejectedValue(error)

    const batch:Batch = new Batch({ hits: [globalPageHit] })
    batch.config = config

    hitsPoolQueue.set(globalPageHit.key, globalPageHit)

    await batchingStrategy.sendBatch()

    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toBeCalledWith(HIT_EVENT_URL, { headers, body: batch.toApiKeys() })

    expect(cacheHit).toBeCalledTimes(1)
    expect(cacheHit).toBeCalledWith(hitsPoolQueue)
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

    expect(cacheHit).toBeCalledTimes(1)
    expect(cacheHit).toBeCalledWith(hitsPoolQueue)
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
    const batchingStrategy = new BatchingPeriodicCachingStrategy(config, httpClient, hitsPoolQueue)
    await batchingStrategy.sendBatch()
    expect(postAsync).toBeCalledTimes(0)
  })
})
