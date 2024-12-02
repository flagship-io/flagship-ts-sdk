/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals'
import { EmotionAI } from '../../src/emotionAI/EmotionAI'
import { HttpClient } from '../../src/utils/HttpClient'
import { DecisionApiConfig, EAIScore } from '../../src'
import { EAIConfig } from '../../src/type.local'
import { VisitorDelegate } from '../../src/visitor'
import { ConfigManager } from '../../src/config'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ApiManager } from '../../src/decision/ApiManager'
import { CLICK_PATH_DELAY_MS, EMOTION_AI_EVENT_URL, EMOTION_AI_UC_URL, MAX_COLLECTING_TIME_MS, MAX_LAST_COLLECTING_TIME_MS, SCROLL_END_DELAY_MS } from '../../src/enum/FlagshipConstant'
import { sleep, sprintf } from '../../src/utils/utils'
import { PageView } from '../../src/emotionAI/hit/PageView'
import { VisitorEvent } from '../../src/emotionAI/hit/VisitorEvent'

describe('EmotionAI', () => {
  const httpClient = new HttpClient()
  const sdkConfig = new DecisionApiConfig({ envId: 'env', apiKey: 'api' })
  const eAIConfig: EAIConfig = {
    eaiActivationEnabled: true,
    eaiCollectEnabled: true
  }
  const getAsyncSpy = jest.spyOn(httpClient, 'getAsync')

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

  const emotionAI: EmotionAI = new EmotionAI({
    httpClient,
    sdkConfig,
    eAIConfig
  })

  emotionAI.init(visitorDelegate)

  beforeEach(() => {
    // Mock global objects
    // Object.defineProperty(window, 'history', {
    //   value: {
    //     pushState: jest.fn(),
    //     replaceState: jest.fn()
    //   },
    //   writable: true
    // })

    // window.addEventListener = jest.fn()
    // window.removeEventListener = jest.fn()
    // document.addEventListener = jest.fn()
    // document.removeEventListener = jest.fn()
    // jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
    // jest.useRealTimers()
  })

  describe('fetchEAIScore', () => {
    const url = sprintf(EMOTION_AI_UC_URL, sdkConfig.envId, visitorId)
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

    const postAsyncSpy = jest.spyOn(httpClient, 'postAsync')

    emotionAI.init(visitorDelegate)

    const onEAICollectStatusChange = jest.fn<(status: boolean) => void>()

    it('should not collect data if eaiCollectEnabled is false', async () => {
      postAsyncSpy.mockResolvedValue({ body: null, status: 200 })
      expect(emotionAI.EAIScore).toBeUndefined()
      expect(emotionAI.EAIScoreChecked).toBe(false)

      emotionAI.onEAICollectStatusChange(onEAICollectStatusChange)

      await emotionAI.collectEAIData()

      expect(onEAICollectStatusChange).toHaveBeenCalledTimes(0)

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
    })
  })

  //   describe('cleanup', () => {
  //     it('should remove listeners and clear intervals', () => {
  //       const removeListenersSpy = jest.spyOn(emotionAI as any, 'removeListeners')
  //       const clearIntervalSpy = jest.spyOn(global, 'clearInterval')

  //       ;(emotionAI as any)._scoringIntervalId = 123
  //       emotionAI.cleanup()

  //       expect(removeListenersSpy).toHaveBeenCalled()
  //       expect(emotionAI._isEAIDataCollecting).toBe(false)
  //       expect(emotionAI._isEAIDataCollected).toBe(false)
  //       expect(clearIntervalSpy).toHaveBeenCalledWith(123)
  //     })
  //   })

  //   describe('getDeviceCategory', () => {
  //     it('should return correct device category for iPhone', () => {
  //       Object.defineProperty(navigator, 'userAgent', {
  //         value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X)',
  //         writable: true
  //       })
  //       expect(emotionAI.getDeviceCategory()).toBe('iphone')
  //     })

  //     it('should return correct device category for Android', () => {
  //       Object.defineProperty(navigator, 'userAgent', {
  //         value: 'Mozilla/5.0 (Linux; Android 10)',
  //         writable: true
  //       })
  //       expect(emotionAI.getDeviceCategory()).toBe('android')
  //     })

  //     it('should return "unknown" for unrecognized user agent', () => {
  //       Object.defineProperty(navigator, 'userAgent', {
  //         value: 'SomeRandomUserAgent',
  //         writable: true
  //       })
  //       expect(emotionAI.getDeviceCategory()).toBe('unknown')
  //     })
  //   })

  //   describe('processPageView', () => {
  //     it('should report page view if location has changed', async () => {
  //       const visitorId = 'visitor-1'
  //       Object.defineProperty(window, 'location', {
  //         value: { href: 'http://test.com' },
  //         writable: true
  //       })
  //       const reportPageViewSpy = jest.spyOn(emotionAI as any, 'reportPageView').mockResolvedValue()

  //       await emotionAI.processPageView(visitorId)

  //       expect(emotionAI._lastPageViewLocation).toBe('http://test.com')
  //       expect(reportPageViewSpy).toHaveBeenCalled()
  //     })

  //     it('should not report page view if location has not changed', async () => {
  //       const visitorId = 'visitor-1'
  //       ;(emotionAI as any)._lastPageViewLocation = 'http://test.com'
  //       Object.defineProperty(window, 'location', {
  //         value: { href: 'http://test.com' },
  //         writable: true
  //       })
  //       const reportPageViewSpy = jest.spyOn(emotionAI as any, 'reportPageView').mockResolvedValue()

  //       await emotionAI.processPageView(visitorId)

  //       expect(reportPageViewSpy).not.toHaveBeenCalled()
  //     })
  //   })

  //   describe('startCollectingEAIData', () => {
  //     it('should add event listeners and override history methods', async () => {
  //       const visitorId = 'visitor-1'
  //       const processPageViewSpy = jest.spyOn(emotionAI as any, 'processPageView').mockResolvedValue()
  //       await emotionAI.startCollectingEAIData(visitorId)

  //       expect(processPageViewSpy).toHaveBeenCalledWith(visitorId)
  //       expect(emotionAI._isEAIDataCollecting).toBe(true)
  //       expect(window.addEventListener).toHaveBeenCalledTimes(5)
  //       expect(window.history.pushState).not.toBeUndefined()
  //       expect(window.history.replaceState).not.toBeUndefined()
  //     })
  //   })

  //   describe('removeListeners', () => {
  //     it('should remove all event listeners and restore history methods', () => {
  //       const originalPushState = window.history.pushState
  //       const originalReplaceState = window.history.replaceState
  //       ;(emotionAI as any)._originalPushState = originalPushState
  //       ;(emotionAI as any)._originalReplaceState = originalReplaceState

  //       emotionAI.removeListeners()

  //       expect(window.removeEventListener).toHaveBeenCalledTimes(5)
  //       expect(window.history.pushState).toBe(originalPushState)
  //       expect(window.history.replaceState).toBe(originalReplaceState)
  //       expect(emotionAI._scrollTimeoutId).toBeNull()
  //       expect(emotionAI._clickPathTimeoutId).toBeNull()
  //     })
  //   })

  //   describe('stopCollectingEAIData', () => {
  //     it('should stop data collection and handle scoring interval', async () => {
  //       jest.spyOn(emotionAI as any, 'removeListeners')
  //       ;(emotionAI as any)._scoringInterval = 1000
  //       ;(emotionAI as any).fetchEAIScore = jest.fn().mockResolvedValue(true)

  //       await emotionAI.stopCollectingEAIData()

  //       expect(emotionAI._startScoringTimestamp).toBeDefined()
  //       expect(setInterval).toHaveBeenCalled()
  //       jest.runOnlyPendingTimers()
  //       expect(emotionAI._isEAIDataCollecting).toBe(false)
  //       expect(emotionAI._isEAIDataCollected).toBe(true)
  //     })
  //   })

  //   describe('handleScroll', () => {
  //     it('should debounce scroll events and call onScrollEnd', () => {
  //       const visitorId = 'visitor-1'
  //       const onScrollEndSpy = jest.spyOn(emotionAI as any, 'onScrollEnd')
  //       emotionAI.handleScroll(visitorId)

  //       expect(emotionAI._scrollTimeoutId).not.toBeNull()
  //       jest.advanceTimersByTime(200)
  //       expect(onScrollEndSpy).toHaveBeenCalledWith(visitorId)
  //     })
  //   })

  //   describe('handleMouseMove', () => {
  //     it('should accumulate click path and send when limit is reached', () => {
  //       const visitorId = 'visitor-1'
  //       const sendClickPathSpy = jest.spyOn(emotionAI as any, 'sendClickPath')

  //       for (let i = 0; i < 10; i++) {
  //         emotionAI.handleMouseMove({ clientX: i, clientY: i } as MouseEvent, visitorId)
  //       }

  //       expect(sendClickPathSpy).toHaveBeenCalledWith(visitorId)
  //       expect(emotionAI._clickPath).toBe('')
  //     })

  //     it('should send click path after timeout', () => {
  //       const visitorId = 'visitor-1'
  //       const sendClickPathSpy = jest.spyOn(emotionAI as any, 'sendClickPath')

  //       emotionAI.handleMouseMove({ clientX: 100, clientY: 100 } as MouseEvent, visitorId)
  //       jest.advanceTimersByTime(500)
  //       expect(sendClickPathSpy).toHaveBeenCalledWith(visitorId)
  //       expect(emotionAI._clickPath).toBe('')
  //     })
  //   })

  //   describe('handleClick', () => {
  //     it('should report click position with duration', () => {
  //       const visitorId = 'visitor-1'
  //       const sendEAIEventSpy = jest.spyOn(emotionAI as any, 'sendEAIEvent')
  //       const reportVisitorEventSpy = jest.spyOn(emotionAI, 'reportVisitorEvent').mockResolvedValue()

  //       const event = { clientX: 50, clientY: 50 } as MouseEvent
  //       const clickDuration = 300
  //       emotionAI.handleClick(event, visitorId, clickDuration)

  //       expect(reportVisitorEventSpy).toHaveBeenCalledWith(expect.any(VisitorEvent))
  //     })
  //   })

  //   describe('reportVisitorEvent', () => {
  //     it('should send EAI event if within collecting time', async () => {
  //       const visitorEvent = new VisitorEvent({ visitorId: 'visitor-1' })
  //       jest.spyOn(emotionAI as any, 'sendEAIEvent').mockResolvedValue()
  //       ;(emotionAI as any)._startCollectingEAIDataTimestamp = Date.now()

  //       await emotionAI.reportVisitorEvent(visitorEvent)

  //       expect(emotionAI.sendEAIEvent).toHaveBeenCalledWith(visitorEvent)
  //     })

  //     it('should stop collecting data after max collecting time', async () => {
  //       const visitorEvent = new VisitorEvent({ visitorId: 'visitor-1' })
  //       jest.spyOn(emotionAI as any, 'sendEAIEvent').mockResolvedValue()
  //       const stopCollectingSpy = jest.spyOn(emotionAI as any, 'stopCollectingEAIData').mockResolvedValue()
  //       ;(emotionAI as any)._startCollectingEAIDataTimestamp = Date.now() - 2000 // Assume MAX_COLLECTING_TIME_MS < 2000

  //       await emotionAI.reportVisitorEvent(visitorEvent)

  //       expect(emotionAI.sendEAIEvent).toHaveBeenCalledWith(visitorEvent)
  //       expect(stopCollectingSpy).toHaveBeenCalled()
  //     })

  //     it('should remove listeners after max last collecting time', async () => {
  //       const visitorEvent = new VisitorEvent({ visitorId: 'visitor-1' })
  //       jest.spyOn(emotionAI as any, 'removeListeners')
  //       ;(emotionAI as any)._startCollectingEAIDataTimestamp = Date.now() - 5000 // Assume MAX_LAST_COLLECTING_TIME_MS < 5000

  //       await emotionAI.reportVisitorEvent(visitorEvent)

  //       expect(emotionAI.removeListeners).toHaveBeenCalled()
  //       expect(emotionAI._isEAIDataCollecting).toBe(false)
  //       expect(emotionAI._isEAIDataCollected).toBe(true)
  //     })
  //   })

  //   describe('sendClickPath', () => {
  //     it('should send click path and reset it', () => {
  //       const visitorId = 'visitor-1'
  //       const reportVisitorEventSpy = jest.spyOn(emotionAI, 'reportVisitorEvent').mockResolvedValue()
  //       ;(emotionAI as any)._clickPath = '100,200,12345;'

  //       emotionAI.sendClickPath(visitorId)

//       expect(reportVisitorEventSpy).toHaveBeenCalledWith(expect.any(VisitorEvent))
//       expect(emotionAI._clickPath).toBe('')
//     })
//   })
})
