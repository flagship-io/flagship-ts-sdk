import { jest, expect, it, describe, beforeAll, afterAll } from '@jest/globals'
import { EventCategory, IExposedFlag, IExposedVisitor, LogLevel, OnVisitorExposed, TroubleshootingLabel } from '../../src'
import { BatchingContinuousCachingStrategy } from '../../src/api/BatchingContinuousCachingStrategy'
import { DecisionApiConfig } from '../../src/config/DecisionApiConfig'
import { EdgeConfig } from '../../src/config/EdgeConfig'
import { BatchTriggeredBy } from '../../src/enum/BatchTriggeredBy'
import { BASE_API_URL, BATCH_HIT, DEFAULT_HIT_CACHE_TIME_MS, FS_CONSENT, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, PROCESS_CACHE, HEADER_X_SDK_VERSION, HIT_CACHE_ERROR, HIT_CACHE_VERSION, HIT_EVENT_URL, SDK_INFO, SDK_VERSION, TRACKING_MANAGER, TRACKING_MANAGER_ERROR, URL_ACTIVATE_MODIFICATION, TROUBLESHOOTING_HIT_URL, USAGE_HIT_URL } from '../../src/enum/FlagshipConstant'
import { Activate } from '../../src/hit/Activate'
import { Page } from '../../src/hit/Page'
import { HitAbstract } from '../../src/hit/HitAbstract'
import { Event } from '../../src/hit/Event'
import { ActivateBatch } from '../../src/hit/ActivateBatch'
import { Batch } from '../../src/hit/Batch'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient } from '../../src/utils/HttpClient'
import { sleep, sprintf } from '../../src/utils/utils'
import { Troubleshooting } from '../../src/hit/Troubleshooting'
import * as utils from '../../src/utils/utils'
import * as qaAssistant from '../../src/qaAssistant/messages'
import { UsageHit } from '../../src/hit/UsageHit'

