import { jest, expect, it, describe } from '@jest/globals'
import { DecisionApiConfig, IVisitorCacheImplementation } from '../../src'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager } from '../../src/config'
import { ApiManager } from '../../src/decision/ApiManager'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient, IHttpResponse, IHttpOptions } from '../../src/utils/HttpClient'
import { VisitorDelegate, DefaultStrategy, NoConsentStrategy, NotReadyStrategy, PanicStrategy } from '../../src/visitor'
import { Mock } from 'jest-mock'
import { VISITOR_CACHE_VERSION } from '../../src/enum'
import { campaigns } from '../decision/campaigns'
import { VisitorCacheDTO } from '../../src/types'
import { LOOKUP_VISITOR_JSON_OBJECT_ERROR, VISITOR_ID_MISMATCH_ERROR } from '../../src/visitor/VisitorStrategyAbstract'
import { sprintf } from '../../src/utils/utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getUndefined = ():any => undefined

describe('test visitor cache', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')
  const logInfo = jest.spyOn(logManager, 'info')

  const cacheVisitor:Mock<Promise<void>, [visitorId: string, data: VisitorCacheDTO]> = jest.fn()
  const lookupVisitor:Mock<Promise<VisitorCacheDTO>, [visitorId: string]> = jest.fn()
  const flushVisitor:Mock<Promise<void>, [visitorId: string]> = jest.fn()
  const visitorCacheImplementation:IVisitorCacheImplementation = {
    cacheVisitor,
    lookupVisitor,
    flushVisitor
  }

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', visitorCacheImplementation })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post: Mock<
      Promise<IHttpResponse>,
      [url: string, options: IHttpOptions]
    > = jest.fn()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const getCampaignsAsync = jest.spyOn(apiManager, 'getCampaignsAsync')

  const trackingManager = new TrackingManager(httpClient, config)

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getStrategy = jest.spyOn(visitorDelegate, 'getStrategy' as any)

  const defaultStrategy = new DefaultStrategy(visitorDelegate)

  const noConsentStrategy = new NoConsentStrategy(visitorDelegate)

  const notReadyStrategy = new NotReadyStrategy(visitorDelegate)

  const assignmentsHistory:Record<string, string> = {}

  const data: VisitorCacheDTO = {
    version: VISITOR_CACHE_VERSION,
    data: {
      visitorId: visitorDelegate.visitorId,
      anonymousId: visitorDelegate.anonymousId,
      consent: visitorDelegate.hasConsented,
      context: visitorDelegate.context,
      campaigns: campaigns.campaigns.map(campaign => {
        assignmentsHistory[campaign.variationGroupId] = campaign.variation.id
        return {
          campaignId: campaign.id,
          slug: campaign.slug,
          variationGroupId: campaign.variationGroupId,
          variationId: campaign.variation.id,
          isReference: campaign.variation.reference,
          type: campaign.variation.modifications.type,
          activated: false,
          flags: campaign.variation.modifications.value
        }
      }),
      assignmentsHistory
    }
  }

  it('test saveCache defaultStrategy', async () => {
    getStrategy.mockReturnValue(defaultStrategy)
    getCampaignsAsync.mockResolvedValue(campaigns.campaigns)
    await visitorDelegate.fetchFlags()
    expect(cacheVisitor).toBeCalledTimes(1)

    expect(cacheVisitor).toBeCalledWith(visitorId, data)
  })

  it('test saveCache noConsentStrategy', async () => {
    getStrategy.mockReturnValue(noConsentStrategy)
    getCampaignsAsync.mockResolvedValue(campaigns.campaigns)
    await visitorDelegate.synchronizeModifications()
    expect(cacheVisitor).toBeCalledTimes(0)
  })

  it('test saveCache notReadyStrategy', async () => {
    getStrategy.mockReturnValue(notReadyStrategy)
    getCampaignsAsync.mockResolvedValue(campaigns.campaigns)
    await visitorDelegate.synchronizeModifications()
    expect(cacheVisitor).toBeCalledTimes(0)
  })

  it('test saveCache', async () => {
    getStrategy.mockReturnValue(defaultStrategy)
    config.visitorCacheImplementation = getUndefined()
    getCampaignsAsync.mockResolvedValue(campaigns.campaigns)
    await visitorDelegate.synchronizeModifications()
    expect(cacheVisitor).toBeCalledTimes(0)
    config.visitorCacheImplementation = visitorCacheImplementation
  })

  it('test saveCache failed', async () => {
    getStrategy.mockReturnValue(defaultStrategy)
    const saveCacheError = 'Error Cache'
    cacheVisitor.mockImplementationOnce(() => {
      throw saveCacheError
    })
    getCampaignsAsync.mockResolvedValue(campaigns.campaigns)
    await visitorDelegate.synchronizeModifications()
    expect(cacheVisitor).toBeCalledTimes(1)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(saveCacheError, 'cacheVisitor')
  })

  it('test fetchVisitorCacheCampaigns defaultStrategy', async () => {
    getCampaignsAsync.mockResolvedValue(null)

    const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true })
    const defaultStrategy = new DefaultStrategy(visitorDelegate)

    visitorDelegate.visitorCache = data as VisitorCacheDTO
    await defaultStrategy.synchronizeModifications()
    expect(visitorDelegate.campaigns).toEqual(campaigns.campaigns)
  })

  it('test fetchVisitorCacheCampaigns noConsentStrategy', async () => {
    getCampaignsAsync.mockResolvedValue(null)

    const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true })
    const noConsentStrategy = new NoConsentStrategy(visitorDelegate)

    visitorDelegate.visitorCache = data
    await noConsentStrategy.synchronizeModifications()
    expect(visitorDelegate.campaigns).toEqual([])
  })

  it('test fetchVisitorCacheCampaigns panicStrategy', async () => {
    getCampaignsAsync.mockResolvedValue(null)

    const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true })
    const noConsentStrategy = new PanicStrategy(visitorDelegate)

    visitorDelegate.visitorCache = data
    await noConsentStrategy.synchronizeModifications()
    expect(visitorDelegate.campaigns).toEqual([])
  })

  it('test fetchVisitorCacheCampaigns', async () => {
    getCampaignsAsync.mockResolvedValue([])

    const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true })
    const defaultStrategy = new DefaultStrategy(visitorDelegate)

    visitorDelegate.visitorCache = {
      version: VISITOR_CACHE_VERSION,
      data: {
        visitorId: visitorDelegate.visitorId,
        anonymousId: visitorDelegate.anonymousId,
        consent: visitorDelegate.hasConsented,
        context: visitorDelegate.context
      }
    }
    await defaultStrategy.synchronizeModifications()
    expect(visitorDelegate.campaigns).toEqual([])
  })

  it('test lookupVisitor defaultStrategy', async () => {
    getStrategy.mockReturnValue(defaultStrategy)
    lookupVisitor.mockResolvedValue((data))
    await defaultStrategy.lookupVisitor()
    expect(lookupVisitor).toBeCalledTimes(1)
    expect(visitorDelegate.visitorCache).toEqual(data)
  })

  it('test lookupVisitor defaultStrategy different visitorID', async () => {
    const data: VisitorCacheDTO = {
      version: VISITOR_CACHE_VERSION,
      data: {
        visitorId: 'any',
        anonymousId: visitorDelegate.anonymousId,
        consent: visitorDelegate.hasConsented,
        context: visitorDelegate.context,
        campaigns: campaigns.campaigns.map(campaign => {
          assignmentsHistory[campaign.variationGroupId] = campaign.variation.id
          return {
            campaignId: campaign.id,
            slug: campaign.slug,
            variationGroupId: campaign.variationGroupId,
            variationId: campaign.variation.id,
            isReference: campaign.variation.reference,
            type: campaign.variation.modifications.type,
            activated: false,
            flags: campaign.variation.modifications.value
          }
        }),
        assignmentsHistory
      }
    }
    visitorDelegate.visitorCache = getUndefined()
    lookupVisitor.mockResolvedValue((data))
    await defaultStrategy.lookupVisitor()
    expect(lookupVisitor).toBeCalledTimes(1)
    expect(visitorDelegate.visitorCache).toBeUndefined()
    expect(logInfo).toBeCalledTimes(1)
    expect(logInfo).toBeCalledWith(sprintf(VISITOR_ID_MISMATCH_ERROR, 'any', visitorDelegate.visitorId), 'lookupVisitor')
  })

  it('test lookupVisitor noConsentStrategy', async () => {
    lookupVisitor.mockResolvedValue((data))
    await noConsentStrategy.lookupVisitor()
    expect(lookupVisitor).toBeCalledTimes(0)
  })

  it('test lookupVisitor notReadyStrategy', async () => {
    lookupVisitor.mockResolvedValue((data))
    await notReadyStrategy.lookupVisitor()
    expect(lookupVisitor).toBeCalledTimes(0)
  })

  it('test lookupVisitor', async () => {
    const data = {
      version: VISITOR_CACHE_VERSION,
      data: {
        visitorId: visitorDelegate.visitorId,
        anonymousId: visitorDelegate.anonymousId,
        consent: visitorDelegate.hasConsented,
        context: visitorDelegate.context
      }
    }
    lookupVisitor.mockResolvedValue((data))
    await defaultStrategy.lookupVisitor()
    expect(lookupVisitor).toBeCalledTimes(1)
    expect(visitorDelegate.visitorCache).toEqual(data)
  })

  it('test lookupVisitor', async () => {
    const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true })
    const defaultStrategy = new DefaultStrategy(visitorDelegate)
    const data = {
      data: {
        visitorId: visitorDelegate.visitorId,
        anonymousId: visitorDelegate.anonymousId,
        consent: visitorDelegate.hasConsented,
        context: visitorDelegate.context
      }
    }

    lookupVisitor.mockResolvedValue(data as VisitorCacheDTO)
    await defaultStrategy.lookupVisitor()
    expect(lookupVisitor).toBeCalledTimes(1)
    expect(visitorDelegate.visitorCache).toBeUndefined()
  })

  it('test lookupVisitor', async () => {
    const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true })
    const defaultStrategy = new DefaultStrategy(visitorDelegate)
    const data = {
      version: VISITOR_CACHE_VERSION,
      data: {

        anonymousId: visitorDelegate.anonymousId,
        consent: visitorDelegate.hasConsented,
        context: visitorDelegate.context
      }
    }

    lookupVisitor.mockResolvedValue(data as VisitorCacheDTO)
    await defaultStrategy.lookupVisitor()
    expect(lookupVisitor).toBeCalledTimes(1)
    expect(visitorDelegate.visitorCache).toBeUndefined()
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(LOOKUP_VISITOR_JSON_OBJECT_ERROR, 'lookupVisitor')
  })

  it('test lookupVisitor', async () => {
    const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true })
    const defaultStrategy = new DefaultStrategy(visitorDelegate)

    lookupVisitor.mockReturnValue(getUndefined())
    await defaultStrategy.lookupVisitor()
    expect(lookupVisitor).toBeCalledTimes(1)
    expect(visitorDelegate.visitorCache).toBeUndefined()
  })

  it('test lookupVisitor', async () => {
    const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true })
    const defaultStrategy = new DefaultStrategy(visitorDelegate)
    const data = {
      version: VISITOR_CACHE_VERSION,
      data: {
        visitorId: visitorDelegate.visitorId,
        anonymousId: visitorDelegate.anonymousId,
        consent: visitorDelegate.hasConsented,
        context: visitorDelegate.context,
        campaigns: {}
      }
    }

    lookupVisitor.mockResolvedValue(data as VisitorCacheDTO)
    await defaultStrategy.lookupVisitor()
    expect(lookupVisitor).toBeCalledTimes(1)
    expect(visitorDelegate.visitorCache).toBeUndefined()
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(LOOKUP_VISITOR_JSON_OBJECT_ERROR, 'lookupVisitor')
  })

  it('test lookupVisitor ', async () => {
    config.visitorCacheImplementation = getUndefined()
    await defaultStrategy.lookupVisitor()
    expect(lookupVisitor).toBeCalledTimes(0)
    config.visitorCacheImplementation = visitorCacheImplementation
  })

  it('test lookupVisitor ', async () => {
    const lookVisitorError = 'look Error'
    lookupVisitor.mockImplementationOnce(() => {
      throw lookVisitorError
    })
    await defaultStrategy.lookupVisitor()
    expect(lookupVisitor).toBeCalledTimes(1)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(lookVisitorError, 'lookupVisitor')
  })

  it('test flushVisitor ', async () => {
    visitorDelegate.setConsent(false)
    expect(flushVisitor).toBeCalledTimes(1)
    visitorDelegate.setConsent(true)
    expect(flushVisitor).toBeCalledTimes(1)
  })

  it('test flushVisitor ', async () => {
    const flushVisitorError = 'Error FlushVisitor'
    flushVisitor.mockImplementationOnce(() => {
      throw flushVisitorError
    })
    visitorDelegate.setConsent(false)
    expect(flushVisitor).toBeCalledTimes(1)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(flushVisitorError, 'flushVisitor')
  })

  it('test flushVisitor ', async () => {
    config.visitorCacheImplementation = getUndefined()
    visitorDelegate.setConsent(false)
    expect(flushVisitor).toBeCalledTimes(0)
    config.visitorCacheImplementation = visitorCacheImplementation
  })
})

