import { jest, expect, it, describe, beforeEach, afterEach } from '@jest/globals';
import { launchQaAssistant } from '../../../src/qaAssistant/mobile/index';
import { ABTastyQAEventBus } from '../../../src/qaAssistant/mobile/QAEventBus';
import * as QaAssistantMessageAction from '../../../src/qaAssistant/mobile/QaAssistantMessageAction';
import { QAEventQaAssistantName } from '../../../src/qaAssistant/common/types';
import { DecisionApiConfig } from '../../../src/config/DecisionApiConfig';
import { VisitorVariationState } from '../../../src/type.local';
import { FsVariationToForce } from '../../../src/types';

// Helper to create valid FsVariationToForce objects
function createVariation(id: string, campaignId: string): FsVariationToForce {
  return {
    campaignId,
    campaignName: `Campaign ${campaignId}`,
    campaignType: 'ab',
    variationGroupId: `vg${id}`,
    variation: {
      id: `v${id}`,
      reference: false,
      modifications: {
        type: 'JSON',
        value: {}
      }
    }
  };
}

describe('launchQaAssistant (Mobile/React Native)', () => {
  let onQaAssistantReadySpy: jest.SpiedFunction<typeof QaAssistantMessageAction.onQaAssistantReady>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let config: DecisionApiConfig;
  let visitorVariationState: VisitorVariationState;

  beforeEach(() => {
    config = new DecisionApiConfig({
      envId: 'envId',
      apiKey: 'apiKey'
    });
    visitorVariationState = {
      forcedVariations: {},
      variationsForcedAllocation: {},
      variationsForcedUnallocation: {}
    };

    onQaAssistantReadySpy = jest.spyOn(QaAssistantMessageAction, 'onQaAssistantReady');
    onQaAssistantReadySpy.mockImplementation(() => {
      // Mock implementation
    });

    consoleLogSpy = jest.spyOn(console, 'log');
    consoleLogSpy.mockImplementation(() => {
      // Mock implementation
    });

    // Clean up global listeners
    delete (globalThis as any).__abTastyOnQaAssistantReadyListener;
    delete (globalThis as any).__abTastyOnQAApplyForcedVariationListener;
    delete (globalThis as any).__abTastyOnQaApplyForcedAllocationListener;
    delete (globalThis as any).__abTastyOnQaApplyForcedUnAllocationListener;
    delete (globalThis as any).__abTastyOnTriggerRender__;
  });

  afterEach(() => {
    // Clean up all event listeners
    ABTastyQAEventBus.removeAllListenersForEvent(QAEventQaAssistantName.QA_READY);
    ABTastyQAEventBus.removeAllListenersForEvent(QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS);
    ABTastyQAEventBus.removeAllListenersForEvent(QAEventQaAssistantName.QA_APPLY_FORCED_ALLOCATION);
    ABTastyQAEventBus.removeAllListenersForEvent(QAEventQaAssistantName.QA_APPLY_FORCED_UNALLOCATION);
  });

  describe('Setup', () => {
    it('should invoke existing cleanup functions before registering new event listeners', () => {
      const mockCleanup1 = jest.fn();
      const mockCleanup2 = jest.fn();

      (globalThis as any).__abTastyOnQaAssistantReadyListener = mockCleanup1;
      (globalThis as any).__abTastyOnQAApplyForcedVariationListener = mockCleanup2;

      launchQaAssistant(config, visitorVariationState);

      expect(mockCleanup1).toHaveBeenCalledTimes(1);
      expect(mockCleanup2).toHaveBeenCalledTimes(1);
    });

    it('should register QA_READY event listener and store cleanup in global', () => {
      launchQaAssistant(config, visitorVariationState);

      expect(ABTastyQAEventBus.listenerCount(QAEventQaAssistantName.QA_READY)).toBeGreaterThan(0);
      expect((globalThis as any).__abTastyOnQaAssistantReadyListener).toBeDefined();
    });

    it('should register QA_APPLY_FORCED_VARIATIONS listener and store cleanup globally', () => {
      launchQaAssistant(config, visitorVariationState);

      expect(ABTastyQAEventBus.listenerCount(QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS)).toBeGreaterThan(0);
      expect((globalThis as any).__abTastyOnQAApplyForcedVariationListener).toBeDefined();
    });

    it('should register QA_APPLY_FORCED_ALLOCATION listener and store cleanup globally', () => {
      launchQaAssistant(config, visitorVariationState);

      expect(ABTastyQAEventBus.listenerCount(QAEventQaAssistantName.QA_APPLY_FORCED_ALLOCATION)).toBeGreaterThan(0);
      expect((globalThis as any).__abTastyOnQaApplyForcedAllocationListener).toBeDefined();
    });

    it('should register QA_APPLY_FORCED_UNALLOCATION listener and store cleanup globally', () => {
      launchQaAssistant(config, visitorVariationState);

      expect(ABTastyQAEventBus.listenerCount(QAEventQaAssistantName.QA_APPLY_FORCED_UNALLOCATION)).toBeGreaterThan(0);
      expect((globalThis as any).__abTastyOnQaApplyForcedUnAllocationListener).toBeDefined();
    });

    it('should expose all cleanup functions via __abTastyOn*Listener global properties', () => {
      launchQaAssistant(config, visitorVariationState);

      expect((globalThis as any).__abTastyOnQaAssistantReadyListener).toBeInstanceOf(Function);
      expect((globalThis as any).__abTastyOnQAApplyForcedVariationListener).toBeInstanceOf(Function);
      expect((globalThis as any).__abTastyOnQaApplyForcedAllocationListener).toBeInstanceOf(Function);
      expect((globalThis as any).__abTastyOnQaApplyForcedUnAllocationListener).toBeInstanceOf(Function);
    });
  });

  describe('QA_READY Handler', () => {
    it('should invoke onQaAssistantReady() when QA Assistant fires QA_READY event', () => {
      launchQaAssistant(config, visitorVariationState);

      ABTastyQAEventBus.emitQAEventToSDK(QAEventQaAssistantName.QA_READY, undefined);

      expect(onQaAssistantReadySpy).toHaveBeenCalledTimes(1);
    });

    it('should pass current visitorVariationState to onQaAssistantReady() handler', () => {
      launchQaAssistant(config, visitorVariationState);

      ABTastyQAEventBus.emitQAEventToSDK(QAEventQaAssistantName.QA_READY, undefined);

      expect(onQaAssistantReadySpy).toHaveBeenCalledWith(visitorVariationState);
    });


  });

  describe('QA_APPLY_FORCED_VARIATIONS Handler', () => {
    it('should merge new forced variations into existing forcedVariations map', () => {
      visitorVariationState.forcedVariations = {
        existing1: {
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
      };

      const mockRender = jest.fn();
      (globalThis as any).__abTastyOnTriggerRender__ = mockRender;

      launchQaAssistant(config, visitorVariationState);

      const newVariations = {
        new1: {
          campaignId: 'camp2',
          campaignName: 'Campaign 2',
          campaignType: 'ab',
          variationGroupId: 'vg2',
          variation: {
            id: 'v2',
            reference: false,
            modifications: {
              type: 'JSON',
              value: {}
            }
          }
        }
      };

      ABTastyQAEventBus.emitQAEventToSDK(
        QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS,
        { value: newVariations }
      );

      expect(visitorVariationState.forcedVariations).toEqual({
        existing1: {
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
        },
        new1: {
          campaignId: 'camp2',
          campaignName: 'Campaign 2',
          campaignType: 'ab',
          variationGroupId: 'vg2',
          variation: {
            id: 'v2',
            reference: false,
            modifications: {
              type: 'JSON',
              value: {}
            }
          }
        }
      });
    });

    it('should call render with forcedReFetchFlags=false after merging forced variations', () => {
      const mockRender = jest.fn();
      (globalThis as any).__abTastyOnTriggerRender__ = mockRender;

      launchQaAssistant(config, visitorVariationState);

      ABTastyQAEventBus.emitQAEventToSDK(
        QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS,
        { value: { key1: createVariation('1', 'camp1') } }
      );

      expect(mockRender).toHaveBeenCalledTimes(1);
      expect(mockRender).toHaveBeenCalledWith({ forcedReFetchFlags: false });
    });

    it('should retain existing forcedVariations keys not present in new variations', () => {
      visitorVariationState.forcedVariations = {
        existing1: {
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
        },
        existing2: {
          campaignId: 'camp2',
          campaignName: 'Campaign 2',
          campaignType: 'ab',
          variationGroupId: 'vg2',
          variation: {
            id: 'v2',
            reference: false,
            modifications: {
              type: 'JSON',
              value: {}
            }
          }
        }
      };

      launchQaAssistant(config, visitorVariationState);

      ABTastyQAEventBus.emitQAEventToSDK(
        QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS,
        {
          value: {
            new1: {
              campaignId: 'camp3',
              campaignName: 'Campaign 3',
              campaignType: 'ab',
              variationGroupId: 'vg3',
              variation: {
                id: 'v3',
                reference: false,
                modifications: {
                  type: 'JSON',
                  value: {}
                }
              }
            }
          }
        }
      );

      expect(visitorVariationState.forcedVariations).toHaveProperty('existing1');
      expect(visitorVariationState.forcedVariations).toHaveProperty('existing2');
      expect(visitorVariationState.forcedVariations).toHaveProperty('new1');
    });

    it('should handle empty existing forced variations', () => {
      visitorVariationState.forcedVariations = {};

      launchQaAssistant(config, visitorVariationState);

      ABTastyQAEventBus.emitQAEventToSDK(
        QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS,
        { value: { key1: createVariation('1', 'camp1') } }
      );

      expect(visitorVariationState.forcedVariations).toEqual({ key1: createVariation('1', 'camp1') });
    });

    it('should handle empty new forced variations', () => {
      visitorVariationState.forcedVariations = { existing1: createVariation('1', 'camp1') };

      launchQaAssistant(config, visitorVariationState);

      ABTastyQAEventBus.emitQAEventToSDK(
        QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS,
        { value: {} }
      );

      expect(visitorVariationState.forcedVariations).toEqual({ existing1: createVariation('1', 'camp1') });
    });
  });

  describe('QA_APPLY_FORCED_ALLOCATION Handler', () => {
    it('should apply forced allocations to visitor state', () => {
      launchQaAssistant(config, visitorVariationState);

      const allocations = { key1: createVariation('1', 'camp1') };

      ABTastyQAEventBus.emitQAEventToSDK(
        QAEventQaAssistantName.QA_APPLY_FORCED_ALLOCATION,
        { value: allocations }
      );

      expect(visitorVariationState.variationsForcedAllocation).toEqual(allocations);
    });

    it('should remove allocations not in new data', () => {
      visitorVariationState.variationsForcedAllocation = {
        key1: createVariation('1', 'camp1'),
        key2: createVariation('2', 'camp2')
      };
      visitorVariationState.forcedVariations = {
        key1: createVariation('1', 'camp1'),
        key2: createVariation('2', 'camp2')
      };

      launchQaAssistant(config, visitorVariationState);

      ABTastyQAEventBus.emitQAEventToSDK(
        QAEventQaAssistantName.QA_APPLY_FORCED_ALLOCATION,
        { value: { key1: createVariation('1', 'camp1') } }
      );

      expect(visitorVariationState.forcedVariations).not.toHaveProperty('key2');
    });

    it('should set shouldForceRender to true', () => {
      launchQaAssistant(config, visitorVariationState);

      ABTastyQAEventBus.emitQAEventToSDK(
        QAEventQaAssistantName.QA_APPLY_FORCED_ALLOCATION,
        { value: {} }
      );

      expect(visitorVariationState.shouldForceRender).toBe(true);
    });

    it('should trigger render with forcedReFetchFlags=true', () => {
      const mockRender = jest.fn();
      (globalThis as any).__abTastyOnTriggerRender__ = mockRender;

      launchQaAssistant(config, visitorVariationState);

      ABTastyQAEventBus.emitQAEventToSDK(
        QAEventQaAssistantName.QA_APPLY_FORCED_ALLOCATION,
        { value: {} }
      );

      expect(mockRender).toHaveBeenCalledWith({ forcedReFetchFlags: true });
    });


    it('should handle empty existing allocations', () => {
      visitorVariationState.variationsForcedAllocation = undefined;
      visitorVariationState.forcedVariations = {};

      launchQaAssistant(config, visitorVariationState);

      ABTastyQAEventBus.emitQAEventToSDK(
        QAEventQaAssistantName.QA_APPLY_FORCED_ALLOCATION,
        { value: { key1: createVariation('1', 'camp1') } }
      );

      expect(visitorVariationState.variationsForcedAllocation).toEqual({ key1: createVariation('1', 'camp1') });
    });

    it('should call removeForcedVariation for removed keys', () => {
      visitorVariationState.variationsForcedAllocation = {
        key1: createVariation('1', 'camp1'),
        key2: createVariation('2', 'camp2'),
        key3: createVariation('3', 'camp3')
      };
      visitorVariationState.forcedVariations = {
        key1: createVariation('1', 'camp1'),
        key2: createVariation('2', 'camp2'),
        key3: createVariation('3', 'camp3')
      };

      launchQaAssistant(config, visitorVariationState);

      ABTastyQAEventBus.emitQAEventToSDK(
        QAEventQaAssistantName.QA_APPLY_FORCED_ALLOCATION,
        { value: { key1: createVariation('1', 'camp1') } }
      );

      expect(visitorVariationState.forcedVariations).toHaveProperty('key1');
      expect(visitorVariationState.forcedVariations).not.toHaveProperty('key2');
      expect(visitorVariationState.forcedVariations).not.toHaveProperty('key3');
    });
  });

  describe('QA_APPLY_FORCED_UNALLOCATION Handler', () => {
    it('should apply forced unallocations to visitor state', () => {
      launchQaAssistant(config, visitorVariationState);

      const unallocations = { key1: createVariation('1', 'camp1') };

      ABTastyQAEventBus.emitQAEventToSDK(
        QAEventQaAssistantName.QA_APPLY_FORCED_UNALLOCATION,
        { value: unallocations }
      );

      expect(visitorVariationState.variationsForcedUnallocation).toEqual(unallocations);
    });

    it('should set shouldForceRender to true', () => {
      launchQaAssistant(config, visitorVariationState);

      ABTastyQAEventBus.emitQAEventToSDK(
        QAEventQaAssistantName.QA_APPLY_FORCED_UNALLOCATION,
        { value: {} }
      );

      expect(visitorVariationState.shouldForceRender).toBe(true);
    });

    it('should trigger render with forcedReFetchFlags=true', () => {
      const mockRender = jest.fn();
      (globalThis as any).__abTastyOnTriggerRender__ = mockRender;

      launchQaAssistant(config, visitorVariationState);

      ABTastyQAEventBus.emitQAEventToSDK(
        QAEventQaAssistantName.QA_APPLY_FORCED_UNALLOCATION,
        { value: {} }
      );

      expect(mockRender).toHaveBeenCalledWith({ forcedReFetchFlags: true });
    });

  });

  describe('Helper Functions', () => {
    it('should trigger __abTastyOnTriggerRender__ when render is called', () => {
      const mockRender = jest.fn();
      (globalThis as any).__abTastyOnTriggerRender__ = mockRender;

      launchQaAssistant(config, visitorVariationState);

      ABTastyQAEventBus.emitQAEventToSDK(
        QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS,
        { value: {} }
      );

      expect(mockRender).toHaveBeenCalled();
    });

    it('should pass forcedReFetchFlags to render callback', () => {
      const mockRender = jest.fn();
      (globalThis as any).__abTastyOnTriggerRender__ = mockRender;

      launchQaAssistant(config, visitorVariationState);

      ABTastyQAEventBus.emitQAEventToSDK(
        QAEventQaAssistantName.QA_APPLY_FORCED_ALLOCATION,
        { value: {} }
      );

      expect(mockRender).toHaveBeenCalledWith({ forcedReFetchFlags: true });
    });

    it('should delete specified keys from forcedVariations when removeForcedVariation() is called', () => {
      visitorVariationState.forcedVariations = {
        key1: createVariation('1', 'camp1'),
        key2: createVariation('2', 'camp2'),
        key3: createVariation('3', 'camp3')
      };
      visitorVariationState.variationsForcedAllocation = {
        key1: createVariation('1', 'camp1'),
        key2: createVariation('2', 'camp2'),
        key3: createVariation('3', 'camp3')
      };

      launchQaAssistant(config, visitorVariationState);

      ABTastyQAEventBus.emitQAEventToSDK(
        QAEventQaAssistantName.QA_APPLY_FORCED_ALLOCATION,
        { value: { key1: createVariation('1', 'camp1') } }
      );

      expect(visitorVariationState.forcedVariations).toEqual({ key1: createVariation('1', 'camp1') });
    });

    it('should keep forcedVariations that are still in the allocation list', () => {
      visitorVariationState.forcedVariations = {
        key1: createVariation('1', 'camp1'),
        key2: createVariation('2', 'camp2')
      };
      visitorVariationState.variationsForcedAllocation = {
        key1: createVariation('1', 'camp1'),
        key2: createVariation('2', 'camp2')
      };

      launchQaAssistant(config, visitorVariationState);

      ABTastyQAEventBus.emitQAEventToSDK(
        QAEventQaAssistantName.QA_APPLY_FORCED_ALLOCATION,
        { value: { key1: createVariation('1', 'camp1') } }
      );

      expect(visitorVariationState.forcedVariations).toHaveProperty('key1');
      expect(visitorVariationState.forcedVariations).not.toHaveProperty('key2');
    });

    it('should call all cleanup functions when cleanupEventListeners is invoked', () => {
      const mockCleanup1 = jest.fn();
      const mockCleanup2 = jest.fn();
      const mockCleanup3 = jest.fn();
      const mockCleanup4 = jest.fn();

      (globalThis as any).__abTastyOnQaAssistantReadyListener = mockCleanup1;
      (globalThis as any).__abTastyOnQAApplyForcedVariationListener = mockCleanup2;
      (globalThis as any).__abTastyOnQaApplyForcedAllocationListener = mockCleanup3;
      (globalThis as any).__abTastyOnQaApplyForcedUnAllocationListener = mockCleanup4;

      launchQaAssistant(config, visitorVariationState);

      expect(mockCleanup1).toHaveBeenCalled();
      expect(mockCleanup2).toHaveBeenCalled();
      expect(mockCleanup3).toHaveBeenCalled();
      expect(mockCleanup4).toHaveBeenCalled();
    });

    it('should handle missing cleanup functions gracefully', () => {
      delete (globalThis as any).__abTastyOnQaAssistantReadyListener;
      delete (globalThis as any).__abTastyOnQAApplyForcedVariationListener;

      expect(() => {
        launchQaAssistant(config, visitorVariationState);
      }).not.toThrow();
    });
  });
});