describe('Test BatchingContinuousCachingStrategy', () => {
  const visitorId = 'visitorId'

  it('test addHit method', async () => {
    const httpClient = new HttpClient()

    const postAsync = jest.spyOn(httpClient, 'postAsync')
    postAsync.mockRejectedValue('Error')

    const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
    const hitsPoolQueue = new Map<string, HitAbstract>()
    const activatePoolQueue = new Map<string, Activate>()
    const troubleshootingQueue = new Map<string, Troubleshooting>()
    const analyticHitQueue = new Map<string, UsageHit>()
    const batchingStrategy = new BatchingContinuousCachingStrategy({ config, httpClient, hitsPoolQueue, activatePoolQueue, troubleshootingQueue, analyticHitQueue })

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

    await batchingStrategy.addHit(consentHit)

    expect(hitsPoolQueue.size).toBe(2)
    expect(cacheHit).toBeCalledTimes(2)
    expect(cacheHit).toHaveBeenNthCalledWith(2, new Map().set(expect.stringContaining(visitorId), consentHit))

    const pageHit = new Page({
      documentLocation: 'http://127.0.0.1:5500',
      visitorId
    })

    await batchingStrategy.addHit(pageHit)

    expect(hitsPoolQueue.size).toBe(3)
    expect(cacheHit).toBeCalledTimes(3)
    expect(cacheHit).toHaveBeenNthCalledWith(3, new Map().set(expect.stringContaining(visitorId), pageHit))

    const activateHit = new Activate({
      variationGroupId: 'varGroupId',
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
    activateHit.config = config

    await batchingStrategy.activateFlag(activateHit)

    expect(hitsPoolQueue.size).toBe(3)
    expect(activatePoolQueue.size).toBe(1)
    expect(cacheHit).toBeCalledTimes(4)
    expect(cacheHit).toHaveBeenNthCalledWith(4, new Map().set(expect.stringContaining(visitorId), activateHit))

    const newVisitorId = 'newVisitor'
    const consentHitFalse1 = new Event({
      visitorId: newVisitorId,
      label: `${SDK_INFO.name}:${false}`,
      action: FS_CONSENT,
      category: EventCategory.USER_ENGAGEMENT
    })

    await batchingStrategy.addHit(consentHitFalse1)

    expect(hitsPoolQueue.size).toBe(4)
    expect(cacheHit).toBeCalledTimes(5)
    expect(cacheHit).toHaveBeenNthCalledWith(5, new Map().set(expect.stringContaining('newVisitor'), consentHitFalse1))
    expect(flushHits).toBeCalledTimes(0)
    expect(activatePoolQueue.size).toBe(1)

    const activateHit2 = new Activate({
      variationGroupId: 'varGroupId',
      variationId: 'varId',
      visitorId: newVisitorId,
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
    activateHit2.config = config

    await batchingStrategy.activateFlag(activateHit2)

    expect(hitsPoolQueue.size).toBe(4)
    expect(cacheHit).toBeCalledTimes(6)
    expect(cacheHit).toHaveBeenNthCalledWith(6, new Map().set(expect.stringContaining(newVisitorId), activateHit2))
    expect(flushHits).toBeCalledTimes(0)
    expect(activatePoolQueue.size).toBe(2)

    const consentHitFalse2 = new Event({
      visitorId,
      label: `${SDK_INFO.name}:${false}`,
      action: FS_CONSENT,
      category: EventCategory.USER_ENGAGEMENT
    })

    await batchingStrategy.addHit(consentHitFalse2)

    expect(hitsPoolQueue.size).toBe(3)
    expect(activatePoolQueue.size).toBe(1)
    expect(cacheHit).toBeCalledTimes(7)
    expect(cacheHit).toHaveBeenNthCalledWith(7, new Map().set(expect.stringContaining(visitorId), consentHitFalse2))
    expect(flushHits).toBeCalledTimes(1)
    expect(flushHits).toHaveBeenNthCalledWith(1, expect.arrayContaining([expect.stringContaining(visitorId)]))
  })
})

describe('test activateFlag method', () => {
  const methodNow = Date.now

  const mockNow = jest.fn<typeof Date.now>()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
    sendHitsToFsQaSpy.mockImplementation(() => {
      //
    })
  })
  afterAll(() => {
    Date.now = methodNow
  })

  const httpClient = new HttpClient()

  const postAsync = jest.spyOn(httpClient, 'postAsync')

  const onVisitorExposed = jest.fn<(arg: OnVisitorExposed)=>void>()

  const config = new DecisionApiConfig({
    envId: 'envId',
    apiKey: 'apiKey',
    onVisitorExposed
  })

  const logManager = new FlagshipLogManager()

  config.logManager = logManager

  const hitsPoolQueue = new Map<string, HitAbstract>()
  const activatePoolQueue = new Map<string, Activate>()
  const troubleshootingQueue = new Map<string, Troubleshooting>()
  const analyticHitQueue = new Map<string, UsageHit>()
  const batchingStrategy = new BatchingContinuousCachingStrategy({ config, httpClient, hitsPoolQueue, activatePoolQueue, troubleshootingQueue, analyticHitQueue })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cacheHitSpy = jest.spyOn(batchingStrategy as any, 'cacheHit')

  const flushHitsSpy = jest.spyOn(batchingStrategy, 'flushHits')

  const sendHitsToFsQaSpy = jest.spyOn(batchingStrategy, 'sendHitsToFsQa')

  const visitorId = 'visitorId'

  const nextFetchConfig = {
    revalidate: 20
  }

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

    const variationGroupId = 'variationGrID-activate'
    const variationId = 'variationId'
    const flagKey = 'flagKey'
    const flagValue = 'value'
    const flagDefaultValue = 'default-value'
    const flagMetadata = {
      campaignId: 'campaignId',
      variationGroupId: 'variationGrID',
      variationId: 'varId',
      isReference: true,
      campaignType: 'ab',
      slug: 'slug',
      campaignName: 'campaignName',
      variationGroupName: 'variationGroupName',
      variationName: 'variationName'
    }
    const visitorContext = { key: 'value' }

    const activateHit = new Activate({
      visitorId,
      variationGroupId,
      variationId,
      flagKey,
      flagValue,
      flagDefaultValue,
      flagMetadata,
      visitorContext
    })
    activateHit.config = config
    activateHit.key = visitorId

    expect(hitsPoolQueue.size).toBe(0)

    await batchingStrategy.activateFlag(activateHit)

    expect(hitsPoolQueue.size).toBe(0)
    expect(activatePoolQueue.size).toBe(0)

    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toHaveBeenNthCalledWith(1,
      urlActivate, {
        headers: headersActivate,
        nextFetchConfig,
        body: new ActivateBatch([activateHit], config).toApiKeys(),
        timeout: config.timeout
      })

    expect(sendHitsToFsQaSpy).toBeCalledTimes(1)
    expect(sendHitsToFsQaSpy).toBeCalledWith([activateHit])

    let fromFlag : IExposedFlag = {
      key: activateHit.flagKey,
      value: activateHit.flagValue,
      defaultValue: activateHit.flagDefaultValue,
      metadata: activateHit.flagMetadata
    }

    const exposedVisitor: IExposedVisitor = {
      id: activateHit.visitorId,
      anonymousId: activateHit.anonymousId,
      context: activateHit.visitorContext
    }
    expect(onVisitorExposed).toBeCalledTimes(1)
    expect(onVisitorExposed).toBeCalledWith({ exposedVisitor, fromFlag })

    fromFlag = {
      metadata: {
        campaignId: activateHit.flagMetadata.campaignId,
        campaignType: activateHit.flagMetadata.campaignType,
        slug: activateHit.flagMetadata.slug,
        isReference: activateHit.flagMetadata.isReference,
        variationGroupId: activateHit.flagMetadata.variationGroupId,
        variationId: activateHit.flagMetadata.variationId,
        campaignName: activateHit.flagMetadata.campaignName,
        variationGroupName: activateHit.flagMetadata.variationGroupName,
        variationName: activateHit.flagMetadata.variationName
      },
      key: activateHit.flagKey,
      value: activateHit.flagValue,
      defaultValue: activateHit.flagDefaultValue
    }

    expect(onVisitorExposed).toBeCalledTimes(1)
    expect(onVisitorExposed).toBeCalledWith({ fromFlag, exposedVisitor })

    expect(flushHitsSpy).toBeCalledTimes(0)
  })

  it('test multiple activate success', async () => {
    postAsync.mockResolvedValue({ status: 200, body: null })

    const activateHit = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate',
      variationId: 'variationId',
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
    activateHit.config = config
    activateHit.key = visitorId

    const activateHit2 = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate-2',
      variationId: 'variationId-2',
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

    activateHit2.config = config
    activateHit2.key = visitorId + 'key-2'

    const activateHit3 = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate-3',
      variationId: 'variationId-3',
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
    activateHit3.config = config
    activateHit3.key = visitorId + 'key-3'

    activatePoolQueue.set(activateHit2.key, activateHit2).set(activateHit3.key, activateHit3)

    expect(hitsPoolQueue.size).toBe(0)
    expect(activatePoolQueue.size).toBe(2)

    await batchingStrategy.activateFlag(activateHit)

    expect(hitsPoolQueue.size).toBe(0)
    expect(activatePoolQueue.size).toBe(0)

    expect(postAsync).toBeCalledTimes(1)
    const activateBatch = new ActivateBatch([activateHit2, activateHit3, activateHit], config)
    expect(postAsync).toHaveBeenNthCalledWith(1, urlActivate, {
      headers: headersActivate,
      nextFetchConfig,
      body: activateBatch.toApiKeys(),
      timeout: config.timeout
    })

    expect(sendHitsToFsQaSpy).toBeCalledTimes(1)
    expect(sendHitsToFsQaSpy).toBeCalledWith(activateBatch.hits)

    expect(onVisitorExposed).toBeCalledTimes(3)
    expect(cacheHitSpy).toBeCalledTimes(0)
    expect(flushHitsSpy).toBeCalledTimes(1)
    expect(flushHitsSpy).toHaveBeenCalledWith([activateHit2.key, activateHit3.key])
  })

  it('test multiple activate failed', async () => {
    const error = 'message error'
    postAsync.mockRejectedValue(error)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sendTroubleshootingHit = jest.spyOn((batchingStrategy as any), 'sendTroubleshootingHit')

    const activateHit = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate',
      variationId: 'variationId',
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
    activateHit.config = config
    activateHit.key = visitorId

    const activateHit2 = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate-2',
      variationId: 'variationId-2',
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

    activateHit2.config = config
    activateHit2.key = visitorId + 'key-2'

    const activateHit3 = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate-3',
      variationId: 'variationId-3',
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
      nextFetchConfig,
      body: new ActivateBatch([activateHit2, activateHit3, activateHit], config).toApiKeys(),
      timeout: config.timeout
    })

    expect(onVisitorExposed).toBeCalledTimes(0)
    expect(flushHitsSpy).toBeCalledTimes(0)
    expect(cacheHitSpy).toBeCalledTimes(1)
    expect(cacheHitSpy).toHaveBeenCalledWith(new Map([[activateHit.key, activateHit]]))

    expect(sendTroubleshootingHit).toBeCalledTimes(1)
    const label = TroubleshootingLabel.SEND_ACTIVATE_HIT_ROUTE_ERROR
    expect(sendTroubleshootingHit).toBeCalledWith(expect.objectContaining({ label }))
  })

  it('test activate on BUCKETING_EDGE', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    postAsync.mockResolvedValue({ status: 200, body: null })

    const config = new EdgeConfig({ envId: 'envId', apiKey: 'apiKey', initialBucketing: {} })

    const batchingStrategy = new BatchingContinuousCachingStrategy({ config, httpClient, hitsPoolQueue, activatePoolQueue, troubleshootingQueue, analyticHitQueue })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cacheHit = jest.spyOn(batchingStrategy as any, 'cacheHit')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flushHits = jest.spyOn(batchingStrategy as any, 'flushHits')

    const activateHit = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate',
      variationId: 'variationId',
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

    activateHit.config = config
    activateHit.key = visitorId

    expect(hitsPoolQueue.size).toBe(0)

    await batchingStrategy.activateFlag(activateHit)

    expect(hitsPoolQueue.size).toBe(0)
    expect(activatePoolQueue.size).toBe(4)

    expect(cacheHit).toBeCalledTimes(1)

    expect(flushHits).toBeCalledTimes(0)
  })
})

