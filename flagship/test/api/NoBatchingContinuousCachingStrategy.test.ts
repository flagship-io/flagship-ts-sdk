import { jest, expect, it, describe, beforeAll, afterAll } from '@jest/globals'
import { DecisionApiConfig, Event, EventCategory, HitAbstract, OnVisitorExposed, Page, TroubleshootingLabel, UserExposureInfo } from '../../src'
import { NoBatchingContinuousCachingStrategy } from '../../src/api/NoBatchingContinuousCachingStrategy'
import { HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, SDK_INFO, HEADER_X_SDK_VERSION, SDK_VERSION, HEADER_CONTENT_TYPE, HEADER_APPLICATION_JSON, HIT_EVENT_URL, BASE_API_URL, URL_ACTIVATE_MODIFICATION, FS_CONSENT, LogLevel, DEFAULT_HIT_CACHE_TIME_MS, TRACKING_MANAGER_ERROR, DIRECT_HIT, TRACKING_MANAGER, BATCH_HIT } from '../../src/enum'
import { BatchTriggeredBy } from '../../src/enum/BatchTriggeredBy'
import { Activate } from '../../src/hit/Activate'
import { ActivateBatch } from '../../src/hit/ActivateBatch'
import { Batch } from '../../src/hit/Batch'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient } from '../../src/utils/HttpClient'
import { sprintf } from '../../src/utils/utils'
import { Troubleshooting } from '../../src/hit/Troubleshooting'

