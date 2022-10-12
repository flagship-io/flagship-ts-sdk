import { jest, expect, it, describe, beforeAll, afterAll } from '@jest/globals'
import { Mock } from 'jest-mock'
import { DecisionApiConfig, Event, EventCategory, HitAbstract, Page } from '../../src'
import { NoBatchingContinuousCachingStrategy } from '../../src/api/NoBatchingContinuousCachingStrategy'
import { HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, SDK_INFO, HEADER_X_SDK_VERSION, SDK_VERSION, HEADER_CONTENT_TYPE, HEADER_APPLICATION_JSON, HIT_EVENT_URL, SEND_BATCH, BASE_API_URL, URL_ACTIVATE_MODIFICATION, SEND_HIT, FS_CONSENT } from '../../src/enum'
import { Activate } from '../../src/hit/Activate'
import { ActivateBatch } from '../../src/hit/ActivateBatch'
import { Batch } from '../../src/hit/Batch'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient } from '../../src/utils/HttpClient'
import { errorFormat } from '../../src/utils/utils'

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
    [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
  }

  const headersActivate = {
    [HEADER_X_API_KEY]: `${config.apiKey}`,
    [HEADER_X_SDK_CLIENT]: SDK_INFO.name,
    [HEADER_X_SDK_VERSION]: SDK_VERSION,
    [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
  }

  const urlActivate = `${BASE_API_URL}${URL_ACTIVATE_MODIFICATION}`
  it('test addHit method', async () => {
    postAsync.mockResolvedValue({ status: 200, body: null })
    const hitsPoolQueue = new Map<string, HitAbstract>()
    const activatePoolQueue = new Map<string, Activate>()
    const batchingStrategy = new NoBatchingContinuousCachingStrategy(config, httpClient, hitsPoolQueue, activatePoolQueue)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cacheHit = jest.spyOn(batchingStrategy as any, 'cacheHit')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flushHits = jest.spyOn(batchingStrategy as any, 'flushHits')

    const consentHit = new Event({
      visitorId,
      label: `${SDK_INFO.name}:${true}`,
      action: FS_CONSENT,
      category: EventCategory.USER_ENGAGEMENT
    })

    consentHit.visitorId = visitorId

    await batchingStrategy.addHit(consentHit)

    expect(postAsync).toHaveBeenCalledTimes(1)
    expect(postAsync).toHaveBeenNthCalledWith(1, HIT_EVENT_URL, {
      headers,
      body: consentHit.toApiKeys()
    })
    expect(hitsPoolQueue.size).toBe(0)
    expect(cacheHit).toBeCalledTimes(0)
    expect(flushHits).toBeCalledTimes(0)

    const pageHit = new Page({
      documentLocation: 'http://127.0.0.1:5500',
      visitorId
    })
    pageHit.config = config

    await batchingStrategy.addHit(pageHit)

    expect(postAsync).toHaveBeenCalledTimes(2)
    expect(postAsync).toHaveBeenNthCalledWith(2, HIT_EVENT_URL, {
      headers,
      body: pageHit.toApiKeys()
    })
    expect(hitsPoolQueue.size).toBe(0)
    expect(cacheHit).toBeCalledTimes(0)
    expect(flushHits).toBeCalledTimes(0)

    const consentHitFalse = new Event({
      visitorId,
      label: `${SDK_INFO.name}:false`,
      action: FS_CONSENT,
      category: EventCategory.USER_ENGAGEMENT
    })

    consentHitFalse.visitorId = visitorId

    await batchingStrategy.addHit(consentHitFalse)

    expect(hitsPoolQueue.size).toBe(0)
    expect(cacheHit).toBeCalledTimes(0)
    expect(flushHits).toBeCalledTimes(0)
  })

  it('test addHit method consent false', async () => {
    postAsync.mockResolvedValue({ status: 200, body: null })
    const hitsPoolQueue = new Map<string, HitAbstract>()
    const activatePoolQueue = new Map<string, Activate>()
    const batchingStrategy = new NoBatchingContinuousCachingStrategy(config, httpClient, hitsPoolQueue, activatePoolQueue)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cacheHit = jest.spyOn(batchingStrategy as any, 'cacheHit')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flushHits = jest.spyOn(batchingStrategy as any, 'flushHits')

    const eventHit = new Event({
      visitorId,
      label: 'label',
      action: 'click',
      category: EventCategory.USER_ENGAGEMENT
    })

    eventHit.visitorId = visitorId
    eventHit.config = config
    eventHit.key = visitorId + 'key-event'

    const pageHit = new Page({
      documentLocation: 'http://127.0.0.1:5500',
      visitorId
    })
    pageHit.config = config
    pageHit.key = visitorId + 'key-page'

    hitsPoolQueue.set(pageHit.key, pageHit)
    hitsPoolQueue.set(eventHit.key, eventHit)

    const consentHitFalse = new Event({
      visitorId,
      label: `${SDK_INFO.name}:false`,
      action: FS_CONSENT,
      category: EventCategory.USER_ENGAGEMENT
    })
    consentHitFalse.config = config
    consentHitFalse.visitorId = visitorId

    await batchingStrategy.addHit(consentHitFalse)

    expect(hitsPoolQueue.size).toBe(0)
    expect(cacheHit).toBeCalledTimes(0)
    expect(flushHits).toBeCalledTimes(1)
    expect(flushHits).toHaveBeenNthCalledWith(1, [pageHit.key, eventHit.key])
  })

  it('test addHit method throw error', async () => {
    const error = 'message error'
    postAsync.mockRejectedValue(error)

    const hitsPoolQueue = new Map<string, HitAbstract>()
    const activatePoolQueue = new Map<string, Activate>()
    const batchingStrategy = new NoBatchingContinuousCachingStrategy(config, httpClient, hitsPoolQueue, activatePoolQueue)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cacheHit = jest.spyOn(batchingStrategy as any, 'cacheHit')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flushHits = jest.spyOn(batchingStrategy as any, 'flushHits')

    const pageHit = new Page({
      documentLocation: 'http://localhost',
      visitorId
    })
    pageHit.visitorId = visitorId
    pageHit.config = config

    await batchingStrategy.addHit(pageHit)

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
      body: pageHit.toApiKeys()
    }), SEND_HIT)

    // Test consent false
    const consentHitFalse = new Event({
      visitorId,
      label: `${SDK_INFO.name}:${false}`,
      action: FS_CONSENT,
      category: EventCategory.USER_ENGAGEMENT
    })
    consentHitFalse.config = config

    await batchingStrategy.addHit(consentHitFalse)

    expect(postAsync).toHaveBeenCalledTimes(2)
    expect(hitsPoolQueue.size).toBe(0)
    expect(cacheHit).toBeCalledTimes(2)
    expect(flushHits).toBeCalledTimes(1)

    expect(flushHits).toHaveBeenCalledWith(expect.arrayContaining([expect.stringContaining(visitorId)]))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cacheHitKeys = Object.keys((batchingStrategy as any).cacheHitKeys)

    expect(cacheHitKeys.length).toBe(0)
    expect(logError).toBeCalledTimes(2)
    expect(logError).toHaveBeenNthCalledWith(2, errorFormat(error, {
      url: HIT_EVENT_URL,
      headers,
      body: consentHitFalse.toApiKeys()
    }), SEND_HIT)
  })

  it('test activateFlag method', async () => {
    postAsync.mockResolvedValue({ status: 200, body: null })
    const hitsPoolQueue = new Map<string, HitAbstract>()
    const activatePoolQueue = new Map<string, Activate>()
    const batchingStrategy = new NoBatchingContinuousCachingStrategy(config, httpClient, hitsPoolQueue, activatePoolQueue)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cacheHit = jest.spyOn(batchingStrategy as any, 'cacheHit')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flushHits = jest.spyOn(batchingStrategy as any, 'flushHits')

    // Test activate
    const activateHit = new Activate({
      variationGroupId: 'varGrId',
      variationId: 'varId',
      visitorId
    })
    activateHit.config = config

    await batchingStrategy.activateFlag(activateHit)

    expect(postAsync).toHaveBeenCalledTimes(1)
    expect(postAsync).toHaveBeenNthCalledWith(1, urlActivate, {
      headers: headersActivate,
      body: new ActivateBatch([activateHit], config).toApiKeys()
    })
    expect(hitsPoolQueue.size).toBe(0)
    expect(activatePoolQueue.size).toBe(0)
    expect(cacheHit).toBeCalledTimes(0)
    expect(flushHits).toBeCalledTimes(0)
  })

  it('test activateFlag method throw error', async () => {
    const error = 'message error'
    postAsync.mockRejectedValue(error)

    const hitsPoolQueue = new Map<string, HitAbstract>()
    const activatePoolQueue = new Map<string, Activate>()
    const batchingStrategy = new NoBatchingContinuousCachingStrategy(config, httpClient, hitsPoolQueue, activatePoolQueue)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cacheHit = jest.spyOn(batchingStrategy as any, 'cacheHit')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flushHits = jest.spyOn(batchingStrategy as any, 'flushHits')

    // Test activate
    const activateHit = new Activate({
      variationGroupId: 'varGrId',
      variationId: 'varId',
      visitorId
    })
    activateHit.config = config

    await batchingStrategy.activateFlag(activateHit)

    expect(postAsync).toHaveBeenCalledTimes(1)
    expect(postAsync).toHaveBeenNthCalledWith(1, urlActivate, {
      headers: headersActivate,
      body: new ActivateBatch([activateHit], config).toApiKeys()
    })
    expect(hitsPoolQueue.size).toBe(0)
    expect(activatePoolQueue.size).toBe(0)

    expect(cacheHit).toBeCalledTimes(1)
    expect(flushHits).toBeCalledTimes(0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cacheHitKeys = Object.keys((batchingStrategy as any).cacheHitKeys)
    expect(cacheHitKeys.length).toBe(1)
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
  const activatePoolQueue = new Map<string, Activate>()
  const batchingStrategy = new NoBatchingContinuousCachingStrategy(config, httpClient, hitsPoolQueue, activatePoolQueue)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cacheHit = jest.spyOn(batchingStrategy as any, 'cacheHit')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flushHits = jest.spyOn(batchingStrategy as any, 'flushHits')

  const visitorId = 'visitorId'

  const globalPageHit = new Page({
    documentLocation: 'http://localhost',
    visitorId
  })

  const headers = {
    [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
  }

  const headersActivate = {
    [HEADER_X_API_KEY]: `${config.apiKey}`,
    [HEADER_X_SDK_CLIENT]: SDK_INFO.name,
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
      const pageHit = new Page({
        documentLocation: 'http://localhost' + index,
        visitorId
      })
      pageHit.key = visitorId + index
      batch.hits.push(pageHit)
      hitsPoolQueue.set(pageHit.key, pageHit)
    }

    hitsPoolQueue.set(globalPageHit.key, globalPageHit)

    expect(hitsPoolQueue.size).toBe(21)

    await batchingStrategy.sendBatch()

    expect(hitsPoolQueue.size).toBe(1)

    await batchingStrategy.sendBatch()

    expect(postAsync).toBeCalledTimes(2)
    expect(postAsync).toHaveBeenNthCalledWith(1, HIT_EVENT_URL, { headers, body: batch.toApiKeys() })
    expect(flushHits).toBeCalledTimes(2)
    expect(flushHits).toHaveBeenCalledWith(expect.arrayContaining([expect.stringContaining(visitorId)]))

    const newBatch = new Batch({ hits: [globalPageHit] })
    newBatch.config = config

    expect(postAsync).toHaveBeenNthCalledWith(2, HIT_EVENT_URL, { headers, body: newBatch.toApiKeys() })
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

  it('test sendActivate on batch', async () => {
    postAsync.mockResolvedValue({ status: 200, body: null })

    const activateHit = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate',
      variationId: 'variationId'
    })
    activateHit.config = config
    activateHit.key = visitorId
    activateHit.key = visitorId + 'key'

    hitsPoolQueue.clear()

    activatePoolQueue.set(activateHit.key, activateHit)

    await batchingStrategy.sendBatch()

    expect(activatePoolQueue.size).toBe(0)

    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toHaveBeenNthCalledWith(1, urlActivate, {
      headers: headersActivate,
      body: new ActivateBatch([activateHit], config).toApiKeys()
    })
  })

  it('test sendActivate failed on batch', async () => {
    const error = 'message error'
    postAsync.mockRejectedValue(error)

    const activateHit = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate',
      variationId: 'variationId'
    })
    activateHit.config = config
    activateHit.key = visitorId
    activateHit.key = visitorId + 'key'

    hitsPoolQueue.clear()

    activatePoolQueue.set(activateHit.key, activateHit)

    await batchingStrategy.sendBatch()

    expect(activatePoolQueue.size).toBe(0)

    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toHaveBeenNthCalledWith(1, urlActivate, {
      headers: headersActivate,
      body: new ActivateBatch([activateHit], config).toApiKeys()
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cacheHitKeys = Object.keys((batchingStrategy as any).cacheHitKeys)
    expect(cacheHitKeys.length).toBe(1)
  })

  it('test sendBatch method with empty hitsPoolQueue', async () => {
    const hitsPoolQueue = new Map<string, HitAbstract>()
    const activatePoolQueue = new Map<string, Activate>()
    const batchingStrategy = new NoBatchingContinuousCachingStrategy(config, httpClient, hitsPoolQueue, activatePoolQueue)
    await batchingStrategy.sendBatch()
    expect(postAsync).toBeCalledTimes(0)
  })
})