describe('test sendBatch method', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
    sendHitsToFsQaSpy.mockImplementation(() => {
      //
    })
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
  const analyticHitQueue = new Map<string, UsageHit>()
  const batchingStrategy = new BatchingContinuousCachingStrategy({ config, httpClient, hitsPoolQueue, activatePoolQueue, troubleshootingQueue, analyticHitQueue })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cacheHitSpy = jest.spyOn(batchingStrategy as any, 'cacheHit')

  const flushHitsSpy = jest.spyOn(batchingStrategy, 'flushHits')

  const sendHitsToFsQaSpy = jest.spyOn(batchingStrategy, 'sendHitsToFsQa')

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

  const nextFetchConfig = {
    revalidate: 20
  }

  const urlActivate = `${BASE_API_URL}${URL_ACTIVATE_MODIFICATION}`
  it('test sendBatch method success', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    postAsync.mockResolvedValue({ status: 200, body: null })

    const batch:Batch = new Batch({ hits: [] })
    batch.config = config
    config.trackingManagerConfig.batchIntervals = 25
    config.logLevel = LogLevel.NONE

    for (let index = 0; index < 71; index++) {
      const pageHit = new Page({
        documentLocation: ('http://localhost' + index).repeat(2000),
        visitorId
      })

      await batchingStrategy.addHit(pageHit)
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
      nextFetchConfig,
      body: batch.toApiKeys(),
      timeout: config.timeout
    })

    expect(sendHitsToFsQaSpy).toBeCalledTimes(1)
    expect(sendHitsToFsQaSpy).toBeCalledWith(batch.hits)

    expect(flushHitsSpy).toBeCalledTimes(1)
    expect(flushHitsSpy).toHaveBeenCalledWith(expect.arrayContaining([expect.stringContaining(visitorId)]))

    await batchingStrategy.sendBatch()

    expect(postAsync).toBeCalledTimes(2)
    expect(hitsPoolQueue.size).toBe(0)
  })

  it('test sendBatch method hit expired', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    postAsync.mockResolvedValue({ status: 200, body: null })

    const batch:Batch = new Batch({ hits: [] })
    batch.config = config
    config.trackingManagerConfig.batchIntervals = 25
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
      nextFetchConfig,
      body: batch.toApiKeys(),
      timeout: config.timeout
    })

    expect(flushHitsSpy).toBeCalledTimes(1)
    expect(flushHitsSpy).toHaveBeenCalledWith(expect.arrayContaining([expect.stringContaining(visitorId)]))
  })

  it('test sendBatch with poolMaxSize', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    postAsync.mockResolvedValue({ status: 200, body: null })

    const batch:Batch = new Batch({ hits: [] })
    batch.config = config
    config.trackingManagerConfig.poolMaxSize = 20

    for (let index = 0; index < 20; index++) {
      const pageHit = new Page({
        documentLocation: 'http://localhost' + index,
        visitorId
      })

      batch.hits.push(pageHit)

      await batchingStrategy.addHit(pageHit)
    }

    await sleep(500)

    expect(hitsPoolQueue.size).toBe(0)

    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toHaveBeenNthCalledWith(1, HIT_EVENT_URL, {
      headers,
      nextFetchConfig,
      body: batch.toApiKeys(),
      timeout: config.timeout
    })
    expect(flushHitsSpy).toBeCalledTimes(1)
    expect(flushHitsSpy).toHaveBeenCalledWith(expect.arrayContaining([expect.stringContaining(visitorId)]))
  })

  it('test sendBatch method throw exception ', async () => {
    const error = 'message error'
    postAsync.mockRejectedValue(error)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sendTroubleshootingHit = jest.spyOn((batchingStrategy as any), 'sendTroubleshootingHit')

    config.logLevel = LogLevel.ALL
    const batch:Batch = new Batch({ hits: [globalPageHit] })
    batch.config = config
    hitsPoolQueue.set(globalPageHit.key, globalPageHit)

    await batchingStrategy.sendBatch()

    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toBeCalledWith(HIT_EVENT_URL, {
      headers,
      nextFetchConfig,
      body: batch.toApiKeys(),
      timeout: config.timeout
    })

    const errorFormatMessage = {
      httpRequestBody: batch.toApiKeys(),
      httpRequestHeaders: headers,
      httpRequestMethod: 'POST',
      httpRequestUrl: HIT_EVENT_URL,
      duration: 0,
      batchTriggeredBy: BatchTriggeredBy[BatchTriggeredBy.BatchLength]
    }
    expect(sendHitsToFsQaSpy).toBeCalledTimes(0)
    expect(flushHitsSpy).toBeCalledTimes(0)
    expect(cacheHitSpy).toBeCalledTimes(0)
    expect(hitsPoolQueue.size).toBe(1)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(TRACKING_MANAGER_ERROR, BATCH_HIT, errorFormatMessage), TRACKING_MANAGER)
    const label = TroubleshootingLabel.SEND_BATCH_HIT_ROUTE_RESPONSE_ERROR
    expect(sendTroubleshootingHit).toBeCalledWith(expect.objectContaining({ label }))
  })

  it('test sendActivate on batch', async () => {
    postAsync.mockResolvedValue({ status: 200, body: null })

    const activateHit = new Activate({
      visitorId,
      variationGroupId: 'variationGrID-activate',
      variationId: 'variationId',
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
      nextFetchConfig,
      body: new ActivateBatch([activateHit], config).toApiKeys(),
      timeout: config.timeout
    })
  })

  it('test sendBatch method with empty hitsPoolQueue', async () => {
    const hitsPoolQueue = new Map<string, HitAbstract>()
    const activatePoolQueue = new Map<string, Activate>()
    const troubleshootingQueue = new Map<string, Troubleshooting>()
    const analyticHitQueue = new Map<string, UsageHit>()
    const batchingStrategy = new BatchingContinuousCachingStrategy({ config, httpClient, hitsPoolQueue, activatePoolQueue, troubleshootingQueue, analyticHitQueue })
    await batchingStrategy.sendBatch()
    expect(postAsync).toBeCalledTimes(0)
  })
})

