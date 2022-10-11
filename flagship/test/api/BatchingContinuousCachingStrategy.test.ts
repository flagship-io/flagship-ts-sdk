import { jest, expect, it, describe, beforeAll, afterAll } from '@jest/globals'
import { Mock } from 'jest-mock'
import { Event, EventCategory, HitAbstract, HitCacheDTO, Page } from '../../src'
import { BatchingContinuousCachingStrategy } from '../../src/api/BatchingContinuousCachingStrategy'
import { DecisionApiConfig } from '../../src/config/DecisionApiConfig'
import { BASE_API_URL, FS_CONSENT, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, HIT_CACHE_VERSION, HIT_EVENT_URL, PROCESS_CACHE_HIT, PROCESS_FLUSH_HIT, SDK_INFO, SDK_VERSION, SEND_BATCH, URL_ACTIVATE_MODIFICATION } from '../../src/enum/FlagshipConstant'
import { Activate } from '../../src/hit/Activate'
import { Batch } from '../../src/hit/Batch'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient } from '../../src/utils/HttpClient'
import { errorFormat } from '../../src/utils/utils'

describe('Test BatchingContinuousCachingStrategy', () => {
  const visitorId = 'visitorId'
  it('test addHit method', async () => {
    const httpClient = new HttpClient()
    const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
    const hitsPoolQueue = new Map<string, HitAbstract>()
    const activatePoolQueue = new Map<string, Activate>()
    const batchingStrategy = new BatchingContinuousCachingStrategy(config, httpClient, hitsPoolQueue, activatePoolQueue)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cacheHit = jest.spyOn(batchingStrategy as any, 'cacheHit')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flushHits = jest.spyOn(batchingStrategy as any, 'flushHits')

    const pageHit1 = new Page({
      documentLocation: 'http://localhost',
      visitorId
    })

    await batchingStrategy.addHit(pageHit1)

    expect(hitsPoolQueue.size).toBe(1)
    expect(cacheHit).toBeCalledTimes(1)
    expect(cacheHit).toHaveBeenNthCalledWith(1, new Map().set(expect.stringContaining(visitorId), pageHit1))

    const consentHit = new Event({
      visitorId,
      label: `${SDK_INFO.name}:${true}`,
      action: FS_CONSENT,
      category: EventCategory.USER_ENGAGEMENT
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

    const consentHitFalse1 = new Event({
      visitorId,
      label: `${SDK_INFO.name}:${false}`,
      action: FS_CONSENT,
      category: EventCategory.USER_ENGAGEMENT
    })

    consentHitFalse1.visitorId = 'newVisitor'

    await batchingStrategy.addHit(consentHitFalse1)

    expect(hitsPoolQueue.size).toBe(4)
    expect(cacheHit).toBeCalledTimes(4)
    expect(cacheHit).toHaveBeenNthCalledWith(4, new Map().set(expect.stringContaining('newVisitor'), consentHitFalse1))
    expect(flushHits).toBeCalledTimes(0)

    const consentHitFalse2 = new Event({
      visitorId,
      label: `${SDK_INFO.name}:${false}`,
      action: FS_CONSENT,
      category: EventCategory.USER_ENGAGEMENT
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

describe('test activateFlag method', () => {
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

  config.logManager = logManager

  const hitsPoolQueue = new Map<string, HitAbstract>()
  const activatePoolQueue = new Map<string, Activate>()
  const batchingStrategy = new BatchingContinuousCachingStrategy(config, httpClient, hitsPoolQueue, activatePoolQueue)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cacheHit = jest.spyOn(batchingStrategy as any, 'cacheHit')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flushHits = jest.spyOn(batchingStrategy as any, 'flushHits')

  const visitorId = 'visitorId'

  const headersActivate = {
    [HEADER_X_API_KEY]: `${config.apiKey}`,
    [HEADER_X_SDK_CLIENT]: SDK_INFO.name,
    [HEADER_X_SDK_VERSION]: SDK_VERSION,
    [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
  }

  const urlActivate = `${BASE_API_URL}${URL_ACTIVATE_MODIFICATION}`
  it('test activate success', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    postAsync.mockResolvedValue({ status: 200, body: null })

    const activateHit = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate',
      variationId: 'variationId'
    })
    activateHit.config = config
    activateHit.key = visitorId

    expect(hitsPoolQueue.size).toBe(0)

    await batchingStrategy.activateFlag(activateHit)

    expect(hitsPoolQueue.size).toBe(0)
    expect(activatePoolQueue.size).toBe(0)

    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toHaveBeenNthCalledWith(1, urlActivate, { headers: headersActivate, body: { batch: [activateHit.toApiKeys()] } })

    expect(flushHits).toBeCalledTimes(0)
  })

  it('test multiple activate success', async () => {
    postAsync.mockResolvedValue({ status: 200, body: null })

    const activateHit = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate',
      variationId: 'variationId'
    })
    activateHit.config = config
    activateHit.key = visitorId

    const activateHit2 = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate-2',
      variationId: 'variationId-2'
    })

    activateHit2.config = config
    activateHit2.key = visitorId + 'key-2'

    const activateHit3 = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate-3',
      variationId: 'variationId-3'
    })
    activateHit3.config = config
    activateHit3.key = visitorId + 'key-3'

    activatePoolQueue.set(activateHit2.key, activateHit2).set(activateHit3.key, activateHit3)

    expect(hitsPoolQueue.size).toBe(0)
    expect(activatePoolQueue.size).toBe(2)

    await batchingStrategy.activateFlag(activateHit)

    expect(hitsPoolQueue.size).toBe(0)
    expect(activatePoolQueue.size).toBe(0)

    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toHaveBeenNthCalledWith(1, urlActivate, {
      headers: headersActivate,
      body: { batch: [activateHit2.toApiKeys(), activateHit3.toApiKeys(), activateHit.toApiKeys()] }
    })

    expect(cacheHit).toBeCalledTimes(0)
    expect(flushHits).toBeCalledTimes(1)
    expect(flushHits).toHaveBeenCalledWith([activateHit2.key, activateHit3.key])
  })

  it('test multiple activate failed', async () => {
    const error = 'message error'
    postAsync.mockRejectedValue(error)

    const activateHit = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate',
      variationId: 'variationId'
    })
    activateHit.config = config
    activateHit.key = visitorId

    const activateHit2 = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate-2',
      variationId: 'variationId-2'
    })

    activateHit2.config = config
    activateHit2.key = visitorId + 'key-2'

    const activateHit3 = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate-3',
      variationId: 'variationId-3'
    })
    activateHit3.config = config
    activateHit3.key = visitorId + 'key-3'

    activatePoolQueue.set(activateHit2.key, activateHit2).set(activateHit3.key, activateHit3)

    expect(hitsPoolQueue.size).toBe(0)
    expect(activatePoolQueue.size).toBe(2)

    await batchingStrategy.activateFlag(activateHit)

    expect(hitsPoolQueue.size).toBe(0)
    expect(activatePoolQueue.size).toBe(3)

    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toHaveBeenNthCalledWith(1, urlActivate, {
      headers: headersActivate,
      body: { batch: [activateHit2.toApiKeys(), activateHit3.toApiKeys(), activateHit.toApiKeys()] }
    })

    expect(flushHits).toBeCalledTimes(0)
    expect(cacheHit).toBeCalledTimes(1)
    expect(cacheHit).toHaveBeenCalledWith(new Map([[activateHit.key, activateHit]]))
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
  const batchingStrategy = new BatchingContinuousCachingStrategy(config, httpClient, hitsPoolQueue, activatePoolQueue)

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

      batch.hits.push(pageHit)

      await batchingStrategy.addHit(pageHit)
    }

    await batchingStrategy.addHit(globalPageHit)

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
      body: { batch: [activateHit.toApiKeys()] }
    })
  })

  it('test sendBatch method with empty hitsPoolQueue', async () => {
    const hitsPoolQueue = new Map<string, HitAbstract>()
    const activatePoolQueue = new Map<string, Activate>()
    const batchingStrategy = new BatchingContinuousCachingStrategy(config, httpClient, hitsPoolQueue, activatePoolQueue)
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
  const activatePoolQueue = new Map<string, Activate>()
  const batchingStrategy = new BatchingContinuousCachingStrategy(config, httpClient, hitsPoolQueue, activatePoolQueue)
  const visitorId = 'visitorId'
  it('test cacheHit success ', async () => {
    cacheHit.mockResolvedValue()
    const pageHit = new Page({
      documentLocation: 'http://localhost',
      visitorId
    })

    pageHit.visitorId = visitorId
    pageHit.key = 'key'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (batchingStrategy as any).cacheHit(new Map().set(pageHit.key, pageHit))

    const cacheData = {
      version: HIT_CACHE_VERSION,
      data: {
        visitorId: pageHit.visitorId,
        anonymousId: pageHit.anonymousId,
        type: pageHit.type,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: pageHit.toObject() as any,
        time: Date.now()
      }
    }

    expect(cacheHit).toBeCalledTimes(1)
    expect(cacheHit).toBeCalledWith({ [pageHit.key]: cacheData })
  })

  it('test cacheHit throw exception', async () => {
    const error = 'message'
    cacheHit.mockRejectedValue(error)
    const pageHit = new Page({
      documentLocation: 'http://localhost',
      visitorId
    })

    pageHit.visitorId = visitorId
    pageHit.key = 'key'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (batchingStrategy as any).cacheHit(new Map().set(pageHit.key, pageHit))

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
