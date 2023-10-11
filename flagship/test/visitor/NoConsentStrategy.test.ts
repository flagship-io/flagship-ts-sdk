import { jest, expect, it, describe, beforeAll, afterAll } from '@jest/globals'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager, DecisionApiConfig } from '../../src/config/index'
import { DecisionManager } from '../../src/decision/DecisionManager'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'
import { NoConsentStrategy } from '../../src/visitor/index'
import { FLAG_USER_EXPOSED, HitType, LogLevel, METHOD_DEACTIVATED_CONSENT_ERROR } from '../../src/enum/index'
import { sprintf } from '../../src/utils/utils'
import { HttpClient, IHttpResponse } from '../../src/utils/HttpClient'
import { MurmurHash } from '../../src/utils/MurmurHash'
import { FlagDTO, TroubleshootingLabel } from '../../src'
import { ApiManager } from '../../src/decision/ApiManager'

describe('test NoConsentStrategy', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()
  const logInfo = jest.spyOn(logManager, 'info')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', logLevel: LogLevel.INFO })
  config.logManager = logManager

  const trackingManager = new TrackingManager({} as HttpClient, config)

  const configManager = new ConfigManager(config, {} as DecisionManager, trackingManager)
  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true })
  const murmurHash = new MurmurHash()
  const noConsentStrategy = new NoConsentStrategy({ visitor: visitorDelegate, murmurHash })

  it('test activateModification', () => {
    noConsentStrategy.activateModification('key').then(() => {
      const methodName = 'activateModification'
      expect(logInfo).toBeCalledTimes(1)
      expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_CONSENT_ERROR, methodName, visitorDelegate.visitorId), methodName)
    })
  })

  it('test activateModifications', () => {
    noConsentStrategy.activateModifications(['key']).then(() => {
      const methodName = 'activateModifications'
      expect(logInfo).toBeCalledTimes(1)
      expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_CONSENT_ERROR, methodName, visitorDelegate.visitorId), methodName)
    })
  })

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
      expect(logInfo).toBeCalledWith(sprintf(METHOD_DEACTIVATED_CONSENT_ERROR, FLAG_USER_EXPOSED, visitorDelegate.visitorId), FLAG_USER_EXPOSED)
    })
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
  const visitorId = 'visitorId-1'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendAnalyticsHit = jest.spyOn(trackingManager, 'sendAnalyticsHit')

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const FsInstanceId = 'FsInstanceId'

  const murmurHash = new MurmurHash()
  const visitorDelegate = new VisitorDelegate({
    visitorId,
    context,
    configManager,
    monitoringData: {
      instanceId: FsInstanceId,
      lastInitializationTimestamp: ''
    }
  })
  const noConsentStrategy = new NoConsentStrategy({ visitor: visitorDelegate, murmurHash })

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
    const getCurrentDateTime = jest.spyOn(noConsentStrategy, 'getCurrentDateTime')
    const flags = new Map<string, FlagDTO>().set(flagDTO.key, flagDTO)
    getCampaignsAsync.mockResolvedValue([])
    getModifications.mockReturnValueOnce(flags)
    getCurrentDateTime.mockReturnValue(new Date(2022, 9, 15))
    await noConsentStrategy.fetchFlags()

    expect(sendAnalyticsHit).toBeCalledTimes(1)

    const label: TroubleshootingLabel = 'SDK_CONFIG'
    expect(sendAnalyticsHit).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))
  })
})