describe('test cacheHit and flushHits methods', () => {
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

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
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
  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

  config.logManager = logManager

  const hitsPoolQueue = new Map<string, HitAbstract>()
  const activatePoolQueue = new Map<string, Activate>()
  const troubleshootingQueue = new Map<string, Troubleshooting>()
  const analyticHitQueue = new Map<string, UsageHit>()
  const batchingStrategy = new BatchingContinuousCachingStrategy({ config, httpClient, hitsPoolQueue, activatePoolQueue, troubleshootingQueue, analyticHitQueue })
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
    expect(logError).toBeCalledWith(sprintf(HIT_CACHE_ERROR, 'cacheHit', error), PROCESS_CACHE)
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
    expect(logError).toBeCalledWith(sprintf(HIT_CACHE_ERROR, 'flushHits', error), PROCESS_CACHE)
  })

  it('test flushAllHits method', async () => {
    await batchingStrategy.flushAllHits()
    expect(flushAllHits).toBeCalledTimes(1)
  })

  it('test flushAllHits method throw exception', async () => {
    const error = 'message'
    flushAllHits.mockRejectedValue(error)
    await batchingStrategy.flushAllHits()
    expect(flushAllHits).toBeCalledTimes(1)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(HIT_CACHE_ERROR, 'flushAllHits', error), PROCESS_CACHE)
  })
})

