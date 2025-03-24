import { jest } from '@jest/globals'
import { IHttpClient, IHttpOptions, IHttpResponse } from '../../src/utils/HttpClient'
import { DecisionApiConfig, EAIScore, IPageView } from '../../src'
import { VisitorDelegate } from '../../src/visitor'
import { ConfigManager } from '../../src/config'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ApiManager } from '../../src/decision/ApiManager'
import { EMOTION_AI_EVENT_URL, MAX_COLLECTING_TIME_MS, MAX_LAST_COLLECTING_TIME_MS, SCORING_INTERVAL, SCROLL_END_DELAY_MS } from '../../src/enum/FlagshipConstant'
import { PageView } from '../../src/emotionAI/hit/PageView'
import { VisitorEvent } from '../../src/emotionAI/hit/VisitorEvent'
import { EmotionAI } from '../../src/emotionAI/EmotionAI.react-native'

describe('EmotionAI', () => {
  const getAsyncSpy = jest.fn<(url: string, options?: IHttpOptions) => Promise<IHttpResponse>>()
  const postAsyncSpy = jest.fn<(url: string, options: IHttpOptions) => Promise<IHttpResponse>>()
  const httpClient :IHttpClient = {
    getAsync: getAsyncSpy,
    postAsync: postAsyncSpy
  }
  const sdkConfig = new DecisionApiConfig({ envId: 'env', apiKey: 'api' })

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

  const setIsEAIDataCollected = jest.spyOn(visitorDelegate, 'setIsEAIDataCollected')

  afterEach(() => {
    postAsyncSpy.mockReset()
  })

  describe('test collectEAIData', () => {
    const getAsyncSpy = jest.fn<(url: string, options?: IHttpOptions) => Promise<IHttpResponse>>()
    const postAsyncSpy = jest.fn<(url: string, options: IHttpOptions) => Promise<IHttpResponse>>()
    const httpClient :IHttpClient = {
      getAsync: getAsyncSpy,
      postAsync: postAsyncSpy
    }

    const fixedTimestamp = 254889889 // 1978-05-25T11:48:09.889Z

    beforeEach(() => {
      jest.useFakeTimers({ now: fixedTimestamp })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    const onEAICollectStatusChange = jest.fn<(status: boolean) => void>()

    it('should collect data if eaiCollectEnabled is true', async () => {
      const emotionAI: EmotionAI = new EmotionAI({
        httpClient,
        sdkConfig,
        eAIConfig: {
          eaiActivationEnabled: true,
          eaiCollectEnabled: true
        }
      })

      emotionAI.init(visitorDelegate)

      postAsyncSpy.mockResolvedValue({ body: null, status: 200 })
      expect(emotionAI.EAIScore).toBeUndefined()
      expect(emotionAI.EAIScoreChecked).toBe(false)

      emotionAI.onEAICollectStatusChange(onEAICollectStatusChange)

      getAsyncSpy.mockResolvedValue({ body: null, status: 200 })

      const touchSupport = JSON.stringify([2, true, true])

      const pageViewData = {
        visitorId,
        customerAccountId: sdkConfig.envId as string,
        currentUrl: 'home screen',
        hasAdBlocker: false,
        screenDepth: '24',
        screenSize: '456,700;',
        doNotTrack: 'unspecified',
        fonts: '[]',
        hasFakeBrowserInfos: false,
        hasFakeLanguageInfos: false,
        hasFakeOsInfos: false,
        hasFakeResolutionInfos: false,
        userLanguage: 'en-US',
        deviceCategory: 'unknown',
        pixelRatio: 1,
        documentReferer: '',
        viewportSize: '[456,700]',
        timezoneOffset: new Date().getTimezoneOffset(),
        touchSupport,
        eventCategory: 'click tunnel auto',
        userAgent: 'React-native'
      }

      await emotionAI.collectEAIEventsAsync(pageViewData)

      expect(onEAICollectStatusChange).toHaveBeenCalledTimes(1)
      expect(onEAICollectStatusChange).toHaveBeenCalledWith(true)

      const mouseUpEventClientX = 100
      const mouseUpEventClientY = 150

      let timestamp = (fixedTimestamp + 1000).toString().slice(-5)

      const visitorEvent = new VisitorEvent({
        visitorId,
        customerAccountId: sdkConfig.envId as string,
        clickPosition: `${mouseUpEventClientX},${mouseUpEventClientY},${timestamp},${100};`,
        screenSize: '456,700;',
        currentUrl: 'home screen'
      })

      emotionAI.reportVisitorEvent(visitorEvent)

      jest.setSystemTime(fixedTimestamp + 1000)

      const pageView = (screenName = 'home screen') => new PageView({ ...pageViewData, currentUrl: screenName })

      expect(postAsyncSpy).toHaveBeenCalledTimes(2)

      expect(postAsyncSpy).toHaveBeenNthCalledWith(1, EMOTION_AI_EVENT_URL, {
        body: pageView().toApiKeys(),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      expect(postAsyncSpy).toHaveBeenNthCalledWith(2, EMOTION_AI_EVENT_URL, {
        body: visitorEvent.toApiKeys(),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      jest.setSystemTime(fixedTimestamp)

      timestamp = (fixedTimestamp + SCROLL_END_DELAY_MS).toString().slice(-5)

      const scrollPosition = `700,${timestamp};`
      const visitorEventScroll = new VisitorEvent({
        visitorId,
        customerAccountId: sdkConfig.envId as string,
        scrollPosition,
        screenSize: '456,700;',
        currentUrl: 'home screen'
      })

      emotionAI.reportVisitorEvent(visitorEventScroll)

      expect(postAsyncSpy).toHaveBeenCalledTimes(3)

      expect(postAsyncSpy).toHaveBeenNthCalledWith(3, EMOTION_AI_EVENT_URL, {
        body: visitorEventScroll.toApiKeys(),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const mouseMoveEvent = {
        clientX: 0,
        clientY: 0
      }

      let clickPath = ''

      jest.setSystemTime(fixedTimestamp)

      for (let index = 0; index < 148; index++) {
        mouseMoveEvent.clientX = index
        mouseMoveEvent.clientY = index + 50
        clickPath += `${mouseMoveEvent.clientX},${mouseMoveEvent.clientY},${fixedTimestamp.toString().slice(-5)};`
      }

      const visitorEventMove = new VisitorEvent({
        visitorId,
        customerAccountId: sdkConfig.envId as string,
        clickPath,
        screenSize: '456,700;',
        currentUrl: 'home screen'
      })

      emotionAI.reportVisitorEvent(visitorEventMove)

      expect(postAsyncSpy).toHaveBeenCalledTimes(4)

      expect(postAsyncSpy).toHaveBeenNthCalledWith(4, EMOTION_AI_EVENT_URL, {
        body: visitorEventMove.toApiKeys(),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      jest.setSystemTime(fixedTimestamp)

      clickPath = `${mouseMoveEvent.clientX},${mouseMoveEvent.clientY},${fixedTimestamp.toString().slice(-5)};`

      const visitorEventMove2 = new VisitorEvent({
        visitorId,
        customerAccountId: sdkConfig.envId as string,
        clickPath,
        screenSize: '456,700;',
        currentUrl: 'home screen'
      })

      emotionAI.reportVisitorEvent(visitorEventMove2)

      expect(postAsyncSpy).toHaveBeenCalledTimes(5)

      expect(postAsyncSpy).toHaveBeenNthCalledWith(5, EMOTION_AI_EVENT_URL, {
        body: visitorEventMove2.toApiKeys(),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const pageView2 = pageView('home screen 2')

      emotionAI.reportPageView(pageView2)

      expect(postAsyncSpy).toHaveBeenCalledTimes(6)

      expect(postAsyncSpy).toHaveBeenNthCalledWith(6, EMOTION_AI_EVENT_URL, {
        body: pageView2.toApiKeys(),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      jest.advanceTimersByTime(MAX_COLLECTING_TIME_MS + 1000)

      emotionAI.reportVisitorEvent(visitorEventMove2)

      expect(postAsyncSpy).toHaveBeenCalledTimes(7)

      expect(postAsyncSpy).toHaveBeenNthCalledWith(5, EMOTION_AI_EVENT_URL, {
        body: visitorEventMove2.toApiKeys(),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      expect(onEAICollectStatusChange).toHaveBeenCalledTimes(2)

      expect(onEAICollectStatusChange).toHaveBeenNthCalledWith(2, false)

      getAsyncSpy.mockResolvedValue({ body: null, status: 200 })

      jest.advanceTimersByTime(SCORING_INTERVAL)

      expect(getAsyncSpy).toHaveBeenCalledTimes(1)

      const eAIScore:EAIScore = {
        eai: {
          eas: 'straightforward3'
        }
      }

      getAsyncSpy.mockResolvedValue({ body: eAIScore, status: 200 })

      await jest.advanceTimersByTimeAsync(SCORING_INTERVAL)

      expect(getAsyncSpy).toHaveBeenCalledTimes(2)

      expect(emotionAI.EAIScore).toEqual(eAIScore)

      expect(setIsEAIDataCollected).toHaveBeenCalledTimes(1)

      expect(setIsEAIDataCollected).toHaveBeenCalledWith(true)

      emotionAI.reportVisitorEvent(visitorEventMove2)

      emotionAI.reportPageView(pageView2)

      expect(postAsyncSpy).toHaveBeenCalledTimes(7)
    })

    it('should stop collecting when max last collecting time is reached', async () => {
      const emotionAI: EmotionAI = new EmotionAI({
        httpClient,
        sdkConfig,
        eAIConfig: {
          eaiActivationEnabled: true,
          eaiCollectEnabled: true
        }
      })

      emotionAI.init(visitorDelegate)

      postAsyncSpy.mockResolvedValue({ body: null, status: 200 })
      expect(emotionAI.EAIScore).toBeUndefined()
      expect(emotionAI.EAIScoreChecked).toBe(false)

      getAsyncSpy.mockResolvedValue({ body: null, status: 200 })

      await emotionAI.collectEAIEventsAsync({} as IPageView)

      const mouseUpEventClientX = 100
      const mouseUpEventClientY = 150

      const timestamp = (fixedTimestamp + 1000).toString().slice(-5)

      const visitorEvent = new VisitorEvent({
        visitorId,
        customerAccountId: sdkConfig.envId as string,
        clickPosition: `${mouseUpEventClientX},${mouseUpEventClientY},${timestamp},${100};`,
        screenSize: '456,700;',
        currentUrl: 'home screen'
      })

      emotionAI.reportVisitorEvent(visitorEvent)

      expect(postAsyncSpy).toHaveBeenCalledTimes(2)

      jest.advanceTimersByTime(MAX_LAST_COLLECTING_TIME_MS + 1000)

      emotionAI.reportVisitorEvent(visitorEvent)

      expect(postAsyncSpy).toHaveBeenCalledTimes(2)
      expect(setIsEAIDataCollected).toHaveBeenCalledTimes(1)
      expect(setIsEAIDataCollected).toHaveBeenCalledWith(false)
    })
  })

  describe('cleanup', () => {
    const getAsyncSpy = jest.fn<(url: string, options?: IHttpOptions) => Promise<IHttpResponse>>()
    const postAsyncSpy = jest.fn<(url: string, options: IHttpOptions) => Promise<IHttpResponse>>()
    const httpClient :IHttpClient = {
      getAsync: getAsyncSpy,
      postAsync: postAsyncSpy
    }
    const emotionAI: EmotionAI = new EmotionAI({
      httpClient,
      sdkConfig,
      eAIConfig: {
        eaiActivationEnabled: true,
        eaiCollectEnabled: true
      }
    })

    const fixedTimestamp = 254889889 // 1978-05-25T11:48:09.889Z

    beforeEach(() => {
      jest.useFakeTimers({ now: fixedTimestamp })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    emotionAI.init(visitorDelegate)

    it('should remove listeners and clear intervals', async () => {
      postAsyncSpy.mockResolvedValue({ body: null, status: 200 })
      expect(emotionAI.EAIScore).toBeUndefined()
      expect(emotionAI.EAIScoreChecked).toBe(false)

      getAsyncSpy.mockResolvedValue({ body: null, status: 200 })

      await emotionAI.collectEAIEventsAsync({} as IPageView)

      const mouseUpEventClientX = 100
      const mouseUpEventClientY = 150

      const visitorEvent = new VisitorEvent({
        visitorId,
        customerAccountId: sdkConfig.envId as string,
        clickPosition: `${mouseUpEventClientX},${mouseUpEventClientY},${45152},${100};`,
        screenSize: '456,700;',
        currentUrl: 'home screen'
      })

      emotionAI.reportVisitorEvent(visitorEvent)

      expect(postAsyncSpy).toHaveBeenCalledTimes(2)

      emotionAI.cleanup()

      emotionAI.reportVisitorEvent(visitorEvent)

      expect(postAsyncSpy).toHaveBeenCalledTimes(2)
      expect(setIsEAIDataCollected).toHaveBeenCalledTimes(0)
    })
  })
})