describe('test visitorCache with disabledCache', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()

  const cacheVisitor:Mock<Promise<void>, [visitorId: string, data: VisitorCacheDTO]> = jest.fn()
  const lookupVisitor:Mock<Promise<VisitorCacheDTO>, [visitorId: string]> = jest.fn()
  const flushVisitor:Mock<Promise<void>, [visitorId: string]> = jest.fn()
  const visitorCacheImplementation:IVisitorCacheImplementation = {
    cacheVisitor,
    lookupVisitor,
    flushVisitor
  }

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', visitorCacheImplementation, disableCache: true })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post: Mock<
      Promise<IHttpResponse>,
      [url: string, options: IHttpOptions]
    > = jest.fn()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const getCampaignsAsync = jest.spyOn(apiManager, 'getCampaignsAsync')

  const trackingManager = new TrackingManager(httpClient, config)

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true })

  const defaultStrategy = new DefaultStrategy(visitorDelegate)

  it('test saveCache defaultStrategy', async () => {
    getCampaignsAsync.mockResolvedValue(campaigns.campaigns)
    await defaultStrategy.synchronizeModifications()
    expect(cacheVisitor).toBeCalledTimes(0)
  })

  it('test saveCache', async () => {
    getCampaignsAsync.mockResolvedValue(campaigns.campaigns)
    await defaultStrategy.synchronizeModifications()
    expect(cacheVisitor).toBeCalledTimes(0)
  })

  it('test lookupVisitor ', async () => {
    await defaultStrategy.lookupVisitor()
    expect(lookupVisitor).toBeCalledTimes(0)
  })

  it('test flushVisitor ', async () => {
    visitorDelegate.setConsent(false)
    expect(flushVisitor).toBeCalledTimes(0)
    visitorDelegate.setConsent(true)
    expect(flushVisitor).toBeCalledTimes(0)
  })
})
