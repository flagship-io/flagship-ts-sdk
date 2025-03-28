import { jest, expect, it, describe, beforeAll, afterAll } from '@jest/globals'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager, DecisionApiConfig } from '../../src/config/index'
import { DecisionManager } from '../../src/decision/DecisionManager'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'
import { NoConsentStrategy } from '../../src/visitor/index'
import { FLAG_VISITOR_EXPOSED, HitType, LogLevel, METHOD_DEACTIVATED_CONSENT_ERROR } from '../../src/enum/index'
import { sprintf } from '../../src/utils/utils'
import { HttpClient, IHttpResponse } from '../../src/utils/HttpClient'
import { MurmurHash } from '../../src/utils/MurmurHash'
import { EAIScore, FlagDTO, TroubleshootingLabel } from '../../src'
import { ApiManager } from '../../src/decision/ApiManager'
import { VisitorAbstract } from '../../src/visitor/VisitorAbstract'
import { IEmotionAI } from '../../src/emotionAI/IEmotionAI'
import { IPageView } from '../../src/emotionAI/hit/IPageView'
import { IVisitorEvent } from '../../src/emotionAI/hit/IVisitorEvent'
import { sleep } from '../helpers'

describe('test NoConsentStrategy', () => {
  const visitorId = 'visitorId'
   
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()
  const logInfo = jest.spyOn(logManager, 'info')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', logLevel: LogLevel.INFO })
  config.logManager = logManager

  const trackingManager = new TrackingManager({} as HttpClient, config)

  const configManager = new ConfigManager(config, {} as DecisionManager, trackingManager)

  const fetchEAIScore = jest.fn<() => Promise<EAIScore|undefined>>()

  const collectEAIData = jest.fn<(currentPage?: Omit<IPageView, 'toApiKeys'>) => void>()

  const reportVisitorEvent = jest.fn<(event: IVisitorEvent)=> Promise<void>>()

  const reportPageView = jest.fn<(pageView: IPageView) => Promise<void>>()

  const onEAICollectStatusChange = jest.fn<(callback: (status: boolean) => void) => void>()

  const cleanup = jest.fn<() => void>()

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>(),
    fetchEAIScore,
    collectEAIData,
    reportVisitorEvent,
    reportPageView,
    onEAICollectStatusChange,
    cleanup
  } as unknown as IEmotionAI
  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true, emotionAi })
  const murmurHash = new MurmurHash()
  const noConsentStrategy = new NoConsentStrategy({ visitor: visitorDelegate, murmurHash })

  it('test sendHit', () => {
    noConsentStrategy.sendHit({ type: HitType.PAGE, documentLocation: 'home' }).then(() => {
      const methodName = 'sendHit'
      expect(logInfo).toBeCalledTimes(1)
      expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_CONSENT_ERROR, methodName, visitorDelegate.visitorId), methodName)
    })
  })

  it('test sendHits', () => {
    noConsentStrategy.sendHits([{ type: HitType.PAGE, documentLocation: 'home' }]).then(() => {
      const methodName = 'sendHits'
      expect(logInfo).toBeCalledTimes(1)
      expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_CONSENT_ERROR, methodName, visitorDelegate.visitorId), methodName)
    })
  })

  it('test userExposed', () => {
    noConsentStrategy.visitorExposed().then(() => {
      expect(logInfo).toBeCalledTimes(1)
      expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_CONSENT_ERROR, FLAG_VISITOR_EXPOSED, visitorDelegate.visitorId), FLAG_VISITOR_EXPOSED)
    })
  })

  it('test collectEAIData', () => {
    noConsentStrategy.collectEAIEventsAsync()
    expect(logInfo).toBeCalledTimes(1)
  })

  it('test reportEaiPageView', () => {
    noConsentStrategy.reportEaiPageView()
    expect(logInfo).toBeCalledTimes(0)
    expect(emotionAi.reportPageView).toBeCalledTimes(0)
  })

  it('test reportEaiVisitorEvent', () => {
    noConsentStrategy.reportEaiVisitorEvent()
    expect(logInfo).toBeCalledTimes(0)
    expect(emotionAi.reportVisitorEvent).toBeCalledTimes(0)
  })

  it('test onEAICollectStatusChange', () => {
    noConsentStrategy.onEAICollectStatusChange()
    expect(logInfo).toBeCalledTimes(0)
    expect(emotionAi.onEAICollectStatusChange).toBeCalledTimes(0)
  })
})

describe('test DefaultStrategy sendAnalyticHit', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })
  const visitorId = 'ca0594f5-4a37-4a7d-91be-27c63f829380'
   
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', hitDeduplicationTime: 0 })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const getCampaignsAsync = jest.spyOn(
    apiManager,
    'getCampaignsAsync'
  )

  const getModifications = jest.spyOn(
    apiManager,
    'getModifications'
  )

  const trackingManager = new TrackingManager(httpClient, config)

  const addHit = jest.spyOn(trackingManager, 'addHit')
  addHit.mockResolvedValue()

   
  const sendUsageHitSpy = jest.spyOn(trackingManager, 'sendUsageHit')

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const FsInstanceId = 'FsInstanceId'

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>()
  } as unknown as IEmotionAI

  const murmurHash = new MurmurHash()

  const murmurHash3Int32Spy = jest.spyOn(murmurHash, 'murmurHash3Int32')
  murmurHash3Int32Spy.mockReturnValue(1000)

  const visitorDelegate = new VisitorDelegate({
    visitorId,
    context,
    configManager,
    monitoringData: {
      instanceId: FsInstanceId,
      lastInitializationTimestamp: ''
    },
    hasConsented: true,
    emotionAi,
    murmurHash
  })

  const noConsentStrategy = new NoConsentStrategy({ visitor: visitorDelegate, murmurHash })
  const sendTroubleshootingHit = jest.spyOn(trackingManager, 'sendTroubleshootingHit')
  it('test fetchFlags', async () => {
    const flagDTO: FlagDTO = {
      key: 'key',
      campaignId: 'campaignId',
      campaignName: 'campaignName',
      variationGroupId: 'variationGroupId',
      variationGroupName: 'variationGroupName',
      variationId: 'variationId',
      variationName: 'variationName',
      value: 'value'
    }

    const flags = new Map<string, FlagDTO>().set(flagDTO.key, flagDTO)
    getCampaignsAsync.mockResolvedValue([])
    getModifications.mockReturnValueOnce(flags)

    await noConsentStrategy.fetchFlags()

    await sleep(10)

    expect(sendUsageHitSpy).toBeCalledTimes(1)

    const label: TroubleshootingLabel = TroubleshootingLabel.SDK_CONFIG
    expect(sendUsageHitSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({ data: expect.objectContaining({ label }) }))
  })

  it('test sendTroubleshootingHit', () => {
    noConsentStrategy.sendTroubleshootingHit()
    expect(sendTroubleshootingHit).toBeCalledTimes(0)
  })
})