describe('test send troubleshooting hit', () => {
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

  const config = new DecisionApiConfig({
    envId: 'envId',
    apiKey: 'apiKey'
  })
  const logManager = new FlagshipLogManager()

  config.logManager = logManager

  const hitsPoolQueue = new Map<string, HitAbstract>()
  const activatePoolQueue = new Map<string, Activate>()
  const troubleshootingQueue = new Map<string, Troubleshooting>()
  const analyticHitQueue = new Map<string, UsageHit>()
  const flagshipInstanceId = 'flagshipInstanceId'
  const batchingStrategy = new BatchingContinuousCachingStrategy({ config, httpClient, hitsPoolQueue, activatePoolQueue, troubleshootingQueue, flagshipInstanceId, analyticHitQueue })

  const visitorId = 'visitorId'
  const visitorSessionId = 'visitorSessionId'

  const activateHit = new Activate({
    visitorId,
    variationGroupId: 'variationGrID-activate',
    variationId: 'variationId',
    flagKey: 'flagKey',
    flagValue: 'value',
    flagDefaultValue: 'default-value',
    flagMetadata: {
      campaignId: 'campaignId',
      campaignName: 'campaignName',
      variationGroupId: 'variationGrID',
      variationGroupName: 'variationGroupName',
      variationId: 'varId',
      variationName: 'variationName',
      isReference: true,
      campaignType: 'ab',
      slug: 'slug'
    },
    visitorContext: { key: 'value' }
  })

  activateHit.config = config

  const activateTroubleshooting = new Troubleshooting({
    label: TroubleshootingLabel.VISITOR_SEND_ACTIVATE,
    logLevel: LogLevel.INFO,
    traffic: 2,
    visitorId: activateHit.visitorId,
    flagshipInstanceId,
    visitorSessionId,
    anonymousId: activateHit.anonymousId,
    config,
    hitContent: activateHit.toApiKeys()
  })

  it('test troubleshootingData === undefined', async () => {
    postAsync.mockResolvedValue({ status: 200, body: null })

    const activateTroubleshooting = new Troubleshooting({
      label: TroubleshootingLabel.VISITOR_SEND_ACTIVATE,
      logLevel: LogLevel.INFO,
      traffic: 50,
      visitorId: activateHit.visitorId,
      flagshipInstanceId,
      visitorSessionId,
      anonymousId: activateHit.anonymousId,
      config,
      hitContent: activateHit.toApiKeys()
    })

    batchingStrategy.troubleshootingData = undefined

    expect(batchingStrategy.flagshipInstanceId).toBe(flagshipInstanceId)
    expect(troubleshootingQueue.size).toBe(0)
    await batchingStrategy.sendTroubleshootingHit(activateTroubleshooting)
    expect(troubleshootingQueue.size).toBe(0)
    expect(postAsync).toBeCalledTimes(0)
  })

  it('test troubleshooting has not started yet', async () => {
    postAsync.mockResolvedValue({ status: 200, body: null })

    const activateTroubleshooting = new Troubleshooting({
      label: TroubleshootingLabel.VISITOR_SEND_ACTIVATE,
      logLevel: LogLevel.INFO,
      traffic: 50,
      visitorId: activateHit.visitorId,
      flagshipInstanceId,
      visitorSessionId,
      anonymousId: activateHit.anonymousId,
      config,
      hitContent: activateHit.toApiKeys()
    })

    const startDate = new Date()
    startDate.setMinutes(startDate.getMinutes() + 2)
    const endDate = new Date()
    endDate.setMinutes(startDate.getMinutes() + 2)

    batchingStrategy.troubleshootingData = {
      startDate,
      endDate,
      traffic: 100,
      timezone: ''
    }

    expect(troubleshootingQueue.size).toBe(0)
    await batchingStrategy.sendTroubleshootingHit(activateTroubleshooting)
    expect(troubleshootingQueue.size).toBe(0)
    expect(postAsync).toBeCalledTimes(0)
  })

  it('test troubleshooting is finished', async () => {
    postAsync.mockResolvedValue({ status: 200, body: null })

    const activateTroubleshooting = new Troubleshooting({
      label: TroubleshootingLabel.VISITOR_SEND_ACTIVATE,
      logLevel: LogLevel.INFO,
      traffic: 50,
      visitorId: activateHit.visitorId,
      flagshipInstanceId,
      visitorSessionId,
      anonymousId: activateHit.anonymousId,
      config,
      hitContent: activateHit.toApiKeys()
    })

    const startDate = new Date()
    startDate.setMinutes(startDate.getMinutes() - 5)
    const endDate = new Date()
    endDate.setMinutes(endDate.getMinutes() - 2)

    batchingStrategy.troubleshootingData = {
      startDate,
      endDate,
      traffic: 100,
      timezone: ''
    }

    expect(troubleshootingQueue.size).toBe(0)
    await batchingStrategy.sendTroubleshootingHit(activateTroubleshooting)
    expect(troubleshootingQueue.size).toBe(0)
    expect(postAsync).toBeCalledTimes(0)
  })

  it('test troubleshooting.traffic < hit.traffic', async () => {
    postAsync.mockResolvedValue({ status: 200, body: null })

    const activateTroubleshooting = new Troubleshooting({
      label: TroubleshootingLabel.VISITOR_SEND_ACTIVATE,
      logLevel: LogLevel.INFO,
      traffic: 50,
      visitorId: activateHit.visitorId,
      flagshipInstanceId,
      visitorSessionId,
      anonymousId: activateHit.anonymousId,
      config,
      hitContent: activateHit.toApiKeys()
    })

    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setMinutes(startDate.getMinutes() + 2)

    batchingStrategy.troubleshootingData = {
      startDate,
      endDate,
      traffic: 30,
      timezone: ''
    }

    expect(troubleshootingQueue.size).toBe(0)
    await batchingStrategy.sendTroubleshootingHit(activateTroubleshooting)
    expect(troubleshootingQueue.size).toBe(0)
    expect(postAsync).toBeCalledTimes(0)
  })

  it('test sendTroubleshootingHit', async () => {
    postAsync.mockResolvedValue({ status: 200, body: null })

    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setMinutes(startDate.getMinutes() + 2)

    batchingStrategy.troubleshootingData = {
      startDate,
      endDate,
      traffic: 100,
      timezone: ''
    }

    expect(troubleshootingQueue.size).toBe(0)

    await batchingStrategy.sendTroubleshootingHit(activateTroubleshooting)
    expect(troubleshootingQueue.size).toBe(0)
    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toHaveBeenNthCalledWith(1,
      TROUBLESHOOTING_HIT_URL, {
        body: activateTroubleshooting.toApiKeys()
      })
  })

  it('test sendTroubleshootingHit failed', async () => {
    const error = new Error()
    postAsync.mockRejectedValue(error)

    const activateTroubleshooting = new Troubleshooting({
      label: TroubleshootingLabel.VISITOR_SEND_ACTIVATE,
      logLevel: LogLevel.INFO,
      traffic: 2,
      visitorId: activateHit.visitorId,
      flagshipInstanceId,
      visitorSessionId,
      anonymousId: activateHit.anonymousId,
      config,
      hitContent: activateHit.toApiKeys()
    })

    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setMinutes(startDate.getMinutes() + 2)

    batchingStrategy.troubleshootingData = {
      startDate,
      endDate,
      traffic: 100,
      timezone: ''
    }

    expect(troubleshootingQueue.size).toBe(0)
    await batchingStrategy.sendTroubleshootingHit(activateTroubleshooting)
    expect(troubleshootingQueue.size).toBe(1)
    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toHaveBeenNthCalledWith(1,
      TROUBLESHOOTING_HIT_URL, {
        body: activateTroubleshooting.toApiKeys()
      })
  })

  it('test sendTroubleshootingQueue', async () => {
    postAsync.mockResolvedValue({ status: 200, body: null })

    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setMinutes(startDate.getMinutes() + 2)

    batchingStrategy.troubleshootingData = {
      startDate,
      endDate,
      traffic: 100,
      timezone: ''
    }

    expect(troubleshootingQueue.size).toBe(1)

    await batchingStrategy.sendTroubleshootingQueue()
    expect(troubleshootingQueue.size).toBe(0)
    expect(postAsync).toBeCalledTimes(1)

    await batchingStrategy.sendTroubleshootingQueue()
    expect(troubleshootingQueue.size).toBe(0)
    expect(postAsync).toBeCalledTimes(1)
  })
})

