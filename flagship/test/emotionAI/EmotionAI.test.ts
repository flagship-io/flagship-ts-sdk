/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals'
import { EmotionAI } from '../../src/emotionAI/EmotionAI'
import { IHttpClient, IHttpOptions, IHttpResponse } from '../../src/utils/HttpClient'
import { DecisionApiConfig, EAIScore, FSFetchReasons } from '../../src'
import { EAIConfig } from '../../src/type.local'
import { VisitorDelegate } from '../../src/visitor'
import { ConfigManager } from '../../src/config'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ApiManager } from '../../src/decision/ApiManager'
import { CLICK_PATH_DELAY_MS, EAI_SCORE_CONTEXT_KEY, EMOTION_AI_EVENT_URL, EMOTION_AI_UC_URL, MAX_COLLECTING_TIME_MS, MAX_LAST_COLLECTING_TIME_MS, MAX_SCORING_POLLING_TIME, SCORING_INTERVAL, SCROLL_END_DELAY_MS } from '../../src/enum/FlagshipConstant'
import { sleep, sprintf } from '../../src/utils/utils'
import { PageView } from '../../src/emotionAI/hit/PageView'
import { VisitorEvent } from '../../src/emotionAI/hit/VisitorEvent'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'

describe('EmotionAI', () => {
  const getAsyncSpy = jest.fn<(url: string, options?: IHttpOptions) => Promise<IHttpResponse>>()
  const postAsyncSpy = jest.fn<(url: string, options: IHttpOptions) => Promise<IHttpResponse>>()
  const httpClient :IHttpClient = {
    getAsync: getAsyncSpy,
    postAsync: postAsyncSpy
  }
  const sdkConfig = new DecisionApiConfig({ envId: 'env', apiKey: 'api' })
  const eAIConfig: EAIConfig = {
    eaiActivationEnabled: true,
    eaiCollectEnabled: true
  }

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

  const setCachedEAIScore = jest.spyOn(visitorDelegate, 'setCachedEAIScore')
  const getCachedEAIScore = jest.spyOn(visitorDelegate, 'getCachedEAIScore')
  const setIsEAIDataCollected = jest.spyOn(visitorDelegate, 'setIsEAIDataCollected')
  const isEAIDataCollected = jest.spyOn(visitorDelegate, 'isEAIDataCollected')

  const url = sprintf(EMOTION_AI_UC_URL, sdkConfig.envId, visitorId) + '?partner=eai'

  afterEach(() => {
    postAsyncSpy.mockReset()
  })

  describe('fetchEAIScore', () => {
    const getAsyncSpy = jest.fn<(url: string, options?: IHttpOptions) => Promise<IHttpResponse>>()
    const postAsyncSpy = jest.fn<(url: string, options: IHttpOptions) => Promise<IHttpResponse>>()
    const httpClient :IHttpClient = {
      getAsync: getAsyncSpy,
      postAsync: postAsyncSpy
    }
    const emotionAI: EmotionAI = new EmotionAI({
      httpClient,
      sdkConfig,
      eAIConfig
    })

    emotionAI.init(visitorDelegate)

    it('should fetch EAI score from score route', async () => {
      const eAIScore:EAIScore = {
        eai: {
          eas: 'straightforward'
        }
      }

      getCachedEAIScore.mockResolvedValue(undefined)

      getAsyncSpy.mockImplementation(async () => {
        await sleep(1500)

        return { body: eAIScore, status: 200 }
      })

      emotionAI.fetchEAIScore()
      const response = await emotionAI.fetchEAIScore()
      expect(getAsyncSpy).toHaveBeenCalledTimes(1)
      expect(getAsyncSpy).toHaveBeenCalledWith(url)
      expect(response).toBe(eAIScore)
      expect(emotionAI.EAIScore).toBe(eAIScore)
      expect(emotionAI.EAIScoreChecked).toBe(true)
      expect(setCachedEAIScore).toHaveBeenCalledWith(eAIScore)
      expect(setCachedEAIScore).toBeCalledTimes(1)

      const response2 = await emotionAI.fetchEAIScore()
      expect(response2).toEqual(eAIScore)

      expect(getAsyncSpy).toBeCalledTimes(1)
      expect(setCachedEAIScore).toBeCalledTimes(1)

      expect(visitorDelegate.context[EAI_SCORE_CONTEXT_KEY]).toEqual('straightforward')
      expect(visitorDelegate.fetchStatus.reason).toEqual(FSFetchReasons.UPDATE_CONTEXT)
    })

    it('should return score from cache if available', async () => {
      const emotionAI: EmotionAI = new EmotionAI({
        httpClient,
        sdkConfig,
        eAIConfig
      })

      emotionAI.init(visitorDelegate)

      const eAIScore:EAIScore = {
        eai: {
          eas: 'straightforward-2'
        }
      }
      getCachedEAIScore.mockResolvedValue(eAIScore)
      const response = await emotionAI.fetchEAIScore()
      expect(getAsyncSpy).toHaveBeenCalledTimes(0)
      expect(response).toEqual(eAIScore)
      expect(visitorDelegate.context[EAI_SCORE_CONTEXT_KEY]).toEqual('straightforward-2')
      expect(visitorDelegate.fetchStatus.reason).toEqual(FSFetchReasons.UPDATE_CONTEXT)
    })

    it('should return null if status is not 200', async () => {
      const emotionAI: EmotionAI = new EmotionAI({
        httpClient,
        sdkConfig,
        eAIConfig
      })

      emotionAI.init(visitorDelegate)

      getCachedEAIScore.mockResolvedValue(undefined)
      getAsyncSpy.mockRejectedValue({ body: null, status: 404 })

      const response = await emotionAI.fetchEAIScore()
      expect(response).toBeUndefined()
    })

    it('should return null if eaiActivationEnabled is false', async () => {
      const emotionAI: EmotionAI = new EmotionAI({
        httpClient,
        sdkConfig,
        eAIConfig: {
          eaiActivationEnabled: false,
          eaiCollectEnabled: true
        }
      })

      emotionAI.init(visitorDelegate)

      const response = await emotionAI.fetchEAIScore()
      expect(getAsyncSpy).toHaveBeenCalledTimes(0)
      expect(setCachedEAIScore).toBeCalledTimes(0)
      expect(response).toBeUndefined()
    })
  })

  describe('test collectEAIData', () => {
    const getAsyncSpy = jest.fn<(url: string, options?: IHttpOptions) => Promise<IHttpResponse>>()
    const postAsyncSpy = jest.fn<(url: string, options: IHttpOptions) => Promise<IHttpResponse>>()
    const httpClient :IHttpClient = {
      getAsync: getAsyncSpy,
      postAsync: postAsyncSpy
    }
    const { location } = window

    const fixedTimestamp = 254889889 // 1978-05-25T11:48:09.889Z

    beforeEach(() => {
      jest.useFakeTimers({ now: fixedTimestamp })
      Object.defineProperty(navigator, 'userAgent', {
        value: 'SomeRandomUserAgent',
        writable: true
      })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    afterAll(() => {
      window.location = location
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

      await emotionAI.collectEAIEventsAsync()

      expect(onEAICollectStatusChange).toHaveBeenCalledTimes(0)
      expect(getAsyncSpy).toHaveBeenCalledTimes(1)
      expect(getAsyncSpy).toHaveBeenNthCalledWith(1, url)

      const mouseUpEventClientX = 100
      const mouseUpEventClientY = 150

      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: mouseUpEventClientX,
        clientY: mouseUpEventClientY,
        bubbles: true,
        cancelable: true
      })

      jest.setSystemTime(fixedTimestamp)
      document.dispatchEvent(mouseDownEvent)

      const mouseUpEvent = new MouseEvent('mouseup', {
        clientX: mouseUpEventClientX,
        clientY: mouseUpEventClientY,
        bubbles: true,
        cancelable: true
      })

      jest.setSystemTime(fixedTimestamp + 1000)

      document.dispatchEvent(mouseUpEvent)

      const maxTouchPoints = navigator.maxTouchPoints || 0
      const touchEvent = 'ontouchstart' in window
      const touchStart = 'ontouchstart' in window || 'onmsgesturechange' in window
      const touchSupport = JSON.stringify([maxTouchPoints, touchEvent, touchStart])

      const pageView = () => new PageView({
        visitorId,
        customerAccountId: sdkConfig.envId as string,
        currentUrl: window.location.href,
        hasAdBlocker: false,
        screenDepth: `${window.screen.colorDepth}`,
        screenSize: `${window.innerWidth},${window.innerHeight};`,
        doNotTrack: navigator.doNotTrack || 'unspecified',
        fonts: '[]',
        hasFakeBrowserInfos: false,
        hasFakeLanguageInfos: false,
        hasFakeOsInfos: false,
        hasFakeResolutionInfos: false,
        userLanguage: navigator.language,
        deviceCategory: 'unknown',
        pixelRatio: window.devicePixelRatio,
        documentReferer: document.referrer,
        viewportSize: `[${document.documentElement.clientWidth},${document.documentElement.clientHeight}]`,
        timezoneOffset: new Date().getTimezoneOffset(),
        touchSupport,
        eventCategory: 'click tunnel auto',
        userAgent: navigator.userAgent
      })

      expect(postAsyncSpy).toHaveBeenCalledTimes(2)

      expect(postAsyncSpy).toHaveBeenNthCalledWith(1, EMOTION_AI_EVENT_URL, {
        body: pageView().toApiKeys(),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      let timestamp = (fixedTimestamp + 1000).toString().slice(-5)

      const clickDuration = 1000

      const visitorEvent = new VisitorEvent({
        visitorId,
        customerAccountId: sdkConfig.envId as string,
        clickPosition: `${mouseUpEventClientX},${mouseUpEventClientY},${timestamp},${clickDuration};`,
        screenSize: `${window.innerWidth},${window.innerHeight};`,
        currentUrl: window.location.href
      })

      expect(postAsyncSpy).toHaveBeenNthCalledWith(2, EMOTION_AI_EVENT_URL, {
        body: visitorEvent.toApiKeys(),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const scrollEvent = new Event('scroll', {
        bubbles: true,
        cancelable: true
      })

      jest.setSystemTime(fixedTimestamp)

      window.dispatchEvent(scrollEvent)
      window.dispatchEvent(scrollEvent)

      jest.advanceTimersByTime(SCROLL_END_DELAY_MS)

      timestamp = (fixedTimestamp + SCROLL_END_DELAY_MS).toString().slice(-5)

      const scrollPosition = `${window.scrollY},${timestamp};`
      const visitorEventScroll = new VisitorEvent({
        visitorId,
        customerAccountId: sdkConfig.envId as string,
        scrollPosition,
        screenSize: `${window.innerWidth},${window.innerHeight};`,
        currentUrl: window.location.href
      })

      expect(postAsyncSpy).toHaveBeenNthCalledWith(3, EMOTION_AI_EVENT_URL, {
        body: visitorEventScroll.toApiKeys(),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const mouseMoveEvent = {
        clientX: 0, // X-coordinate of the mouse
        clientY: 0, // Y-coordinate of the mouse
        bubbles: true, // Allows the event to bubble up through the DOM
        cancelable: true, // Allows the event to be canceled
        view: window // Sets the `window` as the view
      }

      let clickPath = ''

      jest.setSystemTime(fixedTimestamp)

      for (let index = 0; index < 148; index++) {
        mouseMoveEvent.clientX = index
        mouseMoveEvent.clientY = index + 50
        clickPath += `${mouseMoveEvent.clientX},${mouseMoveEvent.clientY},${fixedTimestamp.toString().slice(-5)};`
        document.dispatchEvent(new MouseEvent('mousemove', mouseMoveEvent))
      }

      const visitorEventMove = new VisitorEvent({
        visitorId,
        customerAccountId: sdkConfig.envId as string,
        clickPath,
        screenSize: `${window.innerWidth},${window.innerHeight};`,
        currentUrl: window.location.href
      })

      expect(postAsyncSpy).toHaveBeenCalledTimes(4)

      expect(postAsyncSpy).toHaveBeenNthCalledWith(4, EMOTION_AI_EVENT_URL, {
        body: visitorEventMove.toApiKeys(),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      jest.setSystemTime(fixedTimestamp)

      document.dispatchEvent(new MouseEvent('mousemove', mouseMoveEvent))
      clickPath = `${mouseMoveEvent.clientX},${mouseMoveEvent.clientY},${fixedTimestamp.toString().slice(-5)};`

      jest.advanceTimersByTime(CLICK_PATH_DELAY_MS)

      expect(postAsyncSpy).toHaveBeenCalledTimes(5)

      const visitorEventMove2 = new VisitorEvent({
        visitorId,
        customerAccountId: sdkConfig.envId as string,
        clickPath,
        screenSize: `${window.innerWidth},${window.innerHeight};`,
        currentUrl: window.location.href
      })

      expect(postAsyncSpy).toHaveBeenNthCalledWith(5, EMOTION_AI_EVENT_URL, {
        body: visitorEventMove2.toApiKeys(),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      window.history.pushState({ page: 1 }, 'title 1', '?page=1')

      expect(postAsyncSpy).toHaveBeenCalledTimes(6)

      expect(postAsyncSpy).toHaveBeenNthCalledWith(6, EMOTION_AI_EVENT_URL, {
        body: pageView().toApiKeys(),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      window.history.replaceState({ page: 2 }, 'title 2', '?page=2')

      expect(postAsyncSpy).toHaveBeenCalledTimes(7)

      expect(postAsyncSpy).toHaveBeenNthCalledWith(7, EMOTION_AI_EVENT_URL, {
        body: pageView().toApiKeys(),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      delete (window as any).location
      window.location = { ...location, href: 'http://test.com' }

      window.dispatchEvent(new Event('popstate'))

      expect(postAsyncSpy).toHaveBeenCalledTimes(8)

      expect(postAsyncSpy).toHaveBeenNthCalledWith(8, EMOTION_AI_EVENT_URL, {
        body: pageView().toApiKeys(),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      window.dispatchEvent(new Event('popstate'))

      expect(postAsyncSpy).toHaveBeenCalledTimes(8)

      jest.setSystemTime(fixedTimestamp + MAX_COLLECTING_TIME_MS + 1000)

      window.dispatchEvent(new Event('scroll', {
        bubbles: true,
        cancelable: true
      }))

      jest.advanceTimersByTime(SCROLL_END_DELAY_MS)

      expect(postAsyncSpy).toHaveBeenCalledTimes(9)

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
      expect(getAsyncSpy).toHaveBeenNthCalledWith(2, expect.stringContaining(url + '&v='))

      expect(emotionAI.EAIScore).toEqual(eAIScore)

      expect(setIsEAIDataCollected).toHaveBeenCalledTimes(1)

      expect(setIsEAIDataCollected).toHaveBeenCalledWith(true)

      document.dispatchEvent(new MouseEvent('mousedown', {
        clientX: mouseUpEventClientX,
        clientY: mouseUpEventClientY,
        bubbles: true,
        cancelable: true
      }))

      document.dispatchEvent(new MouseEvent('mouseup', {
        clientX: mouseUpEventClientX,
        clientY: mouseUpEventClientY,
        bubbles: true,
        cancelable: true
      }))

      expect(postAsyncSpy).toHaveBeenCalledTimes(9)

      window.dispatchEvent(new Event('scroll', {
        bubbles: true,
        cancelable: true
      }))

      jest.advanceTimersByTime(SCROLL_END_DELAY_MS)

      expect(postAsyncSpy).toHaveBeenCalledTimes(9)

      document.dispatchEvent(new MouseEvent('mousemove', {
        clientX: 0,
        clientY: 0,
        bubbles: true,
        cancelable: true,
        view: window
      }))

      jest.advanceTimersByTime(CLICK_PATH_DELAY_MS)

      expect(postAsyncSpy).toHaveBeenCalledTimes(9)
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

      await emotionAI.collectEAIEventsAsync()

      const mouseUpEventClientX = 100
      const mouseUpEventClientY = 150

      document.dispatchEvent(new MouseEvent('mousedown', {
        clientX: mouseUpEventClientX,
        clientY: mouseUpEventClientY,
        bubbles: true,
        cancelable: true
      }))

      document.dispatchEvent(new MouseEvent('mouseup', {
        clientX: mouseUpEventClientX,
        clientY: mouseUpEventClientY,
        bubbles: true,
        cancelable: true
      }))

      expect(postAsyncSpy).toHaveBeenCalledTimes(2)

      jest.advanceTimersByTime(MAX_LAST_COLLECTING_TIME_MS + 1000)

      document.dispatchEvent(new MouseEvent('mousedown', {
        clientX: mouseUpEventClientX,
        clientY: mouseUpEventClientY,
        bubbles: true,
        cancelable: true
      }))

      document.dispatchEvent(new MouseEvent('mouseup', {
        clientX: mouseUpEventClientX,
        clientY: mouseUpEventClientY,
        bubbles: true,
        cancelable: true
      }))

      expect(postAsyncSpy).toHaveBeenCalledTimes(2)
      expect(setIsEAIDataCollected).toHaveBeenCalledTimes(1)
      expect(setIsEAIDataCollected).toHaveBeenCalledWith(false)
    })

    it('should stop polling for score when max scoring polling time is reached', async () => {
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

      await emotionAI.collectEAIEventsAsync()

      const mouseUpEventClientX = 100
      const mouseUpEventClientY = 150

      document.dispatchEvent(new MouseEvent('mousedown', {
        clientX: mouseUpEventClientX,
        clientY: mouseUpEventClientY,
        bubbles: true,
        cancelable: true
      }))

      document.dispatchEvent(new MouseEvent('mouseup', {
        clientX: mouseUpEventClientX,
        clientY: mouseUpEventClientY,
        bubbles: true,
        cancelable: true
      }))

      expect(postAsyncSpy).toHaveBeenCalledTimes(2)

      jest.advanceTimersByTime(MAX_COLLECTING_TIME_MS + 1000)

      document.dispatchEvent(new MouseEvent('mousedown', {
        clientX: mouseUpEventClientX,
        clientY: mouseUpEventClientY,
        bubbles: true,
        cancelable: true
      }))

      document.dispatchEvent(new MouseEvent('mouseup', {
        clientX: mouseUpEventClientX,
        clientY: mouseUpEventClientY,
        bubbles: true,
        cancelable: true
      }))

      expect(postAsyncSpy).toHaveBeenCalledTimes(3)

      jest.advanceTimersByTime(SCORING_INTERVAL + MAX_SCORING_POLLING_TIME)

      expect(getAsyncSpy).toHaveBeenCalledTimes(1)

    //   expect(setIsEAIDataCollected).toHaveBeenCalledTimes(0)
    })

    it('should not collect data if eaiCollectEnabled is false', async () => {
      const emotionAI: EmotionAI = new EmotionAI({
        httpClient,
        sdkConfig,
        eAIConfig: {
          eaiActivationEnabled: true,
          eaiCollectEnabled: false
        }
      })

      emotionAI.init(visitorDelegate)

      postAsyncSpy.mockResolvedValue({ body: null, status: 200 })
      expect(emotionAI.EAIScore).toBeUndefined()
      expect(emotionAI.EAIScoreChecked).toBe(false)

      getAsyncSpy.mockResolvedValue({ body: null, status: 200 })

      await emotionAI.collectEAIEventsAsync()

      expect(postAsyncSpy).toHaveBeenCalledTimes(0)
    })

    it('should not collect data if collectEAIData is already in progress', async () => {
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

      await emotionAI.collectEAIEventsAsync()

      expect(postAsyncSpy).toHaveBeenCalledTimes(1)

      await emotionAI.collectEAIEventsAsync()

      expect(postAsyncSpy).toHaveBeenCalledTimes(1)

      emotionAI.cleanup()
    })

    it('should not collect data if score exists', async () => {
      const emotionAI: EmotionAI = new EmotionAI({
        httpClient,
        sdkConfig,
        eAIConfig: {
          eaiActivationEnabled: true,
          eaiCollectEnabled: true
        }
      })

      emotionAI.init(visitorDelegate)

      const eAIScore:EAIScore = {
        eai: {
          eas: 'straightforward3'
        }
      }

      postAsyncSpy.mockResolvedValue({ body: null, status: 200 })
      expect(emotionAI.EAIScore).toBeUndefined()
      expect(emotionAI.EAIScoreChecked).toBe(false)

      getAsyncSpy.mockResolvedValue({ body: eAIScore, status: 200 })

      await emotionAI.collectEAIEventsAsync()

      expect(postAsyncSpy).toHaveBeenCalledTimes(0)
      expect(setIsEAIDataCollected).toHaveBeenCalledTimes(0)
    })

    it('should not polling for score if  eaiActivationEnabled is false', async () => {
      const emotionAI: EmotionAI = new EmotionAI({
        httpClient,
        sdkConfig,
        eAIConfig: {
          eaiActivationEnabled: false,
          eaiCollectEnabled: true
        }
      })

      emotionAI.init(visitorDelegate)

      postAsyncSpy.mockResolvedValue({ body: null, status: 200 })

      expect(emotionAI.EAIScore).toBeUndefined()
      expect(emotionAI.EAIScoreChecked).toBe(false)

      getAsyncSpy.mockResolvedValue({ body: null, status: 200 })

      await emotionAI.collectEAIEventsAsync()

      const mouseUpEventClientX = 100
      const mouseUpEventClientY = 150

      document.dispatchEvent(new MouseEvent('mousedown', {
        clientX: mouseUpEventClientX,
        clientY: mouseUpEventClientY,
        bubbles: true,
        cancelable: true
      }))

      await jest.advanceTimersByTimeAsync(100)

      document.dispatchEvent(new MouseEvent('mouseup', {
        clientX: mouseUpEventClientX + 1,
        clientY: mouseUpEventClientY + 1,
        bubbles: true,
        cancelable: true
      }))

      expect(postAsyncSpy).toHaveBeenCalledTimes(2)

      await jest.advanceTimersByTimeAsync(MAX_COLLECTING_TIME_MS + 10)

      document.dispatchEvent(new MouseEvent('mousedown', {
        clientX: mouseUpEventClientX,
        clientY: mouseUpEventClientY,
        bubbles: true,
        cancelable: true
      }))

      document.dispatchEvent(new MouseEvent('mouseup', {
        clientX: mouseUpEventClientX,
        clientY: mouseUpEventClientY,
        bubbles: true,
        cancelable: true
      }))

      expect(postAsyncSpy).toHaveBeenCalledTimes(3)

      jest.advanceTimersByTime(SCORING_INTERVAL + MAX_SCORING_POLLING_TIME)

      expect(getAsyncSpy).toHaveBeenCalledTimes(0)
      expect(setIsEAIDataCollected).toHaveBeenCalledTimes(1)
      expect(setIsEAIDataCollected).toHaveBeenCalledWith(true)
    })

    it('should not collect data if eaiActivationEnabled is false and isEAIDataCollected is true', async () => {
      const emotionAI: EmotionAI = new EmotionAI({
        httpClient,
        sdkConfig,
        eAIConfig: {
          eaiActivationEnabled: false,
          eaiCollectEnabled: true
        }
      })

      emotionAI.init(visitorDelegate)

      postAsyncSpy.mockResolvedValue({ body: null, status: 200 })
      expect(emotionAI.EAIScore).toBeUndefined()
      expect(emotionAI.EAIScoreChecked).toBe(false)

      isEAIDataCollected.mockResolvedValue(true)

      await emotionAI.collectEAIEventsAsync()

      expect(postAsyncSpy).toHaveBeenCalledTimes(0)
    })

    it('should collect data if eaiActivationEnabled is false and isEAIDataCollected is false', async () => {
      const emotionAI: EmotionAI = new EmotionAI({
        httpClient,
        sdkConfig,
        eAIConfig: {
          eaiActivationEnabled: false,
          eaiCollectEnabled: true
        }
      })

      emotionAI.init(visitorDelegate)

      postAsyncSpy.mockResolvedValue({ body: null, status: 200 })
      expect(emotionAI.EAIScore).toBeUndefined()
      expect(emotionAI.EAIScoreChecked).toBe(false)

      isEAIDataCollected.mockResolvedValue(false)

      getAsyncSpy.mockResolvedValue({ body: null, status: 200 })

      await emotionAI.collectEAIEventsAsync()

      const mouseUpEventClientX = 100
      const mouseUpEventClientY = 150

      document.dispatchEvent(new MouseEvent('mousedown', {
        clientX: mouseUpEventClientX,
        clientY: mouseUpEventClientY,
        bubbles: true,
        cancelable: true
      }))

      document.dispatchEvent(new MouseEvent('mouseup', {
        clientX: mouseUpEventClientX,
        clientY: mouseUpEventClientY,
        bubbles: true,
        cancelable: true
      }))

      expect(postAsyncSpy).toHaveBeenCalledTimes(2)

      emotionAI.cleanup()
    })

    it('should collect data if eaiActivationEnabled is true and isEAIDataCollected is true', async () => {
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

      isEAIDataCollected.mockResolvedValue(true)

      await emotionAI.collectEAIEventsAsync()

      expect(postAsyncSpy).toHaveBeenCalledTimes(1)

      emotionAI.cleanup()
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

    const { location } = window

    const fixedTimestamp = 254889889 // 1978-05-25T11:48:09.889Z

    beforeEach(() => {
      jest.useFakeTimers({ now: fixedTimestamp })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    afterAll(() => {
      window.location = location
    })

    emotionAI.init(visitorDelegate)

    it('should remove listeners and clear intervals', async () => {
      postAsyncSpy.mockResolvedValue({ body: null, status: 200 })
      expect(emotionAI.EAIScore).toBeUndefined()
      expect(emotionAI.EAIScoreChecked).toBe(false)

      getAsyncSpy.mockResolvedValue({ body: null, status: 200 })

      await emotionAI.collectEAIEventsAsync()

      const mouseUpEventClientX = 100
      const mouseUpEventClientY = 150

      document.dispatchEvent(new MouseEvent('mousedown', {
        clientX: mouseUpEventClientX,
        clientY: mouseUpEventClientY,
        bubbles: true,
        cancelable: true
      }))

      document.dispatchEvent(new MouseEvent('mouseup', {
        clientX: mouseUpEventClientX,
        clientY: mouseUpEventClientY,
        bubbles: true,
        cancelable: true
      }))

      expect(postAsyncSpy).toHaveBeenCalledTimes(2)

      emotionAI.cleanup()

      document.dispatchEvent(new MouseEvent('mousedown', {
        clientX: mouseUpEventClientX,
        clientY: mouseUpEventClientY,
        bubbles: true,
        cancelable: true
      }))

      document.dispatchEvent(new MouseEvent('mouseup', {
        clientX: mouseUpEventClientX,
        clientY: mouseUpEventClientY,
        bubbles: true,
        cancelable: true
      }))

      expect(postAsyncSpy).toHaveBeenCalledTimes(2)
      expect(setIsEAIDataCollected).toHaveBeenCalledTimes(0)
    })
  })

  describe('getDeviceCategory', () => {
    const emotionAI: EmotionAI = new EmotionAI({
      httpClient,
      sdkConfig,
      eAIConfig
    })

    emotionAI.init(visitorDelegate)

    it('should return correct device category for iPhone', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X)',
        writable: true
      })
      expect(emotionAI.getDeviceCategory()).toBe('iphone')
    })

    it('should return correct device category for Android', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10)',
        writable: true
      })
      expect(emotionAI.getDeviceCategory()).toBe('android')
    })

    it('should return correct device category for Windows', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true
      })
      expect(emotionAI.getDeviceCategory()).toBe('win32')
    })

    it('should return correct device category for Mac', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5)',
        writable: true
      })
      expect(emotionAI.getDeviceCategory()).toBe('darwin')
    })

    it('should return correct device category for Linux', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux x86_64)',
        writable: true
      })
      expect(emotionAI.getDeviceCategory()).toBe('linux')
    })

    it('should return correct device category for Linux armv8l', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux armv8l)',
        writable: true
      })
      expect(emotionAI.getDeviceCategory()).toBe('linux armv8l')
    })

    it('should return "unknown" for unrecognized user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'SomeRandomUserAgent',
        writable: true
      })
      expect(emotionAI.getDeviceCategory()).toBe('unknown')
    })
  })

  describe('reportVisitorEvent', () => {
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

    const { location } = window

    const fixedTimestamp = 254889889 // 1978-05-25T11:48:09.889Z

    beforeEach(() => {
      jest.useFakeTimers({ now: fixedTimestamp })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    afterAll(() => {
      window.location = location
    })

    emotionAI.init(visitorDelegate)

    it('should trigger error when reporting visitor event', async () => {
      const logManager = new FlagshipLogManager()
      const logError = jest.spyOn(logManager, 'error')

      sdkConfig.logManager = logManager

      postAsyncSpy.mockRejectedValue({ body: null, status: 400 })
      expect(emotionAI.EAIScore).toBeUndefined()
      expect(emotionAI.EAIScoreChecked).toBe(false)

      getAsyncSpy.mockResolvedValue({ body: null, status: 200 })

      await emotionAI.collectEAIEventsAsync()

      const mouseUpEventClientX = 100
      const mouseUpEventClientY = 150

      document.dispatchEvent(new MouseEvent('mousedown', {
        clientX: mouseUpEventClientX,
        clientY: mouseUpEventClientY,
        bubbles: true,
        cancelable: true
      }))

      document.dispatchEvent(new MouseEvent('mouseup', {
        clientX: mouseUpEventClientX,
        clientY: mouseUpEventClientY,
        bubbles: true,
        cancelable: true
      }))

      expect(postAsyncSpy).toHaveBeenCalledTimes(2)
      expect(logError).toHaveBeenCalledTimes(1)
    })
  })
})
