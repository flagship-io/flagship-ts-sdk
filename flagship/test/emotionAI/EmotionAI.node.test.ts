import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager } from '../../src/config/ConfigManager'
import { DecisionApiConfig } from '../../src/config/DecisionApiConfig'
import { ApiManager } from '../../src/decision/ApiManager'
import { EmotionAI } from '../../src/emotionAI/EmotionAI.node'
import { IHttpClient, IHttpOptions, IHttpResponse } from '../../src/utils/HttpClient'
import { jest } from '@jest/globals'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'
import { VisitorEvent } from '../../src/emotionAI/hit/VisitorEvent'

describe('EmotionAI', () => {
  const getAsyncSpy = jest.fn<(url: string, options?: IHttpOptions) => Promise<IHttpResponse>>()
  const postAsyncSpy = jest.fn<(url: string, options: IHttpOptions) => Promise<IHttpResponse>>()
  const sdkConfig = new DecisionApiConfig({ envId: 'env', apiKey: 'api' })

  const httpClient :IHttpClient = {
    getAsync: getAsyncSpy,
    postAsync: postAsyncSpy
  }
  const emotionAI = new EmotionAI({
    httpClient,
    sdkConfig,
    eAIConfig: {
      eaiActivationEnabled: true,
      eaiCollectEnabled: true
    }
  })

  const trackingManager = new TrackingManager(httpClient, sdkConfig)

  const apiManager = new ApiManager(httpClient, sdkConfig)

  const addHit = jest.spyOn(trackingManager, 'addHit')
  addHit.mockResolvedValue()

  const activateFlag = jest.spyOn(trackingManager, 'activateFlag')
  activateFlag.mockResolvedValue()

  const configManager = new ConfigManager(sdkConfig, apiManager, trackingManager)

  const visitorId = 'visitor-1'

  const visitorDelegate = new VisitorDelegate({
    visitorId,
    context: {},
    configManager,
    hasConsented: true,
    emotionAi: {
      init: jest.fn()
    } as unknown as EmotionAI
  })

  emotionAI.init(visitorDelegate)

  it('should fetchEAIScore return a undefined', async () => {
    const result = await emotionAI.fetchEAIScore()
    expect(result).toBeUndefined()
    expect(getAsyncSpy).not.toHaveBeenCalled()
  })

  it('should reportVisitorEvent', async () => {
    const visitorEvent = new VisitorEvent({
      visitorId,
      customerAccountId: sdkConfig.envId as string,
      clickPosition: '',
      screenSize: '',
      currentUrl: ''
    })
    await emotionAI.reportVisitorEvent(visitorEvent)
    expect(postAsyncSpy).not.toHaveBeenCalled()
  })

  it('should cleanup', () => {
    emotionAI.cleanup()
  })

  it('should collectEAIData', async () => {
    await emotionAI.collectEAIData()
    expect(getAsyncSpy).not.toHaveBeenCalled()
    expect(postAsyncSpy).not.toHaveBeenCalled()
  })
})
