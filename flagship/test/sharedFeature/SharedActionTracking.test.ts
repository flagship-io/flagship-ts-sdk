/**
 * @jest-environment jsdom
 */
import { SharedActionTracking } from '../../src/sharedFeature/SharedActionTracking';
import * as utils from '../../src/utils/utils';
import { DecisionApiConfig, EventCategory, LogLevel } from '../../src';
import { VisitorAbstract } from '../../src/visitor/VisitorAbstract';
import { LocalActionTracking, SharedActionPayload, SharedActionSource } from '../../src/type.local';
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager';
import { jest, describe, it, expect } from '@jest/globals';
import { sleep } from '../helpers';

describe('SharedActionTracking Tests', () => {
  const isBrowserSpy = jest.spyOn(utils, 'isBrowser');

  const addEventListenerOriginal = window.addEventListener;
  const removeEventListenerOriginal = window.removeEventListener;

  const mockLogDebug = jest.fn();

  const sdkConfig = new DecisionApiConfig({
    apiKey: 'apiKey',
    envId: 'envId',
    logLevel: LogLevel.DEBUG,
    logManager: { debug: mockLogDebug } as unknown as FlagshipLogManager
  });

  const sharedActionTracking = new SharedActionTracking({ sdkConfig });

  describe('SharedActionTracking', () => {
    let addEventListenerSpy: jest.SpiedFunction<typeof window.addEventListener>;
    let removeEventListenerSpy: jest.SpiedFunction<typeof window.removeEventListener>;

    const visitorMock = {
      visitorId: 'visitor_123',
      anonymousId: 'anon_456',
      hasConsented: true,
      addInTrackingManager: jest.fn()
    } as unknown as VisitorAbstract;
    beforeAll(() => {
      addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    });

    afterAll(() => {
      window.addEventListener = addEventListenerOriginal;
      window.removeEventListener = removeEventListenerOriginal;
    });

    test('generateNonce returns empty string when not in browser', () => {
      const sharedActionTracking = new SharedActionTracking({ sdkConfig });
      isBrowserSpy.mockReturnValue(false);
      const nonce = sharedActionTracking.generateNonce();
      expect(nonce).toBeUndefined();
    });

    test('generateNonce returns a nonce and registers it when in browser', () => {
      isBrowserSpy.mockReturnValue(true);
      sharedActionTracking.initialize(visitorMock);
      const nonce = sharedActionTracking.generateNonce();
      expect(nonce).toEqual(expect.any(String));
    });

    it('initialize sets visitor when not in browser', () => {
      isBrowserSpy.mockReturnValue(false);
      sharedActionTracking.initialize(visitorMock);
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(0);
      expect(addEventListenerSpy).toHaveBeenCalledTimes(0);
    });

    test('initialize sets visitor and initTimestamp and manages message listeners', () => {
      isBrowserSpy.mockReturnValue(true);
      sharedActionTracking.initialize(visitorMock);
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
      expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
      expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
      const nonce = sharedActionTracking.generateNonce();
      expect(nonce).toEqual(expect.any(String));
    });
  });

  describe('processHit', () => {
    const visitorMock = {
      visitorId: 'visitor_123',
      anonymousId: 'anon_456',
      hasConsented: true,
      addInTrackingManager: jest.fn()
    } as unknown as VisitorAbstract;

    beforeAll(() => {
      window.addEventListener = addEventListenerOriginal;
      window.removeEventListener = removeEventListenerOriginal;
      sharedActionTracking.initialize(visitorMock);
    });

    test('should call visitor.addInTrackingManager when a valid message event is dispatched', async () => {
      const nonce = sharedActionTracking.generateNonce();

      const hit = {
        ec: EventCategory.ACTION_TRACKING,
        ea: 'click',
        el: 'test label',
        ev: 42
      };

      const hit2 = {
        ec: EventCategory.ACTION_TRACKING,
        ea: 'click2',
        el: 'test label 2',
        ev: 45
      };

      const payload = {
        action: SharedActionSource.ABT_TAG_TRACK_ACTION,
        nonce,
        data: [hit, hit2],
        timestamp: Date.now()
      };

      const messageEvent = new MessageEvent('message', {
        data: payload,
        origin: window.location.origin
      });

      window.dispatchEvent(messageEvent);

      await sleep(10);

      expect(visitorMock.addInTrackingManager).toBeCalledTimes(2);
      expect(visitorMock.addInTrackingManager).toHaveBeenNthCalledWith(1, expect.objectContaining({
        category: hit.ec,
        action: hit.ea,
        label: hit.el,
        value: hit.ev,
        visitorId: visitorMock.visitorId,
        anonymousId: visitorMock.anonymousId
      }));
      expect(visitorMock.addInTrackingManager).toHaveBeenNthCalledWith(2, expect.objectContaining({
        category: hit2.ec,
        action: hit2.ea,
        label: hit2.el,
        value: hit2.ev,
        visitorId: visitorMock.visitorId,
        anonymousId: visitorMock.anonymousId
      }));
    });

    it('should not call visitor.addInTrackingManager when a message event is dispatched with different origin or data is undefined', () => {
      const nonce = sharedActionTracking.generateNonce();

      const hit = {
        ec: EventCategory.ACTION_TRACKING,
        ea: 'click',
        el: 'test label',
        ev: 42
      };

      const payload = {
        action: SharedActionSource.ABT_TAG_TRACK_ACTION,
        nonce,
        data: [hit],
        timestamp: Date.now()
      };

      const messageEvent = new MessageEvent('message', {
        data: payload,
        origin: 'https://example.com'
      });

      window.dispatchEvent(messageEvent);

      expect(visitorMock.addInTrackingManager).toBeCalledTimes(0);

      const messageEvent2 = new MessageEvent('message', { origin: 'https://example.com' });

      window.dispatchEvent(messageEvent2);

      expect(visitorMock.addInTrackingManager).toBeCalledTimes(0);
    });

    it('should not call visitor.addInTrackingManager when a message event is dispatched with different action or nonce is undefined', () => {
      const nonce = sharedActionTracking.generateNonce();

      const hit = {
        ec: EventCategory.ACTION_TRACKING,
        ea: 'click',
        el: 'test label',
        ev: 42
      };

      const payload2 = {
        action: SharedActionSource.ABT_TAG_TRACK_ACTION,
        nonce: undefined,
        data: [hit],
        timestamp: Date.now()
      };

      const messageEvent2 = new MessageEvent('message', {
        data: payload2,
        origin: window.location.origin
      });

      window.dispatchEvent(messageEvent2);

      expect(visitorMock.addInTrackingManager).toBeCalledTimes(0);

      const payload3 = {
        action: 'invalid_action' as SharedActionSource,
        nonce,
        data: [hit],
        timestamp: Date.now()
      };

      const messageEvent3 = new MessageEvent('message', {
        data: payload3,
        origin: window.location.origin
      });

      window.dispatchEvent(messageEvent3);

      expect(visitorMock.addInTrackingManager).toBeCalledTimes(0);
    });

    it('should not call visitor.addInTrackingManager when a message event is dispatched with invalid nonce', async () => {
      const hit = {
        ec: EventCategory.ACTION_TRACKING,
        ea: 'click',
        el: 'test label',
        ev: 42
      };

      const payload = {
        action: SharedActionSource.ABT_TAG_TRACK_ACTION,
        nonce: 'invalid_nonce',
        data: [hit],
        timestamp: Date.now()
      };

      const messageEvent = new MessageEvent('message', {
        data: payload,
        origin: window.location.origin
      });

      window.dispatchEvent(messageEvent);

      expect(visitorMock.addInTrackingManager).toBeCalledTimes(0);
      expect(mockLogDebug).toBeCalledTimes(1);

      const nonce = sharedActionTracking.generateNonce();

      const payload2 = {
        action: SharedActionSource.ABT_TAG_TRACK_ACTION,
        nonce,
        data: [hit],
        timestamp: Date.now()
      };

      const messageEvent2 = new MessageEvent('message', {
        data: payload2,
        origin: window.location.origin
      });

      window.dispatchEvent(messageEvent2);

      await sleep(10);

      expect(visitorMock.addInTrackingManager).toBeCalledTimes(1);
      expect(mockLogDebug).toBeCalledTimes(2);

      window.dispatchEvent(messageEvent2);

      expect(visitorMock.addInTrackingManager).toBeCalledTimes(1);
      expect(mockLogDebug).toBeCalledTimes(3);
    });

    it('should not call visitor.addInTrackingManager when a message event is dispatched without hit data', () => {
      const nonce = sharedActionTracking.generateNonce();

      const payload = {
        action: SharedActionSource.ABT_TAG_TRACK_ACTION,
        nonce,
        data: undefined,
        timestamp: Date.now()
      };

      const messageEvent = new MessageEvent('message', {
        data: payload,
        origin: window.location.origin
      });

      window.dispatchEvent(messageEvent);

      expect(visitorMock.addInTrackingManager).toBeCalledTimes(0);

      const payload2 = {
        action: SharedActionSource.ABT_TAG_TRACK_ACTION,
        nonce,
        data: [],
        timestamp: Date.now()
      };

      const messageEvent2 = new MessageEvent('message', {
        data: payload2,
        origin: window.location.origin
      });

      window.dispatchEvent(messageEvent2);
    });

    it('should not call visitor.addInTrackingManager when a message event is dispatched with invalid event category', () => {
      const nonce = sharedActionTracking.generateNonce();

      const hit = {
        ec: 'invalid_ec' as EventCategory,
        ea: 'click',
        el: 'test label',
        ev: 42
      };

      const payload = {
        action: SharedActionSource.ABT_TAG_TRACK_ACTION,
        nonce,
        data: [hit],
        timestamp: Date.now()
      };

      const messageEvent = new MessageEvent('message', {
        data: payload,
        origin: window.location.origin
      });

      window.dispatchEvent(messageEvent);

      expect(visitorMock.addInTrackingManager).toBeCalledTimes(0);
      expect(mockLogDebug).toBeCalledTimes(1);

      const hit2 = {
        ec: EventCategory.ACTION_TRACKING,
        el: 'test label',
        ev: 42
      };

      const payload2 = {
        action: SharedActionSource.ABT_TAG_TRACK_ACTION,
        nonce,
        data: [hit2],
        timestamp: Date.now()
      };

      const messageEvent2 = new MessageEvent('message', {
        data: payload2,
        origin: window.location.origin
      });

      window.dispatchEvent(messageEvent2);

      expect(visitorMock.addInTrackingManager).toBeCalledTimes(0);
      expect(mockLogDebug).toBeCalledTimes(2);
    });

    it('should not call visitor.addInTrackingManager when visitor has not consented', () => {
      const visitorMock2 = {
        visitorId: 'visitor_123',
        anonymous: 'anon_456',
        hasConsented: false,
        addInTrackingManager: jest.fn()
      } as unknown as VisitorAbstract;

      sharedActionTracking.initialize(visitorMock2);

      const nonce = sharedActionTracking.generateNonce();

      const hit = {
        ec: EventCategory.ACTION_TRACKING,
        ea: 'click',
        el: 'test label',
        ev: 42
      };

      const payload = {
        action: SharedActionSource.ABT_TAG_TRACK_ACTION,
        nonce,
        data: [hit],
        timestamp: Date.now()
      };

      const messageEvent = new MessageEvent('message', {
        data: payload,
        origin: window.location.origin
      });

      window.dispatchEvent(messageEvent);

      expect(visitorMock2.addInTrackingManager).toBeCalledTimes(0);
    });
  });

  describe('test dispatchEventHits', () => {
    const visitorMock = {
      visitorId: 'visitor_123',
      anonymousId: 'anon_456',
      hasConsented: true,
      addInTrackingManager: jest.fn()
    } as unknown as VisitorAbstract;

    const postMessage = jest.fn();

    const sharedActionTracking = new SharedActionTracking({ sdkConfig });

    const getActionTrackingNonce = jest.fn(() => '12345');

    beforeAll(() => {
      window.postMessage = postMessage;
      sharedActionTracking.initialize(visitorMock);
      window.ABTasty = {
        api: {
          internal: {
            _getActionTrackingNonce: getActionTrackingNonce,
            _isByoidConfigured: jest.fn(() => false)
          },
          v1: { getValue: jest.fn(() => visitorMock.visitorId) }
        }
      };
    });

    it('should not send postMessage when no hits are provided or is not in browser', () => {
      isBrowserSpy.mockReturnValue(true);

      sharedActionTracking.dispatchEventHits([]);
      expect(postMessage).toBeCalledTimes(0);

      isBrowserSpy.mockReturnValue(false);
      const localActionTracking: LocalActionTracking = {
        data: {
          ec: EventCategory.ACTION_TRACKING,
          ea: 'click',
          el: 'test label',
          ev: 42
        },
        visitorId: visitorMock.visitorId,
        createdAt: Date.now(),
        anonymousId: visitorMock.anonymousId
      };

      sharedActionTracking.dispatchEventHits([localActionTracking]);
      expect(postMessage).toBeCalledTimes(0);
    });

    it('should not send postMessage when hits are not valid', () => {
      isBrowserSpy.mockReturnValue(true);

      const localActionTracking1: LocalActionTracking = {
        data: {
          ec: 'invalid_ec' as EventCategory.ACTION_TRACKING,
          ea: 'click',
          el: 'test label',
          ev: 42
        },
        visitorId: visitorMock.visitorId,
        createdAt: Date.now(),
        anonymousId: visitorMock.anonymousId
      };
      const localActionTracking2: LocalActionTracking = {
        data: {
          ec: EventCategory.ACTION_TRACKING,
          ea: 'click',
          el: 'test label',
          ev: 42
        },
        visitorId: visitorMock.visitorId,
        createdAt: new Date('2021-01-01').getTime(),
        anonymousId: visitorMock.anonymousId
      };

      const localActionTracking3: LocalActionTracking = {
        data: {
          ec: EventCategory.ACTION_TRACKING,
          ea: 'click',
          el: 'test label',
          ev: 42
        },
        visitorId: 'different_visitor_id',
        createdAt: Date.now(),
        anonymousId: visitorMock.anonymousId
      };

      sharedActionTracking.dispatchEventHits([localActionTracking1, localActionTracking2, localActionTracking3]);
      expect(postMessage).toBeCalledTimes(0);

      const localActionTracking4: LocalActionTracking = {
        data: {
          ec: EventCategory.ACTION_TRACKING,
          ea: 'click',
          el: 'test label',
          ev: 42
        },
        visitorId: visitorMock.visitorId,
        createdAt: Date.now(),
        anonymousId: visitorMock.anonymousId
      };

      const localActionTracking5: LocalActionTracking = {
        data: {
          ec: EventCategory.ACTION_TRACKING,
          ea: 'click',
          el: 'test label',
          ev: 42
        },
        visitorId: visitorMock.anonymousId as string,
        createdAt: Date.now(),
        anonymousId: null
      };

      const payload: SharedActionPayload = {
        action: SharedActionSource.ABT_WEB_SDK_TRACK_ACTION,
        data: [localActionTracking4.data, localActionTracking5.data],
        nonce: expect.any(String) as unknown as string,
        timestamp: expect.any(Number) as unknown as number
      };

      sharedActionTracking.dispatchEventHits([localActionTracking1, localActionTracking2, localActionTracking3, localActionTracking4, localActionTracking5]);
      expect(postMessage).toBeCalledTimes(1);
      expect(postMessage).toBeCalledWith(payload, window.location.origin);
    });

    it('should not send postMessage when window.ABTasty.api.v1.getActionTrackingNonce returns undefined', () => {
      isBrowserSpy.mockReturnValue(true);

      getActionTrackingNonce.mockReturnValue(undefined as unknown as string);

      const localActionTracking: LocalActionTracking = {
        data: {
          ec: EventCategory.ACTION_TRACKING,
          ea: 'click',
          el: 'test label',
          ev: 42
        },
        visitorId: visitorMock.visitorId,
        createdAt: Date.now(),
        anonymousId: visitorMock.anonymousId
      };

      sharedActionTracking.dispatchEventHits([localActionTracking]);
      expect(postMessage).toBeCalledTimes(0);
    });
  });
});