describe('Test NoBatchingContinuousCachingStrategy', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now >()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })
  const visitorId = 'visitorId'
  const httpClient = new HttpClient()

  const onVisitorExposed = jest.fn<(arg: OnVisitorExposed)=>void>()
  const onUserExposure = jest.fn<(param: UserExposureInfo)=>void>()
  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', onVisitorExposed, onUserExposure })

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
    const troubleshootingQueue = new Map<string, Troubleshooting>()
    const batchingStrategy = new NoBatchingContinuousCachingStrategy({ config, httpClient, hitsPoolQueue, activatePoolQueue, troubleshootingQueue })

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
      body: consentHit.toApiKeys(),
      timeout: config.timeout
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
      body: pageHit.toApiKeys(),
      timeout: config.timeout
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

    await batchingStrategy.addHitInPoolQueue(consentHitFalse)
  })

  it('test addHit method consent false', async () => {
    postAsync.mockResolvedValue({ status: 200, body: null })
    const hitsPoolQueue = new Map<string, HitAbstract>()
    const activatePoolQueue = new Map<string, Activate>()
    const troubleshootingQueue = new Map<string, Troubleshooting>()
    const batchingStrategy = new NoBatchingContinuousCachingStrategy({ config, httpClient, hitsPoolQueue, activatePoolQueue, troubleshootingQueue })

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

    const activateHit = new Activate({
      visitorId,
      variationGroupId: 'varGroupId',
      variationId: 'varId',
      flagKey: 'key',
      flagValue: 'value',
      flagDefaultValue: 'default',
      visitorContext: { key: 'value' },
      flagMetadata: {
        campaignId: 'campaignId',
        variationGroupId: 'variationGrID',
        variationId: 'varId',
        isReference: true,
        campaignType: 'ab',
        slug: 'slug'
      }
    })

    activateHit.config = config
    activateHit.key = visitorId + 'key-activate'

    hitsPoolQueue.set(pageHit.key, pageHit)
    hitsPoolQueue.set(eventHit.key, eventHit)

    activatePoolQueue.set(activateHit.key, activateHit)

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
    expect(flushHits).toHaveBeenNthCalledWith(1, [pageHit.key, eventHit.key, activateHit.key])
  })

  it('test addHit method throw error', async () => {
    const error = 'message error'
    postAsync.mockRejectedValue(error)

    const hitsPoolQueue = new Map<string, HitAbstract>()
    const activatePoolQueue = new Map<string, Activate>()
    const troubleshootingQueue = new Map<string, Troubleshooting>()
    const batchingStrategy = new NoBatchingContinuousCachingStrategy({ config, httpClient, hitsPoolQueue, activatePoolQueue, troubleshootingQueue })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sendTroubleshootingHit = jest.spyOn((batchingStrategy as any), 'sendTroubleshootingHit')
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
    expect(logError).toHaveBeenNthCalledWith(1, sprintf(TRACKING_MANAGER_ERROR, DIRECT_HIT, {
      httpRequestBody: pageHit.toApiKeys(),
      httpRequestHeaders: headers,
      httpRequestMethod: 'POST',
      httpRequestUrl: HIT_EVENT_URL,
      duration: 0,
      batchTriggeredBy: BatchTriggeredBy[BatchTriggeredBy.DirectHit]
    }), TRACKING_MANAGER)

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
    expect(logError).toHaveBeenNthCalledWith(2, sprintf(TRACKING_MANAGER_ERROR, DIRECT_HIT, {
      httpRequestBody: consentHitFalse.toApiKeys(),
      httpRequestHeaders: headers,
      httpRequestMethod: 'POST',
      httpRequestUrl: HIT_EVENT_URL,
      duration: 0,
      batchTriggeredBy: BatchTriggeredBy[BatchTriggeredBy.DirectHit]
    }), TRACKING_MANAGER)

    expect(sendTroubleshootingHit).toBeCalledTimes(2)
    const label: TroubleshootingLabel = 'SEND-HIT-ROUTE-ERROR'
    expect(sendTroubleshootingHit).toBeCalledWith(expect.objectContaining({ label }))
  })

  it('test activateFlag method', async () => {
    postAsync.mockResolvedValue({ status: 200, body: null })
    const hitsPoolQueue = new Map<string, HitAbstract>()
    const activatePoolQueue = new Map<string, Activate>()
    const troubleshootingQueue = new Map<string, Troubleshooting>()
    const batchingStrategy = new NoBatchingContinuousCachingStrategy({ config, httpClient, hitsPoolQueue, activatePoolQueue, troubleshootingQueue })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cacheHit = jest.spyOn(batchingStrategy as any, 'cacheHit')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flushHits = jest.spyOn(batchingStrategy as any, 'flushHits')

    // Test activate
    const activateHit = new Activate({
      variationGroupId: 'varGrId',
      variationId: 'varId',
      visitorId,
      flagKey: 'key',
      flagValue: 'value',
      flagDefaultValue: 'default',
      visitorContext: { key: 'value' },
      flagMetadata: {
        campaignId: 'campaignId',
        variationGroupId: 'variationGrID',
        variationId: 'varId',
        isReference: true,
        campaignType: 'ab',
        slug: 'slug'
      }
    })
    activateHit.config = config

    await batchingStrategy.activateFlag(activateHit)

    expect(postAsync).toHaveBeenCalledTimes(1)
    expect(postAsync).toHaveBeenNthCalledWith(1, urlActivate, {
      headers: headersActivate,
      body: new ActivateBatch([activateHit], config).toApiKeys(),
      timeout: config.timeout
    })
    expect(hitsPoolQueue.size).toBe(0)
    expect(activatePoolQueue.size).toBe(0)
    expect(cacheHit).toBeCalledTimes(0)
    expect(flushHits).toBeCalledTimes(0)

    expect(onVisitorExposed).toBeCalledTimes(1)
    expect(onUserExposure).toBeCalledTimes(1)
  })

  it('test activateFlag method throw error', async () => {
    const error = 'message error'
    postAsync.mockRejectedValue(error)

    const hitsPoolQueue = new Map<string, HitAbstract>()
    const activatePoolQueue = new Map<string, Activate>()
    const troubleshootingQueue = new Map<string, Troubleshooting>()
    const batchingStrategy = new NoBatchingContinuousCachingStrategy({ config, httpClient, hitsPoolQueue, activatePoolQueue, troubleshootingQueue })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sendTroubleshootingHit = jest.spyOn((batchingStrategy as any), 'sendTroubleshootingHit')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cacheHit = jest.spyOn(batchingStrategy as any, 'cacheHit')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flushHits = jest.spyOn(batchingStrategy as any, 'flushHits')

    // Test activate
    const activateHit = new Activate({
      variationGroupId: 'varGrId',
      variationId: 'varId',
      visitorId,
      flagKey: 'key',
      flagValue: 'value',
      flagDefaultValue: 'default',
      visitorContext: { key: 'value' },
      flagMetadata: {
        campaignId: 'campaignId',
        variationGroupId: 'variationGrID',
        variationId: 'varId',
        isReference: true,
        campaignType: 'ab',
        slug: 'slug'
      }
    })
    activateHit.config = config

    await batchingStrategy.activateFlag(activateHit)

    expect(postAsync).toHaveBeenCalledTimes(1)
    expect(postAsync).toHaveBeenNthCalledWith(1, urlActivate, {
      headers: headersActivate,
      body: new ActivateBatch([activateHit], config).toApiKeys(),
      timeout: config.timeout
    })
    expect(hitsPoolQueue.size).toBe(0)
    expect(activatePoolQueue.size).toBe(0)

    expect(cacheHit).toBeCalledTimes(1)
    expect(flushHits).toBeCalledTimes(0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cacheHitKeys = Object.keys((batchingStrategy as any).cacheHitKeys)
    expect(cacheHitKeys.length).toBe(1)

    expect(onVisitorExposed).toBeCalledTimes(0)
    expect(onUserExposure).toBeCalledTimes(0)

    expect(sendTroubleshootingHit).toBeCalledTimes(1)
    const label: TroubleshootingLabel = 'SEND-ACTIVATE-HIT-ROUTE-ERROR'
    expect(sendTroubleshootingHit).toBeCalledWith(expect.objectContaining({ label }))
  })
})