describe('test send analyticsHit hit', () => {
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

  const config = new DecisionApiConfig({
    envId: 'envId',
    apiKey: 'apiKey'
  })
  const logManager = new FlagshipLogManager()

  config.logManager = logManager

  const hitsPoolQueue = new Map<string, HitAbstract>()
  const activatePoolQueue = new Map<string, Activate>()
  const troubleshootingQueue = new Map<string, Troubleshooting>()
  const analyticHitQueue = new Map<string, UsageHit>()
  const flagshipInstanceId = 'flagshipInstanceId'
  const batchingStrategy = new BatchingContinuousCachingStrategy({ config, httpClient, hitsPoolQueue, activatePoolQueue, troubleshootingQueue, flagshipInstanceId, analyticHitQueue })

  const visitorId = 'visitorId'
  const visitorSessionId = 'visitorSessionId'

  const activateHit = new Activate({
    visitorId,
    variationGroupId: 'variationGrID-activate',
    variationId: 'variationId',
    flagKey: 'flagKey',
    flagValue: 'value',
    flagDefaultValue: 'default-value',
    flagMetadata: {
      campaignId: 'campaignId',
      campaignName: 'campaignName',
      variationGroupId: 'variationGrID',
      variationGroupName: 'variationGroupName',
      variationId: 'varId',
      variationName: 'variationName',
      isReference: true,
      campaignType: 'ab',
      slug: 'slug'
    },
    visitorContext: { key: 'value' }
  })

  activateHit.config = config

  const analyticHit = new UsageHit({
    label: TroubleshootingLabel.VISITOR_SEND_ACTIVATE,
    logLevel: LogLevel.INFO,
    traffic: 2,
    visitorId: activateHit.visitorId,
    flagshipInstanceId,
    visitorSessionId,
    anonymousId: activateHit.anonymousId,
    config,
    hitContent: activateHit.toApiKeys()
  })

  it('test sendAnalyticsHit', async () => {
    postAsync.mockResolvedValue({ status: 200, body: null })

    expect(analyticHitQueue.size).toBe(0)

    await batchingStrategy.sendUsageHit(analyticHit)
    expect(analyticHitQueue.size).toBe(0)
    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toHaveBeenNthCalledWith(1,
      USAGE_HIT_URL, {
        body: analyticHit.toApiKeys()
      })
  })

  it('test sendAnalyticsHit failed', async () => {
    const error = new Error()
    postAsync.mockRejectedValue(error)

    expect(analyticHitQueue.size).toBe(0)

    await batchingStrategy.sendUsageHit(analyticHit)
    expect(analyticHitQueue.size).toBe(1)
    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toHaveBeenNthCalledWith(1,
      USAGE_HIT_URL, {
        body: analyticHit.toApiKeys()
      })
  })

  it('test sendAnalyticsHitQueue', async () => {
    postAsync.mockResolvedValue({ status: 200, body: null })

    expect(analyticHitQueue.size).toBe(1)

    await batchingStrategy.sendUsageHitQueue()
    expect(analyticHitQueue.size).toBe(0)
    expect(postAsync).toBeCalledTimes(1)
    expect(postAsync).toHaveBeenNthCalledWith(1,
      USAGE_HIT_URL, {
        body: analyticHit.toApiKeys()
      })
  })

  it('test empty sendAnalyticsHitQueue', async () => {
    postAsync.mockResolvedValue({ status: 200, body: null })

    expect(analyticHitQueue.size).toBe(0)

    await batchingStrategy.sendUsageHitQueue()
    expect(analyticHitQueue.size).toBe(0)
    expect(postAsync).toBeCalledTimes(0)
  })
})

