import { jest, expect, it, describe } from '@jest/globals'
import { DecisionApiConfig, HitType, Page, Screen } from '../../src'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager } from '../../src/config'
import { ApiManager } from '../../src/decision/ApiManager'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient, IHttpResponse, IHttpOptions } from '../../src/utils/HttpClient'
import { VisitorDelegate, DefaultStrategy } from '../../src/visitor'
import { Mock } from 'jest-mock'
import { IHitCache } from '../../src/hit/IHitCache'
import { HitCacheSaveDTO, HitCacheLookupDTO } from '../../src/models/HitDTO'
import { HIT_CACHE_VERSION, SDK_APP } from '../../src/enum'
import { LOOKUP_HITS_JSON_ERROR, LOOKUP_HITS_JSON_OBJECT_ERROR } from '../../src/visitor/DefaultStrategy'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getUndefined = ():any => undefined

describe('test visitor hit cache', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

  const cacheHit:Mock<void, [visitorId: string, data: string]> = jest.fn()
  const lookupHits:Mock<string, [visitorId: string]> = jest.fn()
  const flushHits:Mock<void, [visitorId: string]> = jest.fn()
  const hitCacheImplementation:IHitCache = {
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

  const trackingManager = new TrackingManager(httpClient, config)

  const sendHit = jest.spyOn(trackingManager, 'sendHit')

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true })

  const defaultStrategy = new DefaultStrategy(visitorDelegate)

  sendHit.mockRejectedValue(new Error())

  it('test saveCache', async () => {
    const dateNow = Date.now
    Date.now = jest.fn()
    const documentLocation = 'screenName'
    await defaultStrategy.sendHit({ type: HitType.SCREEN, documentLocation })
    const hitData: HitCacheSaveDTO = {
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
    expect(cacheHit).toBeCalledTimes(1)
    expect(cacheHit).toBeCalledWith(visitorId, JSON.stringify(hitData))
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
    sendHit.mockResolvedValue()
    config.hitCacheImplementation = hitCacheImplementation
    const hits:HitCacheLookupDTO[] = [
      {
        version: HIT_CACHE_VERSION,
        data: {
          visitorId: 'visitor1',
          anonymousId: null,
          type: HitType.SCREEN,
          time: Date.now(),
          content: {
            type: HitType.SCREEN,
            documentLocation: 'screenName2'
          }
        }
      },
      {
        version: HIT_CACHE_VERSION,
        data: {
          visitorId: 'visitor2',
          anonymousId: null,
          type: HitType.PAGE,
          time: Date.now(),
          content: {
            type: HitType.PAGE,
            documentLocation: 'http://localhost'
          }
        }
      }
    ]
    lookupHits.mockReturnValue(JSON.stringify(hits))
    await defaultStrategy.lookupHits()
    expect(lookupHits).toBeCalledTimes(1)
    expect(lookupHits).toBeCalledWith(visitorDelegate.visitorId)
    expect(sendHit).toBeCalledTimes(1)
    expect(sendHit).toBeCalledWith({
      _anonymousId: null,
      _config: expect.anything(),
      _hits: [
        new Screen({ documentLocation: 'screenName2' }),
        new Page({ documentLocation: 'http://localhost' })
      ],
      _ds: 'APP',
      _type: 'BATCH',
      _visitorId: visitorId
    })
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
    lookupHits.mockReturnValue('{}')
    await defaultStrategy.lookupHits()
    expect(lookupHits).toBeCalledTimes(1)
    expect(sendHit).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(LOOKUP_HITS_JSON_ERROR, 'lookupHits')
  })
  it('test lookupHit failed', async () => {
    sendHit.mockResolvedValue()
    config.hitCacheImplementation = hitCacheImplementation
    lookupHits.mockReturnValue('[{}]')
    await defaultStrategy.lookupHits()
    expect(lookupHits).toBeCalledTimes(1)
    expect(sendHit).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(LOOKUP_HITS_JSON_OBJECT_ERROR, 'lookupHits')
  })

  it('test lookupHit failed', async () => {
    sendHit.mockResolvedValue()
    config.hitCacheImplementation = hitCacheImplementation
    lookupHits.mockReturnValue('')
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
