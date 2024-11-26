import { LOOKUP_VISITOR_JSON_OBJECT_ERROR, PROCESS_CACHE, VISITOR_CACHE_ERROR } from './../../src/enum/FlagshipConstant'
import { jest, expect, it, describe } from '@jest/globals'
import { DecisionApiConfig, IVisitorCacheImplementation } from '../../src'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager } from '../../src/config'
import { ApiManager } from '../../src/decision/ApiManager'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient, IHttpResponse } from '../../src/utils/HttpClient'
import { VisitorDelegate, DefaultStrategy, NoConsentStrategy, NotReadyStrategy, PanicStrategy } from '../../src/visitor'
import { VISITOR_CACHE_VERSION } from '../../src/enum'
import { campaigns } from '../decision/campaigns'
import { FetchFlagsStatus, VisitorCacheDTO, VisitorCacheStatus } from '../../src/types'
import { sprintf } from '../../src/utils/utils'
import { MurmurHash } from '../../src/utils/MurmurHash'
import { VISITOR_ID_MISMATCH_ERROR } from '../../src/visitor/StrategyAbstract'
import { FSFetchStatus } from '../../src/enum/FSFetchStatus'
import { FSFetchReasons } from '../../src/enum/FSFetchReasons'
import { IEmotionAI } from '../../src/emotionAI/IEmotionAI'
import { VisitorAbstract } from '../../src/visitor/VisitorAbstract'

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

  const cacheVisitor = jest.fn<(visitorId: string, data: VisitorCacheDTO)=>Promise<void>>()
  const lookupVisitor = jest.fn<(visitorId: string)=>Promise<VisitorCacheDTO>>()
  const flushVisitor = jest.fn<(visitorId: string)=>Promise<void>>()
  const visitorCacheImplementation:IVisitorCacheImplementation = {
    cacheVisitor,
    lookupVisitor,
    flushVisitor
  }

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', visitorCacheImplementation, fetchFlagsBufferingTime: 0 })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const getCampaignsAsync = jest.spyOn(apiManager, 'getCampaignsAsync')

  const trackingManager = new TrackingManager(httpClient, config)

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const onFetchFlagsStatusChanged = jest.fn<({ status, reason }: FetchFlagsStatus) => void>()

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>()
  } as unknown as IEmotionAI

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true, onFetchFlagsStatusChanged, emotionAi })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getStrategy = jest.spyOn(visitorDelegate, 'getStrategy' as any)

  const murmurHash = new MurmurHash()

  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

  const noConsentStrategy = new NoConsentStrategy({ visitor: visitorDelegate, murmurHash })

  const notReadyStrategy = new NotReadyStrategy({ visitor: visitorDelegate, murmurHash })

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
    await visitorDelegate.fetchFlags()
    expect(cacheVisitor).toBeCalledTimes(0)
  })

  it('test saveCache notReadyStrategy', async () => {
    getStrategy.mockReturnValue(notReadyStrategy)
    getCampaignsAsync.mockResolvedValue(campaigns.campaigns)
    await visitorDelegate.fetchFlags()
    expect(cacheVisitor).toBeCalledTimes(0)
  })

  it('test saveCache', async () => {
    getStrategy.mockReturnValue(defaultStrategy)
    config.visitorCacheImplementation = getUndefined()
    getCampaignsAsync.mockResolvedValue(campaigns.campaigns)
    await visitorDelegate.fetchFlags()
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
    await visitorDelegate.fetchFlags()
    expect(cacheVisitor).toBeCalledTimes(1)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(VISITOR_CACHE_ERROR, visitorId, 'cacheVisitor', saveCacheError), PROCESS_CACHE)
  })

  it('test fetchVisitorCacheCampaigns defaultStrategy', async () => {
    getCampaignsAsync.mockResolvedValue(null)
    const onFetchFlagsStatusChanged = jest.fn<({ status, reason }: FetchFlagsStatus) => void>()
    const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true, onFetchFlagsStatusChanged, emotionAi })
    const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

    visitorDelegate.visitorCache = data
    await defaultStrategy.fetchFlags()
    expect(visitorDelegate.onFetchFlagsStatusChanged).toBe(onFetchFlagsStatusChanged)
    expect(visitorDelegate.onFetchFlagsStatusChanged).toBeCalledTimes(3)
    expect(visitorDelegate.onFetchFlagsStatusChanged).toHaveBeenNthCalledWith(1, { status: FSFetchStatus.FETCH_REQUIRED, reason: FSFetchReasons.VISITOR_CREATED })
    expect(visitorDelegate.onFetchFlagsStatusChanged).toHaveBeenNthCalledWith(2, { status: FSFetchStatus.FETCHING, reason: FSFetchReasons.NONE })
    expect(visitorDelegate.onFetchFlagsStatusChanged).toHaveBeenNthCalledWith(3, { status: FSFetchStatus.FETCH_REQUIRED, reason: FSFetchReasons.READ_FROM_CACHE })
    expect(visitorDelegate.campaigns).toEqual(campaigns.campaigns)
  })

  it('test fetchVisitorCacheCampaigns noConsentStrategy', async () => {
    getCampaignsAsync.mockResolvedValue(null)

    const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true, emotionAi })
    const noConsentStrategy = new NoConsentStrategy({ visitor: visitorDelegate, murmurHash })

    visitorDelegate.visitorCache = data
    await noConsentStrategy.fetchFlags()
    expect(visitorDelegate.campaigns).toEqual([])
  })

  it('test fetchVisitorCacheCampaigns panicStrategy', async () => {
    getCampaignsAsync.mockResolvedValue(null)

    const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true, emotionAi })
    const panicStrategy = new PanicStrategy({ visitor: visitorDelegate, murmurHash })

    visitorDelegate.visitorCache = data
    await panicStrategy.fetchFlags()
    expect(visitorDelegate.campaigns).toEqual([])
  })

  it('test fetchVisitorCacheCampaigns', async () => {
    getCampaignsAsync.mockResolvedValue(null)

    const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true, emotionAi })
    const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

    visitorDelegate.visitorCache = {
      version: VISITOR_CACHE_VERSION,
      data: {
        visitorId: visitorDelegate.visitorId,
        anonymousId: visitorDelegate.anonymousId,
        consent: visitorDelegate.hasConsented,
        context: visitorDelegate.context
      }
    }
    await defaultStrategy.fetchFlags()
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
    expect(logInfo).toBeCalledWith(sprintf(VISITOR_ID_MISMATCH_ERROR, 'any', visitorDelegate.visitorId), PROCESS_CACHE)
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
    const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true, emotionAi })
    const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })
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
    const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true, emotionAi })
    const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })
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
    expect(logError).toBeCalledWith(sprintf(LOOKUP_VISITOR_JSON_OBJECT_ERROR, VISITOR_CACHE_VERSION, visitorId), PROCESS_CACHE)
  })

  it('test lookupVisitor', async () => {
    const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true, emotionAi })
    const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

    lookupVisitor.mockReturnValue(getUndefined())
    await defaultStrategy.lookupVisitor()
    expect(lookupVisitor).toBeCalledTimes(1)
    expect(visitorDelegate.visitorCache).toBeUndefined()
  })

  it('test lookupVisitor', async () => {
    const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true, emotionAi })
    const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })
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
    expect(logError).toBeCalledWith(sprintf(LOOKUP_VISITOR_JSON_OBJECT_ERROR, VISITOR_CACHE_VERSION, visitorId), PROCESS_CACHE)
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
    expect(logError).toBeCalledWith(sprintf(VISITOR_CACHE_ERROR, visitorId, 'lookupVisitor', lookVisitorError), PROCESS_CACHE)
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
    expect(logError).toBeCalledWith(sprintf(VISITOR_CACHE_ERROR, visitorId, 'flushVisitor', flushVisitorError), PROCESS_CACHE)
  })

  it('test flushVisitor ', async () => {
    config.visitorCacheImplementation = getUndefined()
    visitorDelegate.setConsent(false)
    expect(flushVisitor).toBeCalledTimes(0)
    config.visitorCacheImplementation = visitorCacheImplementation
  })
})

