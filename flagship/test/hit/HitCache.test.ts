import { jest, expect, it, describe } from '@jest/globals'
import { DecisionApiConfig, HitType, IScreen, Screen } from '../../src'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager } from '../../src/config'
import { ApiManager } from '../../src/decision/ApiManager'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient, IHttpResponse, IHttpOptions } from '../../src/utils/HttpClient'
import { VisitorDelegate, DefaultStrategy } from '../../src/visitor'
import { Mock } from 'jest-mock'
import { IHitCacheImplementation } from '../../src/hit/IHitCacheImplementation'
import { HitCacheSaveDTO, HitCacheLookupDTO, IHit } from '../../src/types'
import { HIT_CACHE_VERSION, SDK_APP } from '../../src/enum'
import { LOOKUP_HITS_JSON_ERROR, LOOKUP_HITS_JSON_OBJECT_ERROR } from '../../src/visitor/DefaultStrategy'
import { sleep } from '../../src/utils/utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getUndefined = ():any => undefined
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNull = ():any => null

describe('test visitor hit cache', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

  const cacheHit:Mock<void, [visitorId: string, data: HitCacheSaveDTO]> = jest.fn()
  const lookupHits:Mock<HitCacheLookupDTO[], [visitorId: string]> = jest.fn()
  const flushHits:Mock<void, [visitorId: string]> = jest.fn()
  const hitCacheImplementation:IHitCacheImplementation = {
    cacheHit,
    lookupHits,
    flushHits
  }

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', hitCacheImplementation })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post: Mock<
      Promise<IHttpResponse>,
      [url: string, options: IHttpOptions]
    > = jest.fn()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const getCampaignsAsync = jest.spyOn(
    apiManager,
    'getCampaignsAsync'
  )

  const trackingManager = new TrackingManager(httpClient, config)

  const sendHit = jest.spyOn(trackingManager, 'sendHit')

  const sendActive = jest.spyOn(trackingManager, 'sendActive')

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true })

  const defaultStrategy = new DefaultStrategy(visitorDelegate)

  sendActive.mockRejectedValue(new Error())
  sendHit.mockRejectedValue(new Error())

  const campaignDTO = [
    {
      id: 'c2nrh1hjg50l9stringu8bg',
      variationGroupId: 'id',
      variation: {
        id: '1dl',
        reference: false,
        modifications: {
          type: 'number',
          value: {
            key: 'value'
          }
        }
      }
    }
  ]
  getCampaignsAsync.mockResolvedValue(campaignDTO)

  it('test saveCache', async () => {
    await defaultStrategy.synchronizeModifications()
    const dateNow = Date.now
    Date.now = jest.fn()
    const documentLocation = 'screenName'
    await defaultStrategy.activateModification('key')
    await defaultStrategy.sendHit({ type: HitType.SCREEN, documentLocation })

    const hitData1: HitCacheSaveDTO = {
      version: HIT_CACHE_VERSION,
      data: {
        visitorId: visitorId,
        anonymousId: visitorDelegate.anonymousId,
        type: 'ACTIVATE',
        content: {
          key: 'key',
          campaignId: campaignDTO[0].id,
          variationGroupId: campaignDTO[0].variationGroupId,
          variationId: campaignDTO[0].variation.id,
          isReference: campaignDTO[0].variation.reference,
          value: campaignDTO[0].variation.modifications.value.key

        },
        time: Date.now()
      }
    }
    const hitData2: HitCacheSaveDTO = {
      version: HIT_CACHE_VERSION,
      data: {
        visitorId: visitorId,
        anonymousId: visitorDelegate.anonymousId,
        type: HitType.SCREEN,
        content: {
          visitorId,
          ds: SDK_APP,
          type: HitType.SCREEN,
          anonymousId: visitorDelegate.anonymousId,
          documentLocation
        },
        time: Date.now()
      }
    }
    expect(cacheHit).toBeCalledTimes(2)
    expect(cacheHit).toHaveBeenNthCalledWith(1, visitorId, hitData1)
    expect(cacheHit).toHaveBeenNthCalledWith(2, visitorId, hitData2)
    Date.now = dateNow
  })

  it('test saveCache failed', async () => {
    const cacheHitError = 'error'
    cacheHit.mockImplementation(() => {
      throw cacheHitError
    })

    const documentLocation = 'screenName'
    await defaultStrategy.sendHit({ type: HitType.PAGE, documentLocation })
    expect(cacheHit).toBeCalledTimes(1)
    expect(logError).toBeCalledTimes(2)
    expect(logError).toHaveBeenLastCalledWith(cacheHitError, 'cacheHit')
  })

  it('test saveCache failed', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config.hitCacheImplementation = (():any => undefined)()
    const documentLocation = 'screenName'
    await defaultStrategy.sendHit({ type: HitType.PAGE, documentLocation })
    expect(cacheHit).toBeCalledTimes(0)
  })

  it('test lookupHit', async () => {
    const hits:HitCacheLookupDTO[] = []

    for (let index = 0; index < 100; index++) {
      hits.push({
        version: HIT_CACHE_VERSION,
        data: {
          visitorId: 'visitor1',
          anonymousId: null,
          type: HitType.SCREEN,
          time: Date.now(),
          content: {
            type: HitType.SCREEN,
            documentLocation: `screenName${index}`
          }
        }
      })
    }
    for (let index = 100; index < 110; index++) {
      hits.push({
        version: HIT_CACHE_VERSION,
        data: {
          visitorId: 'visitor1',
          anonymousId: null,
          type: 'ACTIVATE',
          time: Date.now(),
          content: {
            key: `key_${index}`,
            campaignId: `campaignId${index}`,
            variationGroupId: `variationGroupId${index}`,
            variationId: `variationId${index}`,
            value: `value_${index}`
          }
        }
      })
    }
    config.hitCacheImplementation = hitCacheImplementation
    lookupHits.mockReturnValue(hits)
    await defaultStrategy.lookupHits()
    expect(lookupHits).toBeCalledTimes(1)
    expect(lookupHits).toBeCalledWith(visitorDelegate.visitorId)
    expect(sendActive).toBeCalledTimes(10)
    expect(sendHit).toHaveBeenNthCalledWith(1, {
      _anonymousId: null,
      _config: expect.anything(),
      _hits: hits.slice(0, 45).map(item => {
        const data = item.data.content as IScreen
        return new Screen({ documentLocation: data.documentLocation })
      }),
      _ds: 'APP',
      _type: 'BATCH',
      _visitorId: visitorId
    })
    expect(sendHit).toHaveBeenNthCalledWith(2, {
      _anonymousId: null,
      _config: expect.anything(),
      _hits: hits.slice(45, 90).map(item => {
        const data = item.data.content as IScreen
        return new Screen({ documentLocation: data.documentLocation })
      }),
      _ds: 'APP',
      _type: 'BATCH',
      _visitorId: visitorId
    })
    expect(sendHit).toHaveBeenNthCalledWith(3, {
      _anonymousId: null,
      _config: expect.anything(),
      _hits: hits.slice(90, 100).map(item => {
        const data = item.data.content as IScreen
        return new Screen({ documentLocation: data.documentLocation })
      }),
      _ds: 'APP',
      _type: 'BATCH',
      _visitorId: visitorId
    })
    expect(sendHit).toBeCalledTimes(3)
    await sleep(100)
    expect(cacheHit).toBeCalledTimes(110)
  })

  it('test lookupHit', async () => {
    const hits = [
      {
        version: HIT_CACHE_VERSION,
        data: {
          visitorId: 'visitor1',
          anonymousId: null,
          type: HitType.SCREEN,
          time: Date.now(),
          content: {

          } as IHit
        }
      }
    ]
    config.hitCacheImplementation = hitCacheImplementation
    lookupHits.mockReturnValue(hits)
    await defaultStrategy.lookupHits()
    expect(lookupHits).toBeCalledTimes(1)
    expect(lookupHits).toBeCalledWith(visitorDelegate.visitorId)
    expect(sendHit).toBeCalledTimes(0)
  })

  it('test lookupHit failed', async () => {
    sendHit.mockResolvedValue()
    config.hitCacheImplementation = hitCacheImplementation
    const lookupError = 'error lookup'
    lookupHits.mockImplementation(() => {
      throw lookupError
    })
    await defaultStrategy.lookupHits()
    expect(lookupHits).toBeCalledTimes(1)
    expect(sendHit).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(lookupError, 'lookupHits')
  })

  it('test lookupHit failed', async () => {
    sendHit.mockResolvedValue()
    config.hitCacheImplementation = hitCacheImplementation
    lookupHits.mockReturnValue({} as HitCacheLookupDTO[])
    await defaultStrategy.lookupHits()
    expect(lookupHits).toBeCalledTimes(1)
    expect(sendHit).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(LOOKUP_HITS_JSON_ERROR, 'lookupHits')
  })
  it('test lookupHit failed', async () => {
    sendHit.mockResolvedValue()
    config.hitCacheImplementation = hitCacheImplementation
    lookupHits.mockReturnValue([{} as HitCacheLookupDTO])
    await defaultStrategy.lookupHits()
    expect(lookupHits).toBeCalledTimes(1)
    expect(sendHit).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(LOOKUP_HITS_JSON_OBJECT_ERROR, 'lookupHits')
  })

  it('test lookupHit failed', async () => {
    sendHit.mockResolvedValue()
    config.hitCacheImplementation = hitCacheImplementation
    lookupHits.mockReturnValue(getNull())
    await defaultStrategy.lookupHits()
    expect(lookupHits).toBeCalledTimes(1)
    expect(sendHit).toBeCalledTimes(0)
  })

  it('test lookupHit', async () => {
    sendHit.mockResolvedValue()
    config.hitCacheImplementation = getUndefined()
    await defaultStrategy.lookupHits()
    expect(lookupHits).toBeCalledTimes(0)
    expect(sendHit).toBeCalledTimes(0)
    config.hitCacheImplementation = hitCacheImplementation
  })

  it('test flushHits ', () => {
    visitorDelegate.setConsent(false)
    expect(flushHits).toBeCalledTimes(1)
    visitorDelegate.setConsent(true)
    expect(flushHits).toBeCalledTimes(1)
  })

  it('test flushHits failed ', () => {
    const flushHitsError = 'Error'
    flushHits.mockImplementation(() => {
      throw flushHitsError
    })
    visitorDelegate.setConsent(false)
    expect(flushHits).toBeCalledTimes(1)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(flushHitsError, 'flushHits')
  })

  it('test flushHits ', () => {
    config.hitCacheImplementation = getUndefined()
    visitorDelegate.setConsent(false)
    expect(flushHits).toBeCalledTimes(0)
    config.hitCacheImplementation = hitCacheImplementation
  })
})

