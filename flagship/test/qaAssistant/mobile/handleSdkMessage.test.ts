import { jest, expect, it, describe, beforeEach } from '@jest/globals';
import { sendVisitorAllocatedVariations, sendVisitorExposedVariations, sendFsHitToQA } from '../../../src/qaAssistant/mobile/handleSdkMessage';
import { ABTastyQAEventBus } from '../../../src/qaAssistant/mobile/QAEventBus';
import { QAEventSdkName, VisitorVariationUpdateParam } from '../../../src/qaAssistant/common/types';
import { VisitorVariationState } from '../../../src/type.local';

describe('handleSdkMessage (Mobile)', () => {
  let emitQAEventToQAASpy: jest.SpiedFunction<typeof ABTastyQAEventBus.emitQAEventToQAA>;

  beforeEach(() => {
    emitQAEventToQAASpy = jest.spyOn(ABTastyQAEventBus, 'emitQAEventToQAA');
    emitQAEventToQAASpy.mockImplementation(() => {
      // Mock implementation
    });
  });

  describe('sendVisitorAllocatedVariations', () => {
    it('should skip emission when visitorVariations is undefined or null', () => {
      sendVisitorAllocatedVariations({});
      expect(emitQAEventToQAASpy).not.toHaveBeenCalled();

      sendVisitorAllocatedVariations({ visitorVariations: null as any });
      expect(emitQAEventToQAASpy).not.toHaveBeenCalled();
    });

    it('should emit SDK_ALLOCATED_VARIATIONS with visitorVariations, visitorData, and sdkInfo', () => {
      const visitorVariationState: VisitorVariationState = {
        visitorVariations: {
          campaign1: {
            campaignId: 'campaign1',
            variationGroupId: 'vg1',
            variationId: 'v1'
          },
          campaign2: {
            campaignId: 'campaign2',
            variationGroupId: 'vg2',
            variationId: 'v2'
          }
        },
        visitorData: {
          visitorId: 'visitor1',
          context: { platform: 'mobile' },
          hasConsented: true
        },
        sdkInfo: {
          name: 'TypeScript' as const,
          version: '3.0.0',
          tag: 'flagship-ts-sdk'
        }
      };

      sendVisitorAllocatedVariations(visitorVariationState);

      expect(emitQAEventToQAASpy).toHaveBeenCalledTimes(1);
      expect(emitQAEventToQAASpy).toHaveBeenCalledWith(
        QAEventSdkName.SDK_ALLOCATED_VARIATIONS,
        {
          value: visitorVariationState.visitorVariations,
          visitorData: visitorVariationState.visitorData,
          sdkInfo: visitorVariationState.sdkInfo
        }
      );
    });
  });

  describe('sendVisitorExposedVariations', () => {
    it('should skip emission when exposedVariations is undefined or null', () => {
      sendVisitorExposedVariations({});
      expect(emitQAEventToQAASpy).not.toHaveBeenCalled();

      sendVisitorExposedVariations({ exposedVariations: null as any });
      expect(emitQAEventToQAASpy).not.toHaveBeenCalled();
    });

    it('should include NewNavigation param when navigationDetected is true and reset flag to false', () => {
      const baseState = {
        exposedVariations: {
          campaign1: {
            campaignId: 'campaign1',
            variationGroupId: 'vg1',
            variationId: 'v1'
          }
        }
      };

      // With navigationDetected true
      const stateWithNav: VisitorVariationState = {
        ...baseState,
        navigationDetected: true
      };
      sendVisitorExposedVariations(stateWithNav);
      expect(emitQAEventToQAASpy).toHaveBeenCalledWith(
        QAEventSdkName.SDK_EXPOSED_VARIATIONS,
        expect.objectContaining({ param: VisitorVariationUpdateParam.NewNavigation })
      );
      expect(stateWithNav.navigationDetected).toBe(false);

      emitQAEventToQAASpy.mockClear();

      // Without navigationDetected
      sendVisitorExposedVariations(baseState);
      expect(emitQAEventToQAASpy).toHaveBeenCalledWith(
        QAEventSdkName.SDK_EXPOSED_VARIATIONS,
        expect.objectContaining({ param: undefined })
      );
    });

    it('should emit SDK_EXPOSED_VARIATIONS with all campaigns in exposedVariations map', () => {
      const visitorVariationState: VisitorVariationState = {
        exposedVariations: {
          campaign1: {
            campaignId: 'campaign1',
            variationGroupId: 'vg1',
            variationId: 'v1'
          },
          campaign2: {
            campaignId: 'campaign2',
            variationGroupId: 'vg2',
            variationId: 'v2'
          },
          campaign3: {
            campaignId: 'campaign3',
            variationGroupId: 'vg3',
            variationId: 'v3'
          }
        }
      };

      sendVisitorExposedVariations(visitorVariationState);

      expect(emitQAEventToQAASpy).toHaveBeenCalledTimes(1);
      expect(emitQAEventToQAASpy).toHaveBeenCalledWith(
        QAEventSdkName.SDK_EXPOSED_VARIATIONS,
        expect.objectContaining({ value: visitorVariationState.exposedVariations })
      );
    });
  });

  describe('sendFsHitToQA', () => {
    const methodNow = Date.now;
    const mockNow = jest.fn<typeof Date.now>();

    beforeEach(() => {
      Date.now = mockNow;
      mockNow.mockReturnValue(10000);
    });

    afterEach(() => {
      Date.now = methodNow;
    });

    it('should calculate timestamps by subtracting qt from Date.now() for each hit', () => {
      // Empty array
      sendFsHitToQA([]);
      expect(emitQAEventToQAASpy).toHaveBeenCalledWith(
        QAEventSdkName.SDK_HIT_SENT,
        { value: [] }
      );

      emitQAEventToQAASpy.mockClear();

      // Single hit with qt
      sendFsHitToQA([{
        type: 'PAGEVIEW',
        url: 'https://example.com',
        qt: 100
      }]);
      expect(emitQAEventToQAASpy).toHaveBeenCalledWith(
        QAEventSdkName.SDK_HIT_SENT,
        {
          value: [{
            type: 'PAGEVIEW',
            url: 'https://example.com',
            qt: 100,
            timestamp: 9900 // Date.now() - qt
          }]
        }
      );
    });

    it('should emit SDK_HIT_SENT with all hits transformed to include timestamp property', () => {
      mockNow.mockReturnValue(20000);
      const hit = [
        {
          type: 'PAGEVIEW',
          url: 'https://example.com/page1',
          customProp: 'value',
          qt: 100
        },
        {
          type: 'EVENT',
          action: 'click',
          qt: 200
        },
        {
          type: 'ACTIVATE',
          vgid: 'vg1',
          vid: 'v1',
          qt: 150
        }
      ];

      sendFsHitToQA(hit);

      expect(emitQAEventToQAASpy).toHaveBeenCalledTimes(1);
      expect(emitQAEventToQAASpy).toHaveBeenCalledWith(
        QAEventSdkName.SDK_HIT_SENT,
        {
          value: [
            {
              type: 'PAGEVIEW',
              url: 'https://example.com/page1',
              customProp: 'value',
              qt: 100,
              timestamp: 19900
            },
            {
              type: 'EVENT',
              action: 'click',
              qt: 200,
              timestamp: 19800
            },
            {
              type: 'ACTIVATE',
              vgid: 'vg1',
              vid: 'v1',
              qt: 150,
              timestamp: 19850
            }
          ]
        }
      );
    });
  });
});