describe('test visitor cache status', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()

  const cacheVisitor = jest.fn<(visitorId: string, data: VisitorCacheDTO)=>Promise<void>>()
  const lookupVisitor = jest.fn<(visitorId: string)=>Promise<VisitorCacheDTO>>()
  const flushVisitor = jest.fn<(visitorId: string)=>Promise<void>>()
  const visitorCacheImplementation:IVisitorCacheImplementation = {
    cacheVisitor,
    lookupVisitor,
    flushVisitor
  }

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', visitorCacheImplementation })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const trackingManager = new TrackingManager(httpClient, config)

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>()
  } as unknown as IEmotionAI

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true, emotionAi })

  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash: new MurmurHash() })

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

  it('test visitorCacheStatus NONE ', async () => {
    lookupVisitor.mockResolvedValue(getUndefined())
    await defaultStrategy.lookupVisitor()
    expect(lookupVisitor).toBeCalledTimes(1)
    expect(visitorDelegate.visitorCacheStatus).toEqual('NONE')
  })

  it('test visitorCacheStatus VISITOR_ID_CACHE ', async () => {
    lookupVisitor.mockResolvedValue(data)
    await defaultStrategy.lookupVisitor()
    expect(lookupVisitor).toBeCalledTimes(1)
    expect(visitorDelegate.visitorCacheStatus).toEqual('VISITOR_ID_CACHE')
  })

  it('test visitorCacheStatus VISITOR_ID_CACHE ', async () => {
    lookupVisitor.mockResolvedValue(data)
    const anonymousId = 'anonymousId'
    visitorDelegate.anonymousId = anonymousId
    await defaultStrategy.lookupVisitor()
    expect(lookupVisitor).toBeCalledTimes(2)
    expect(lookupVisitor).toHaveBeenNthCalledWith(1, visitorId)
    expect(lookupVisitor).toHaveBeenNthCalledWith(2, anonymousId)
    expect(visitorDelegate.visitorCacheStatus).toEqual(VisitorCacheStatus.VISITOR_ID_CACHE_WITH_ANONYMOUS_ID_CACHE)
  })

  it('test visitorCacheStatus VISITOR_ID_CACHE_NOT_ANONYMOUS_ID_CACHE ', async () => {
    const anonymousId = 'anonymousId'
    lookupVisitor.mockImplementation(async (key:string) => {
      if (key === visitorId) {
        return data
      }
      return getUndefined()
    })

    visitorDelegate.anonymousId = anonymousId
    await defaultStrategy.lookupVisitor()
    expect(lookupVisitor).toBeCalledTimes(2)
    expect(lookupVisitor).toHaveBeenNthCalledWith(1, visitorId)
    expect(lookupVisitor).toHaveBeenNthCalledWith(2, anonymousId)
    expect(visitorDelegate.visitorCacheStatus).toEqual(VisitorCacheStatus.VISITOR_ID_CACHE)
  })

  it('test visitorCacheStatus ANONYMOUS_ID_CACHE ', async () => {
    const anonymousId = 'anonymousId'
    lookupVisitor.mockImplementation(async (key:string) => {
      if (key === visitorId) {
        return getUndefined()
      }
      return data
    })

    visitorDelegate.anonymousId = anonymousId
    await defaultStrategy.lookupVisitor()
    expect(lookupVisitor).toBeCalledTimes(2)
    expect(lookupVisitor).toHaveBeenNthCalledWith(1, visitorId)
    expect(lookupVisitor).toHaveBeenNthCalledWith(2, anonymousId)
    expect(visitorDelegate.visitorCacheStatus).toEqual('ANONYMOUS_ID_CACHE')
  })

  it('test visitorCacheStatus NONE ', async () => {
    lookupVisitor.mockResolvedValue(getUndefined())
    visitorDelegate.visitorCacheStatus = VisitorCacheStatus.NONE
    visitorDelegate.anonymousId = null
    await defaultStrategy.cacheVisitor()
    expect(cacheVisitor).toBeCalledTimes(1)
    expect(cacheVisitor).toHaveBeenNthCalledWith(1, visitorId, expect.anything())
  })

  it('test visitorCacheStatus VISITOR_ID_CACHE_NOT_ANONYMOUS_ID_CACHE ', async () => {
    const anonymousId = 'anonymousId'
    lookupVisitor.mockResolvedValue(getUndefined())
    visitorDelegate.visitorCacheStatus = VisitorCacheStatus.VISITOR_ID_CACHE_WITH_ANONYMOUS_ID_CACHE
    visitorDelegate.anonymousId = anonymousId
    await defaultStrategy.cacheVisitor()
    expect(cacheVisitor).toBeCalledTimes(1)
    expect(cacheVisitor).toHaveBeenNthCalledWith(1, visitorId, expect.anything())
  })

  it('test visitorCacheStatus ANONYMOUS_ID_CACHE ', async () => {
    const anonymousId = 'anonymousId'
    lookupVisitor.mockResolvedValue(getUndefined())
    visitorDelegate.visitorCacheStatus = VisitorCacheStatus.ANONYMOUS_ID_CACHE
    visitorDelegate.anonymousId = anonymousId
    await defaultStrategy.cacheVisitor()
    expect(cacheVisitor).toBeCalledTimes(1)
    expect(cacheVisitor).toHaveBeenNthCalledWith(1, visitorId, expect.anything())
  })

  it('test visitorCacheStatus VISITOR_ID_CACHE ', async () => {
    const anonymousId = 'anonymousId'
    lookupVisitor.mockResolvedValue(getUndefined())
    visitorDelegate.visitorCacheStatus = VisitorCacheStatus.VISITOR_ID_CACHE
    visitorDelegate.anonymousId = anonymousId
    await defaultStrategy.cacheVisitor()
    expect(cacheVisitor).toBeCalledTimes(2)
    expect(cacheVisitor).toHaveBeenNthCalledWith(1, visitorId, expect.anything())
    expect(cacheVisitor).toHaveBeenNthCalledWith(2, anonymousId, expect.anything())
  })
})

describe('test visitorCache with disabledCache', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()

  const cacheVisitor = jest.fn<(visitorId: string, data: VisitorCacheDTO)=>Promise<void>>()
  const lookupVisitor = jest.fn<(visitorId: string)=>Promise<VisitorCacheDTO>>()
  const flushVisitor = jest.fn<(visitorId: string)=>Promise<void>>()
  const visitorCacheImplementation:IVisitorCacheImplementation = {
    cacheVisitor,
    lookupVisitor,
    flushVisitor
  }

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', visitorCacheImplementation, disableCache: true })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const getCampaignsAsync = jest.spyOn(apiManager, 'getCampaignsAsync')

  const trackingManager = new TrackingManager(httpClient, config)

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>()
  } as unknown as IEmotionAI

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true, emotionAi })

  const murmurHash = new MurmurHash()

  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

  it('test saveCache defaultStrategy', async () => {
    getCampaignsAsync.mockResolvedValue(campaigns.campaigns)
    await defaultStrategy.fetchFlags()
    expect(cacheVisitor).toBeCalledTimes(0)
  })

  it('test saveCache', async () => {
    getCampaignsAsync.mockResolvedValue(campaigns.campaigns)
    await defaultStrategy.fetchFlags()
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
