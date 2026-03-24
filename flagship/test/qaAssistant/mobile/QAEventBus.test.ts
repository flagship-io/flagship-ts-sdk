import { jest, expect, it, describe, afterEach } from '@jest/globals';
import { ABTastyQAEventBus } from '../../../src/qaAssistant/mobile/QAEventBus';
import { QAEventQaAssistantName, QAEventSdkName } from '../../../src/qaAssistant/common/types';

describe('ABTastyQAEventBus', () => {
  describe('Singleton Pattern', () => {
    it('should always return the same singleton instance from getInstance()', () => {
      const instance1 = (ABTastyQAEventBus as any).constructor.getInstance();
      const instance2 = (ABTastyQAEventBus as any).constructor.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should have a globally accessible singleton instance', () => {
      expect(ABTastyQAEventBus).toBeDefined();
      expect(ABTastyQAEventBus).toBeTruthy();
    });

    it('should configure maxListeners to 100 to support multiple QA event handlers', () => {
      const maxListeners = ABTastyQAEventBus.getMaxListeners();
      expect(maxListeners).toBe(100);
    });
  });

  describe('Event Emission', () => {
    it('should emit events using emitQAEvent() and deliver data to registered listeners', () => {
      const listener = jest.fn();
      const testData = {
        value: {
          key1: {
            campaignId: 'test',
            campaignName: 'Campaign 1',
            campaignType: 'ab',
            variationGroupId: 'vg1',
            variation: {
              id: 'v1',
              reference: false,
              modifications: {
                type: 'JSON',
                value: {}
              }
            }
          }
        }
      };

      ABTastyQAEventBus.onQAEvent(QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS, listener);
      ABTastyQAEventBus.emitQAEvent(QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS, testData);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(testData);

      ABTastyQAEventBus.removeAllListenersForEvent(QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS);
    });

    it('should emit QAA→SDK events using emitQAEventToSDK() for QA Assistant commands', () => {
      const listener = jest.fn();

      ABTastyQAEventBus.onQAEvent(QAEventQaAssistantName.QA_READY, listener);
      ABTastyQAEventBus.emitQAEventToSDK(QAEventQaAssistantName.QA_READY, undefined);

      expect(listener).toHaveBeenCalledTimes(1);

      ABTastyQAEventBus.removeAllListenersForEvent(QAEventQaAssistantName.QA_READY);
    });

    it('should emit SDK→QAA events using emitQAEventToQAA() for SDK data updates', () => {
      const listener = jest.fn();
      const testData = {
        value: {
          key1: {
            campaignId: 'test',
            variationGroupId: 'vg1',
            variationId: 'v1'
          }
        },
        visitorData: {
          visitorId: 'visitor1',
          context: {},
          hasConsented: true
        },
        sdkInfo: {
          name: 'TypeScript' as const,
          version: '1.0.0',
          tag: 'test-sdk'
        }
      };

      ABTastyQAEventBus.onQAEvent(QAEventSdkName.SDK_ALLOCATED_VARIATIONS, listener);
      ABTastyQAEventBus.emitQAEventToQAA(QAEventSdkName.SDK_ALLOCATED_VARIATIONS, testData);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(testData);

      ABTastyQAEventBus.removeAllListenersForEvent(QAEventSdkName.SDK_ALLOCATED_VARIATIONS);
    });

    it('should allow emitting events with undefined data payloads', () => {
      const listener = jest.fn();

      ABTastyQAEventBus.onQAEvent(QAEventQaAssistantName.QA_CLOSE, listener);
      ABTastyQAEventBus.emitQAEvent(QAEventQaAssistantName.QA_CLOSE, undefined);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(undefined);

      ABTastyQAEventBus.removeAllListenersForEvent(QAEventQaAssistantName.QA_CLOSE);
    });
  });

  describe('Event Listeners - onQAEvent', () => {
    afterEach(() => {
      ABTastyQAEventBus.removeAllListenersForEvent(QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS);
    });

    it('should register event listeners via onQAEvent() and increment listener count', () => {
      const listener = jest.fn();

      ABTastyQAEventBus.onQAEvent(QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS, listener);

      expect(ABTastyQAEventBus.listenerCount(QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS)).toBe(1);
    });

    it('should receive correct data when event is emitted', () => {
      const listener = jest.fn();
      const testData = {
        value: {
          key1: {
            campaignId: 'camp1',
            campaignName: 'Campaign 1',
            campaignType: 'ab',
            variationGroupId: 'vg1',
            variation: {
              id: 'v1',
              reference: false,
              modifications: {
                type: 'JSON',
                value: {}
              }
            }
          }
        }
      };

      ABTastyQAEventBus.onQAEvent(QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS, listener);
      ABTastyQAEventBus.emitQAEvent(QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS, testData);

      expect(listener).toHaveBeenCalledWith(testData);
    });

    it('should return cleanup function from onQAEvent() for removing the listener', () => {
      const listener = jest.fn();

      const cleanup = ABTastyQAEventBus.onQAEvent(QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS, listener);

      expect(cleanup).toBeInstanceOf(Function);
    });

    it('should unregister listener and decrement count when cleanup function is invoked', () => {
      const listener = jest.fn();

      const cleanup = ABTastyQAEventBus.onQAEvent(QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS, listener);

      expect(ABTastyQAEventBus.listenerCount(QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS)).toBe(1);

      cleanup();

      expect(ABTastyQAEventBus.listenerCount(QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS)).toBe(0);
    });

    it('should notify all registered listeners when an event is emitted', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const testData = {
        value: {
          key1: {
            campaignId: 'camp1',
            campaignName: 'Campaign 1',
            campaignType: 'ab',
            variationGroupId: 'vg1',
            variation: {
              id: 'v1',
              reference: false,
              modifications: {
                type: 'JSON',
                value: {}
              }
            }
          }
        }
      };

      ABTastyQAEventBus.onQAEvent(QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS, listener1);
      ABTastyQAEventBus.onQAEvent(QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS, listener2);

      ABTastyQAEventBus.emitQAEvent(QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS, testData);

      expect(listener1).toHaveBeenCalledWith(testData);
      expect(listener2).toHaveBeenCalledWith(testData);
    });
  });

  describe('Event Listeners - onQAEventFromSDK', () => {
    afterEach(() => {
      ABTastyQAEventBus.removeAllListenersForEvent(QAEventSdkName.SDK_ALLOCATED_VARIATIONS);
    });

    it('should register SDK event listeners via onQAEventFromSDK() for SDK_* events', () => {
      const listener = jest.fn();

      ABTastyQAEventBus.onQAEventFromSDK(QAEventSdkName.SDK_ALLOCATED_VARIATIONS, listener);

      expect(ABTastyQAEventBus.listenerCount(QAEventSdkName.SDK_ALLOCATED_VARIATIONS)).toBe(1);
    });

    it('should deliver SDK event data to onQAEventFromSDK() listeners', () => {
      const listener = jest.fn();
      const testData = {
        value: {
          key1: {
            campaignId: 'camp1',
            variationGroupId: 'vg1',
            variationId: 'v1'
          }
        },
        visitorData: {
          visitorId: 'visitor1',
          context: {},
          hasConsented: true
        },
        sdkInfo: {
          name: 'TypeScript' as const,
          version: '1.0.0',
          tag: 'test-sdk'
        }
      };

      ABTastyQAEventBus.onQAEventFromSDK(QAEventSdkName.SDK_ALLOCATED_VARIATIONS, listener);
      ABTastyQAEventBus.emitQAEventToQAA(QAEventSdkName.SDK_ALLOCATED_VARIATIONS, testData);

      expect(listener).toHaveBeenCalledWith(testData);
    });

    it('should return cleanup function that removes listener', () => {
      const listener = jest.fn();

      const cleanup = ABTastyQAEventBus.onQAEventFromSDK(QAEventSdkName.SDK_ALLOCATED_VARIATIONS, listener);

      expect(ABTastyQAEventBus.listenerCount(QAEventSdkName.SDK_ALLOCATED_VARIATIONS)).toBe(1);

      cleanup();

      expect(ABTastyQAEventBus.listenerCount(QAEventSdkName.SDK_ALLOCATED_VARIATIONS)).toBe(0);
    });

    it('should only trigger onQAEventFromSDK() listeners for SDK_* events, not QA_* events', () => {
      const listener = jest.fn();

      ABTastyQAEventBus.onQAEventFromSDK(QAEventSdkName.SDK_ALLOCATED_VARIATIONS, listener);
      ABTastyQAEventBus.emitQAEventToSDK(QAEventQaAssistantName.QA_READY, undefined);

      expect(listener).not.toHaveBeenCalled();

      ABTastyQAEventBus.removeAllListenersForEvent(QAEventSdkName.SDK_ALLOCATED_VARIATIONS);
      ABTastyQAEventBus.removeAllListenersForEvent(QAEventQaAssistantName.QA_READY);
    });
  });

  describe('Event Listeners - onQAEventFromQAA', () => {
    afterEach(() => {
      ABTastyQAEventBus.removeAllListenersForEvent(QAEventQaAssistantName.QA_READY);
      ABTastyQAEventBus.removeAllListenersForEvent(QAEventQaAssistantName.QA_CLOSE);
      ABTastyQAEventBus.removeAllListenersForEvent(QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS);
      ABTastyQAEventBus.removeAllListenersForEvent(QAEventQaAssistantName.QA_APPLY_FORCED_ALLOCATION);
      ABTastyQAEventBus.removeAllListenersForEvent(QAEventQaAssistantName.QA_APPLY_FORCED_UNALLOCATION);
    });

    it('should register QA Assistant listeners via onQAEventFromQAA() for QA_* events', () => {
      const listener = jest.fn();

      ABTastyQAEventBus.onQAEventFromQAA(QAEventQaAssistantName.QA_READY, listener);

      expect(ABTastyQAEventBus.listenerCount(QAEventQaAssistantName.QA_READY)).toBe(1);
    });

    it('should deliver QA Assistant event data to onQAEventFromQAA() listeners', () => {
      const listener = jest.fn();
      const testData = {
        value: {
          key1: {
            campaignId: 'camp1',
            campaignName: 'Campaign 1',
            campaignType: 'ab',
            variationGroupId: 'vg1',
            variation: {
              id: 'v1',
              reference: false,
              modifications: {
                type: 'JSON',
                value: {}
              }
            }
          }
        }
      };

      ABTastyQAEventBus.onQAEventFromQAA(QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS, listener);
      ABTastyQAEventBus.emitQAEventToSDK(QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS, testData);

      expect(listener).toHaveBeenCalledWith(testData);
    });

    it('should return cleanup function that removes listener', () => {
      const listener = jest.fn();

      const cleanup = ABTastyQAEventBus.onQAEventFromQAA(QAEventQaAssistantName.QA_READY, listener);

      expect(ABTastyQAEventBus.listenerCount(QAEventQaAssistantName.QA_READY)).toBe(1);

      cleanup();

      expect(ABTastyQAEventBus.listenerCount(QAEventQaAssistantName.QA_READY)).toBe(0);
    });

    it('should handle QA_READY event', () => {
      const listener = jest.fn();

      ABTastyQAEventBus.onQAEventFromQAA(QAEventQaAssistantName.QA_READY, listener);
      ABTastyQAEventBus.emitQAEventToSDK(QAEventQaAssistantName.QA_READY, undefined);

      expect(listener).toHaveBeenCalledWith(undefined);
    });

    it('should handle QA_CLOSE event', () => {
      const listener = jest.fn();

      ABTastyQAEventBus.onQAEventFromQAA(QAEventQaAssistantName.QA_CLOSE, listener);
      ABTastyQAEventBus.emitQAEventToSDK(QAEventQaAssistantName.QA_CLOSE, undefined);

      expect(listener).toHaveBeenCalledWith(undefined);
    });

    it('should handle QA_APPLY_FORCED_VARIATIONS event', () => {
      const listener = jest.fn();
      const testData = {
        value: {
          key1: {
            campaignId: 'camp1',
            campaignName: 'Campaign 1',
            campaignType: 'ab',
            variationGroupId: 'vg1',
            variation: {
              id: 'v1',
              reference: false,
              modifications: {
                type: 'JSON',
                value: {}
              }
            }
          }
        }
      };

      ABTastyQAEventBus.onQAEventFromQAA(QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS, listener);
      ABTastyQAEventBus.emitQAEventToSDK(QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS, testData);

      expect(listener).toHaveBeenCalledWith(testData);
    });

    it('should handle QA_APPLY_FORCED_ALLOCATION event', () => {
      const listener = jest.fn();
      const testData = {
        value: {
          key1: {
            campaignId: 'camp1',
            campaignName: 'Campaign 1',
            campaignType: 'ab',
            variationGroupId: 'vg1',
            variation: {
              id: 'v1',
              reference: false,
              modifications: {
                type: 'JSON',
                value: {}
              }
            }
          }
        }
      };

      ABTastyQAEventBus.onQAEventFromQAA(QAEventQaAssistantName.QA_APPLY_FORCED_ALLOCATION, listener);
      ABTastyQAEventBus.emitQAEventToSDK(QAEventQaAssistantName.QA_APPLY_FORCED_ALLOCATION, testData);

      expect(listener).toHaveBeenCalledWith(testData);
    });

    it('should handle QA_APPLY_FORCED_UNALLOCATION event', () => {
      const listener = jest.fn();
      const testData = {
        value: {
          key1: {
            campaignId: 'camp1',
            campaignName: 'Campaign 1',
            campaignType: 'ab',
            variationGroupId: 'vg1',
            variation: {
              id: 'v1',
              reference: false,
              modifications: {
                type: 'JSON',
                value: {}
              }
            }
          }
        }
      };

      ABTastyQAEventBus.onQAEventFromQAA(QAEventQaAssistantName.QA_APPLY_FORCED_UNALLOCATION, listener);
      ABTastyQAEventBus.emitQAEventToSDK(QAEventQaAssistantName.QA_APPLY_FORCED_UNALLOCATION, testData);

      expect(listener).toHaveBeenCalledWith(testData);
    });
  });

  describe('Event Removal', () => {
    it('should remove specific listener using offQAEvent', () => {
      const listener = jest.fn();

      ABTastyQAEventBus.onQAEvent(QAEventQaAssistantName.QA_READY, listener);
      expect(ABTastyQAEventBus.listenerCount(QAEventQaAssistantName.QA_READY)).toBe(1);

      ABTastyQAEventBus.offQAEvent(QAEventQaAssistantName.QA_READY, listener);
      expect(ABTastyQAEventBus.listenerCount(QAEventQaAssistantName.QA_READY)).toBe(0);
    });

    it('should not call removed listener when event is emitted', () => {
      const listener = jest.fn();

      ABTastyQAEventBus.onQAEvent(QAEventQaAssistantName.QA_READY, listener);
      ABTastyQAEventBus.offQAEvent(QAEventQaAssistantName.QA_READY, listener);

      ABTastyQAEventBus.emitQAEvent(QAEventQaAssistantName.QA_READY, undefined);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should remove all listeners for an event using removeAllListenersForEvent', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      ABTastyQAEventBus.onQAEvent(QAEventQaAssistantName.QA_READY, listener1);
      ABTastyQAEventBus.onQAEvent(QAEventQaAssistantName.QA_READY, listener2);

      expect(ABTastyQAEventBus.listenerCount(QAEventQaAssistantName.QA_READY)).toBe(2);

      ABTastyQAEventBus.removeAllListenersForEvent(QAEventQaAssistantName.QA_READY);

      expect(ABTastyQAEventBus.listenerCount(QAEventQaAssistantName.QA_READY)).toBe(0);
    });

    it('should keep listeners for other events when removing all for one event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      ABTastyQAEventBus.onQAEvent(QAEventQaAssistantName.QA_READY, listener1);
      ABTastyQAEventBus.onQAEvent(QAEventQaAssistantName.QA_CLOSE, listener2);

      ABTastyQAEventBus.removeAllListenersForEvent(QAEventQaAssistantName.QA_READY);

      expect(ABTastyQAEventBus.listenerCount(QAEventQaAssistantName.QA_READY)).toBe(0);
      expect(ABTastyQAEventBus.listenerCount(QAEventQaAssistantName.QA_CLOSE)).toBe(1);

      ABTastyQAEventBus.removeAllListenersForEvent(QAEventQaAssistantName.QA_CLOSE);
    });
  });

  describe('QA Active Detection', () => {
    afterEach(() => {
      ABTastyQAEventBus.removeAllListenersForEvent(QAEventSdkName.SDK_ALLOCATED_VARIATIONS);
    });

    it('should return false when no listeners registered', () => {
      ABTastyQAEventBus.removeAllListenersForEvent(QAEventSdkName.SDK_ALLOCATED_VARIATIONS);

      expect(ABTastyQAEventBus.isQAActive()).toBe(false);
    });

    it('should return true when SDK_ALLOCATED_VARIATIONS listener is registered', () => {
      const listener = jest.fn();

      ABTastyQAEventBus.onQAEvent(QAEventSdkName.SDK_ALLOCATED_VARIATIONS, listener);

      expect(ABTastyQAEventBus.isQAActive()).toBe(true);
    });

    it('should return false after all SDK_ALLOCATED_VARIATIONS listeners removed', () => {
      const listener = jest.fn();

      ABTastyQAEventBus.onQAEvent(QAEventSdkName.SDK_ALLOCATED_VARIATIONS, listener);
      expect(ABTastyQAEventBus.isQAActive()).toBe(true);

      ABTastyQAEventBus.removeAllListenersForEvent(QAEventSdkName.SDK_ALLOCATED_VARIATIONS);

      expect(ABTastyQAEventBus.isQAActive()).toBe(false);
    });
  });

  describe('Multiple Event Types', () => {
    afterEach(() => {
      ABTastyQAEventBus.removeAllListenersForEvent(QAEventSdkName.SDK_ALLOCATED_VARIATIONS);
      ABTastyQAEventBus.removeAllListenersForEvent(QAEventSdkName.SDK_EXPOSED_VARIATIONS);
      ABTastyQAEventBus.removeAllListenersForEvent(QAEventSdkName.SDK_HIT_SENT);
    });

    it('should handle SDK_ALLOCATED_VARIATIONS events', () => {
      const listener = jest.fn();
      const testData = {
        value: {
          key1: {
            campaignId: 'camp1',
            variationGroupId: 'vg1',
            variationId: 'v1'
          }
        },
        visitorData: {
          visitorId: 'visitor1',
          context: {},
          hasConsented: true
        },
        sdkInfo: {
          name: 'TypeScript' as const,
          version: '1.0.0',
          tag: 'test-sdk'
        }
      };

      ABTastyQAEventBus.onQAEvent(QAEventSdkName.SDK_ALLOCATED_VARIATIONS, listener);
      ABTastyQAEventBus.emitQAEventToQAA(QAEventSdkName.SDK_ALLOCATED_VARIATIONS, testData);

      expect(listener).toHaveBeenCalledWith(testData);
    });

    it('should handle SDK_EXPOSED_VARIATIONS events', () => {
      const listener = jest.fn();
      const testData = {
        value: {
          key1: {
            campaignId: 'camp1',
            variationGroupId: 'vg1',
            variationId: 'v1'
          }
        }
      };

      ABTastyQAEventBus.onQAEvent(QAEventSdkName.SDK_EXPOSED_VARIATIONS, listener);
      ABTastyQAEventBus.emitQAEventToQAA(QAEventSdkName.SDK_EXPOSED_VARIATIONS, testData);

      expect(listener).toHaveBeenCalledWith(testData);
    });

    it('should handle SDK_HIT_SENT events', () => {
      const listener = jest.fn();
      const testData = {
        value: [{
          type: 'PAGEVIEW',
          url: 'https://example.com'
        }]
      };

      ABTastyQAEventBus.onQAEvent(QAEventSdkName.SDK_HIT_SENT, listener);
      ABTastyQAEventBus.emitQAEventToQAA(QAEventSdkName.SDK_HIT_SENT, testData);

      expect(listener).toHaveBeenCalledWith(testData);
    });

    it('should handle all QA Assistant event types', () => {
      const events = [
        QAEventQaAssistantName.QA_READY,
        QAEventQaAssistantName.QA_CLOSE,
        QAEventQaAssistantName.QA_RESET_FORCED_VARIATIONS,
        QAEventQaAssistantName.QA_MINIMIZE_QA_ASSISTANT,
        QAEventQaAssistantName.QA_TRIGGER_RENDER
      ];

      events.forEach(eventName => {
        const listener = jest.fn();
        ABTastyQAEventBus.onQAEventFromQAA(eventName, listener);
        ABTastyQAEventBus.emitQAEventToSDK(eventName, undefined);

        expect(listener).toHaveBeenCalledWith(undefined);

        ABTastyQAEventBus.removeAllListenersForEvent(eventName);
      });
    });
  });
});