describe('test sendHitsToFsQa', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
  const isBrowserSpy = jest.spyOn(utils, 'isBrowser')
  const sendFsHitToQASpy = jest.spyOn(qaAssistant, 'sendFsHitToQA')

  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
    isBrowserSpy.mockReturnValue(false)
  })

  beforeEach(() => {
    config.isQAModeEnabled = true
    postAsync.mockResolvedValue({ status: 200, body: null })
    sendFsHitToQASpy.mockImplementation(() => {
      //
    })
    isBrowserSpy.mockReturnValue(true)
  })

  const httpClient = new HttpClient()

  const postAsync = jest.spyOn(httpClient, 'postAsync')

  const config = new DecisionApiConfig({
    envId: 'envId',
    apiKey: 'apiKey'
  })

  const logManager = new FlagshipLogManager()

  config.logManager = logManager

  const hitsPoolQueue = new Map<string, HitAbstract>()
  const activatePoolQueue = new Map<string, Activate>()
  const troubleshootingQueue = new Map<string, Troubleshooting>()
  const analyticHitQueue = new Map<string, UsageHit>()
  const flagshipInstanceId = 'flagshipInstanceId'
  const batchingStrategy = new BatchingContinuousCachingStrategy({ config, httpClient, hitsPoolQueue, activatePoolQueue, troubleshootingQueue, flagshipInstanceId, analyticHitQueue })

  const visitorId = 'visitorId'

  const activateHit = new Activate({
    visitorId,
    variationGroupId: 'variationGrID-activate',
    variationId: 'variationId',
    flagKey: 'flagKey',
    flagValue: 'value',
    flagDefaultValue: 'default-value',
    flagMetadata: {
      campaignId: 'campaignId',
      campaignName: 'campaignName',
      variationGroupId: 'variationGrID',
      variationGroupName: 'variationGroupName',
      variationId: 'varId',
      variationName: 'variationName',
      isReference: true,
      campaignType: 'ab',
      slug: 'slug'
    },
    visitorContext: { key: 'value' }
  })

  activateHit.config = config

  it('test environment is not a browser', async () => {
    isBrowserSpy.mockReturnValue(false)
    await batchingStrategy.activateFlag(activateHit)
    expect(sendFsHitToQASpy).toBeCalledTimes(0)
  })
  it('test QA Mode is disable  ', async () => {
    config.isQAModeEnabled = false
    await batchingStrategy.activateFlag(activateHit)
    expect(sendFsHitToQASpy).toBeCalledTimes(0)
  })
  it('test activate to QA', async () => {
    await batchingStrategy.activateFlag(activateHit)
    await batchingStrategy.activateFlag(activateHit)
    await sleep(3200)
    expect(sendFsHitToQASpy).toBeCalledTimes(1)
    expect(sendFsHitToQASpy).toBeCalledWith([activateHit.toApiKeys(), activateHit.toApiKeys()])
  })

  it('test multiple activate to QA', async () => {
    const hitsApiKeys:Record<string, unknown>[] = []
    for (let index = 0; index < 10; index++) {
      activatePoolQueue.set(`${visitorId}${index}`, activateHit)
      hitsApiKeys.push(activateHit.toApiKeys())
    }
    await batchingStrategy.activateFlag(activateHit)
    hitsApiKeys.push(activateHit.toApiKeys())
    expect(sendFsHitToQASpy).toBeCalledTimes(1)
    expect(sendFsHitToQASpy).toBeCalledWith(hitsApiKeys)
  })
})
