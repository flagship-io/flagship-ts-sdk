/**
 * @jest-environment jsdom
 */
import { SharedActionTracking } from '../../src/sharedFeature/SharedActionTracking'
import * as utils from '../../src/utils/utils'
import { DecisionApiConfig, EventCategory, LogLevel } from '../../src'
import { VisitorAbstract } from '../../src/visitor/VisitorAbstract'
import { SharedAction } from '../../src/type.local'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'

describe('SharedActionTracking Tests', () => {
  let addEventListenerSpy: jest.SpyInstance
  let removeEventListenerSpy: jest.SpyInstance
  const isBrowserSpy = jest.spyOn(utils, 'isBrowser')

  const addEventListenerOriginal = window.addEventListener
  const removeEventListenerOriginal = window.removeEventListener

  // describe('SharedActionTracking', () => {
  //   const sdkConfig = new DecisionApiConfig({
  //     apiKey: 'apiKey',
  //     envId: 'envId',
  //     logLevel: LogLevel.DEBUG
  //   })
  //   const sharedActionTracking = new SharedActionTracking({ sdkConfig })

  //   const visitorMock = {
  //     visitorId: 'visitor_123',
  //     anonymousId: 'anon_456',
  //     addInTrackingManager: jest.fn()
  //   } as unknown as VisitorAbstract
  //   beforeAll(() => {
  //     addEventListenerSpy = jest.spyOn(window, 'addEventListener')
  //     removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
  //   })

  //   afterAll(() => {
  //     jest.restoreAllMocks()
  //     window.addEventListener = addEventListenerOriginal
  //     window.removeEventListener = removeEventListenerOriginal
  //   })

  //   test('generateNonce returns empty string when not in browser', () => {
  //     isBrowserSpy.mockReturnValue(false)
  //     const nonce = sharedActionTracking.generateNonce()
  //     expect(nonce).toBe('')
  //   })

  //   test('generateNonce returns a nonce and registers it when in browser', () => {
  //     isBrowserSpy.mockReturnValue(true)
  //     const nonce = sharedActionTracking.generateNonce()
  //     expect(nonce).toBeTruthy()
  //     expect((sharedActionTracking as any).trustedNonces[nonce]).toBe(false)
  //   })

  //   it('initialize sets visitor when not in browser', () => {
  //     isBrowserSpy.mockReturnValue(false)
  //     sharedActionTracking.initialize(visitorMock)
  //     expect(removeEventListenerSpy).toHaveBeenCalledTimes(0)
  //     expect(addEventListenerSpy).toHaveBeenCalledTimes(0)
  //   })

  //   test('initialize sets visitor and initTimestamp and manages message listeners', () => {
  //     isBrowserSpy.mockReturnValue(true)
  //     sharedActionTracking.initialize(visitorMock)
  //     expect(removeEventListenerSpy).toHaveBeenCalledTimes(0)
  //     expect(addEventListenerSpy).toHaveBeenCalledTimes(1)
  //     expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function))
  //   })
  // })

  describe('processHit', () => {
    const logManager = new FlagshipLogManager()
    const sdkConfig = new DecisionApiConfig({
      apiKey: 'apiKey',
      envId: 'envId',
      logLevel: LogLevel.INFO,
      logManager
    })

    const sharedActionTracking = new SharedActionTracking({ sdkConfig })

    const visitorMock = {
      visitorId: 'visitor_123',
      anonymousId: 'anon_456',
      addInTrackingManager: jest.fn()
    } as unknown as VisitorAbstract

    const logDebugSpy = jest.spyOn(logManager, 'debug')

    beforeAll(() => {
      window.addEventListener = addEventListenerOriginal
      window.removeEventListener = removeEventListenerOriginal
      isBrowserSpy.mockReturnValue(true)
      sharedActionTracking.initialize(visitorMock)
    })

    test('should call visitor.addInTrackingManager when a valid message event is dispatched', () => {
      const nonce = sharedActionTracking.generateNonce()

      const hit = {
        ec: EventCategory.ACTION_TRACKING,
        ea: 'click',
        el: 'test label',
        ev: 42
      }

      const payload = {
        action: SharedAction.ABT_TAG_TRACK_ACTION,
        nonce,
        data: [hit],
        timestamp: Date.now()
      }

      const messageEvent = new MessageEvent('message', {
        data: payload,
        origin: window.location.origin
      })

      window.dispatchEvent(messageEvent)

      expect(visitorMock.addInTrackingManager).toBeCalledTimes(1)
      expect(visitorMock.addInTrackingManager).toBeCalledWith(expect.objectContaining({
        category: hit.ec,
        action: hit.ea,
        label: hit.el,
        value: hit.ev,
        visitorId: visitorMock.visitorId,
        anonymousId: visitorMock.anonymousId
      }))
    })

    // it('should not call visitor.addInTrackingManager when a message event is dispatched with different origin or data is undefined', () => {
    //   const nonce = sharedActionTracking.generateNonce()

    //   const hit = {
    //     ec: EventCategory.ACTION_TRACKING,
    //     ea: 'click',
    //     el: 'test label',
    //     ev: 42
    //   }

    //   const payload = {
    //     action: SharedAction.ABT_TAG_TRACK_ACTION,
    //     nonce,
    //     data: [hit],
    //     timestamp: Date.now()
    //   }

    //   const messageEvent = new MessageEvent('message', {
    //     data: payload,
    //     origin: 'https://example.com'
    //   })

    //   window.dispatchEvent(messageEvent)

    //   expect(visitorMock.addInTrackingManager).toBeCalledTimes(0)

    //   const messageEvent2 = new MessageEvent('message', {
    //     origin: 'https://example.com'
    //   })

    //   window.dispatchEvent(messageEvent2)

    //   expect(visitorMock.addInTrackingManager).toBeCalledTimes(0)
    // })

    // it('should not call visitor.addInTrackingManager when a message event is dispatched with different action or nonce is undefined', () => {
    //   const nonce = sharedActionTracking.generateNonce()

    //   const hit = {
    //     ec: EventCategory.ACTION_TRACKING,
    //     ea: 'click',
    //     el: 'test label',
    //     ev: 42
    //   }

    //   const payload2 = {
    //     action: SharedAction.ABT_TAG_TRACK_ACTION,
    //     nonce: undefined,
    //     data: [hit],
    //     timestamp: Date.now()
    //   }

    //   const messageEvent2 = new MessageEvent('message', {
    //     data: payload2,
    //     origin: window.location.origin
    //   })

    //   window.dispatchEvent(messageEvent2)

    //   expect(visitorMock.addInTrackingManager).toBeCalledTimes(0)

    //   const payload3 = {
    //     action: 'invalid_action' as SharedAction,
    //     nonce,
    //     data: [hit],
    //     timestamp: Date.now()
    //   }

    //   const messageEvent3 = new MessageEvent('message', {
    //     data: payload3,
    //     origin: window.location.origin
    //   })

    //   window.dispatchEvent(messageEvent3)

    //   expect(visitorMock.addInTrackingManager).toBeCalledTimes(0)
    // })

    // it('should not call visitor.addInTrackingManager when a message event is dispatched with invalid nonce', () => {
    //   sdkConfig.logLevel = LogLevel.DEBUG
    //   const hit = {
    //     ec: EventCategory.ACTION_TRACKING,
    //     ea: 'click',
    //     el: 'test label',
    //     ev: 42
    //   }

    //   const payload = {
    //     action: SharedAction.ABT_TAG_TRACK_ACTION,
    //     nonce: 'invalid_nonce',
    //     data: [hit],
    //     timestamp: Date.now()
    //   }

    //   const messageEvent = new MessageEvent('message', {
    //     data: payload,
    //     origin: window.location.origin
    //   })

    //   window.dispatchEvent(messageEvent)

    //   expect(visitorMock.addInTrackingManager).toBeCalledTimes(0)
    //   expect(logDebugSpy).toBeCalledTimes(1)

    //   // const nonce = sharedActionTracking.generateNonce()

    //   // const payload2 = {
    //   //   action: SharedAction.ABT_TAG_TRACK_ACTION,
    //   //   nonce,
    //   //   data: [hit],
    //   //   timestamp: Date.now()
    //   // }

    //   // const messageEvent2 = new MessageEvent('message', {
    //   //   data: payload2,
    //   //   origin: window.location.origin
    //   // })

    //   // window.dispatchEvent(messageEvent2)

    //   // expect(visitorMock.addInTrackingManager).toBeCalledTimes(1)
    //   // expect(logDebugSpy).toBeCalledTimes(2)

    //   // window.dispatchEvent(messageEvent2)

    //   // expect(visitorMock.addInTrackingManager).toBeCalledTimes(1)
    //   // expect(logDebugSpy).toBeCalledTimes(3)
    // })

    // it('should not call visitor.addInTrackingManager when a message event is dispatched without hit data', () => {
    //   const nonce = sharedActionTracking.generateNonce()

    //   const payload = {
    //     action: SharedAction.ABT_TAG_TRACK_ACTION,
    //     nonce,
    //     data: undefined,
    //     timestamp: Date.now()
    //   }

    //   const messageEvent = new MessageEvent('message', {
    //     data: payload,
    //     origin: window.location.origin
    //   })

    //   window.dispatchEvent(messageEvent)

    //   expect(visitorMock.addInTrackingManager).toBeCalledTimes(0)
    // })
  })
})