describe('test HitCache disabledCache', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()

  const cacheHit:Mock<void, [visitorId: string, data: HitCacheSaveDTO]> = jest.fn()
  const lookupHits:Mock<HitCacheLookupDTO[], [visitorId: string]> = jest.fn()
  const flushHits:Mock<void, [visitorId: string]> = jest.fn()
  const hitCacheImplementation:IHitCacheImplementation = {
    cacheHit,
    lookupHits,
    flushHits
  }

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', hitCacheImplementation, disableCache: true })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post: Mock<
      Promise<IHttpResponse>,
      [url: string, options: IHttpOptions]
    > = jest.fn()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const getCampaignsAsync = jest.spyOn(
    apiManager,
    'getCampaignsAsync'
  )

  const trackingManager = new TrackingManager(httpClient, config)

  const sendHit = jest.spyOn(trackingManager, 'sendHit')

  const sendActive = jest.spyOn(trackingManager, 'sendActive')

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true })

  const defaultStrategy = new DefaultStrategy(visitorDelegate)

  sendActive.mockRejectedValue(new Error())
  sendHit.mockRejectedValue(new Error())

  const campaignDTO = [
    {
      id: 'c2nrh1hjg50l9stringu8bg',
      variationGroupId: 'id',
      variation: {
        id: '1dl',
        reference: false,
        modifications: {
          type: 'number',
          value: {
            key: 'value'
          }
        }
      }
    }
  ]
  getCampaignsAsync.mockResolvedValue(campaignDTO)

  it('test saveCache', async () => {
    await defaultStrategy.synchronizeModifications()
    const documentLocation = 'screenName'
    await defaultStrategy.activateModification('key')
    await defaultStrategy.sendHit({ type: HitType.SCREEN, documentLocation })

    expect(cacheHit).toBeCalledTimes(0)
  })

  it('test lookupHit', async () => {
    await defaultStrategy.lookupHits()
    expect(lookupHits).toBeCalledTimes(0)
  })

  it('test flushHits ', () => {
    visitorDelegate.setConsent(false)
    expect(flushHits).toBeCalledTimes(0)
    visitorDelegate.setConsent(true)
    expect(flushHits).toBeCalledTimes(0)
  })
})