describe('test sendBatch method', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
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
  const troubleshootingQueue = new Map<string, Troubleshooting>()
  const batchingStrategy = new NoBatchingContinuousCachingStrategy({ config, httpClient, hitsPoolQueue, activatePoolQueue, troubleshootingQueue })

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
    config.trackingMangerConfig.batchIntervals = 25
    config.logLevel = LogLevel.NONE

    for (let index = 0; index < 71; index++) {
      const pageHit = new Page({
        documentLocation: ('http://localhost' + index).repeat(2000),
        visitorId
      })

      pageHit.key = visitorId + index

      hitsPoolQueue.set(pageHit.key, pageHit)
      if (index === 70) {
        continue
      }
      batch.hits.push(pageHit)
    }

    expect(hitsPoolQueue.size).toBe(71)

    await batchingStrategy.sendBatch()

    expect(hitsPoolQueue.size).toBe(1)

    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toHaveBeenNthCalledWith(1, HIT_EVENT_URL, {
      headers,
      body: batch.toApiKeys(),
      timeout: config.timeout
    })
    expect(flushHits).toBeCalledTimes(1)
    expect(flushHits).toHaveBeenCalledWith(expect.arrayContaining([expect.stringContaining(visitorId)]))

    await batchingStrategy.sendBatch()

    expect(postAsync).toBeCalledTimes(2)
    expect(hitsPoolQueue.size).toBe(0)
  })

  it('test sendBatch method hit expired', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    postAsync.mockResolvedValue({ status: 200, body: null })

    const batch:Batch = new Batch({ hits: [] })
    batch.config = config
    config.trackingMangerConfig.batchIntervals = 25
    config.logLevel = LogLevel.NONE

    const pageHit = new Page({
      documentLocation: ('http://localhost'),
      visitorId
    })
    pageHit.key = visitorId + 'key1'

    const pageHit2 = new Page({
      documentLocation: ('http://localhost'),
      visitorId
    })
    pageHit2.key = visitorId + 'key2'

    pageHit.createdAt = (DEFAULT_HIT_CACHE_TIME_MS + 1) * -1

    hitsPoolQueue.set(pageHit.key, pageHit)
    hitsPoolQueue.set(pageHit2.key, pageHit2)

    await batchingStrategy.sendBatch()

    expect(hitsPoolQueue.size).toBe(0)

    batch.hits.push(pageHit2)

    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toHaveBeenNthCalledWith(1, HIT_EVENT_URL, {
      headers,
      body: batch.toApiKeys(),
      timeout: config.timeout
    })

    expect(flushHits).toBeCalledTimes(1)
    expect(flushHits).toHaveBeenCalledWith(expect.arrayContaining([expect.stringContaining(visitorId)]))
  })

  it('test sendBatch method throw exception ', async () => {
    const error = 'message error'
    postAsync.mockRejectedValue(error)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addTroubleshootingHit = jest.spyOn((batchingStrategy as any), 'addTroubleshootingHit')

    config.logLevel = LogLevel.ALL
    const batch:Batch = new Batch({ hits: [globalPageHit] })
    batch.config = config
    hitsPoolQueue.set(globalPageHit.key, globalPageHit)

    await batchingStrategy.sendBatch()

    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toBeCalledWith(HIT_EVENT_URL, {
      headers,
      body: batch.toApiKeys(),
      timeout: config.timeout
    })
    expect(flushHits).toBeCalledTimes(0)
    expect(cacheHit).toBeCalledTimes(0)
    expect(hitsPoolQueue.size).toBe(1)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(TRACKING_MANAGER_ERROR, BATCH_HIT, {

      httpRequestBody: batch.toApiKeys(),
      httpRequestHeaders: headers,
      httpRequestMethod: 'POST',
      httpRequestUrl: HIT_EVENT_URL,
      duration: 0,
      batchTriggeredBy: BatchTriggeredBy[BatchTriggeredBy.BatchLength]
    }), TRACKING_MANAGER)

    expect(addTroubleshootingHit).toBeCalledTimes(1)
    const label: TroubleshootingLabel = 'SEND-BATCH-HIT-ROUTE-RESPONSE-ERROR'
    expect(addTroubleshootingHit).toBeCalledWith(expect.objectContaining({ label }))
  })

  it('test sendActivate on batch', async () => {
    postAsync.mockResolvedValue({ status: 200, body: null })

    const activateHit = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate',
      variationId: 'variationId',
      flagKey: 'key',
      flagValue: 'value',
      flagDefaultValue: 'default',
      visitorContext: { key: 'value' },
      flagMetadata: {
        campaignId: 'campaignId',
        variationGroupId: 'variationGrID',
        variationId: 'varId',
        isReference: true,
        campaignType: 'ab',
        slug: 'slug'
      }
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
      body: new ActivateBatch([activateHit], config).toApiKeys(),
      timeout: config.timeout
    })
  })

  it('test sendBatch method with empty hitsPoolQueue', async () => {
    const hitsPoolQueue = new Map<string, HitAbstract>()
    const activatePoolQueue = new Map<string, Activate>()
    const troubleshootingQueue = new Map<string, Troubleshooting>()
    const batchingStrategy = new NoBatchingContinuousCachingStrategy({ config, httpClient, hitsPoolQueue, activatePoolQueue, troubleshootingQueue })
    await batchingStrategy.sendBatch()
    expect(postAsync).toBeCalledTimes(0)
  })
})
