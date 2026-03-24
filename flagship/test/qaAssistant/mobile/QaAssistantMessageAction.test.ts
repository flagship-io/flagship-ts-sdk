import { jest, expect, it, describe, beforeEach } from '@jest/globals';
import { onQaAssistantReady } from '../../../src/qaAssistant/mobile/QaAssistantMessageAction';
import * as handleSdkMessage from '../../../src/qaAssistant/mobile/handleSdkMessage';
import { VisitorVariationState } from '../../../src/type.local';

describe('QaAssistantMessageAction', () => {
  let sendVisitorAllocatedVariationsSpy: jest.SpiedFunction<typeof handleSdkMessage.sendVisitorAllocatedVariations>;
  let sendVisitorExposedVariationsSpy: jest.SpiedFunction<typeof handleSdkMessage.sendVisitorExposedVariations>;

  beforeEach(() => {
    sendVisitorAllocatedVariationsSpy = jest.spyOn(handleSdkMessage, 'sendVisitorAllocatedVariations');
    sendVisitorExposedVariationsSpy = jest.spyOn(handleSdkMessage, 'sendVisitorExposedVariations');

    sendVisitorAllocatedVariationsSpy.mockImplementation(() => {
      // Mock implementation
    });

    sendVisitorExposedVariationsSpy.mockImplementation(() => {
      // Mock implementation
    });
  });

  describe('onQaAssistantReady', () => {
    it('should send allocated and exposed variations based on what exists in state', () => {
      const mockVariation = {
        campaignId: 'campaign1',
        variationGroupId: 'vg1',
        variationId: 'v1'
      };

      // Empty state - no calls
      onQaAssistantReady({});
      expect(sendVisitorAllocatedVariationsSpy).not.toHaveBeenCalled();
      expect(sendVisitorExposedVariationsSpy).not.toHaveBeenCalled();

      // Only allocated variations
      onQaAssistantReady({ visitorVariations: { campaign1: mockVariation } });
      expect(sendVisitorAllocatedVariationsSpy).toHaveBeenCalledTimes(1);
      expect(sendVisitorExposedVariationsSpy).not.toHaveBeenCalled();

      sendVisitorAllocatedVariationsSpy.mockClear();
      sendVisitorExposedVariationsSpy.mockClear();

      // Only exposed variations
      onQaAssistantReady({ exposedVariations: { campaign1: mockVariation } });
      expect(sendVisitorAllocatedVariationsSpy).not.toHaveBeenCalled();
      expect(sendVisitorExposedVariationsSpy).toHaveBeenCalledTimes(1);

      sendVisitorAllocatedVariationsSpy.mockClear();
      sendVisitorExposedVariationsSpy.mockClear();

      // Both variations present
      onQaAssistantReady({
        visitorVariations: { campaign1: mockVariation },
        exposedVariations: {
          campaign2: {
            ...mockVariation,
            campaignId: 'campaign2'
          }
        }
      });
      expect(sendVisitorAllocatedVariationsSpy).toHaveBeenCalledTimes(1);
      expect(sendVisitorExposedVariationsSpy).toHaveBeenCalledTimes(1);
    });

    it('should pass entire visitorVariationState including visitorData and sdkInfo to handlers', () => {
      const visitorVariationState: VisitorVariationState = {
        visitorVariations: {
          campaign1: {
            campaignId: 'campaign1',
            variationGroupId: 'vg1',
            variationId: 'v1'
          }
        },
        exposedVariations: {
          campaign2: {
            campaignId: 'campaign2',
            variationGroupId: 'vg2',
            variationId: 'v2'
          }
        },
        visitorData: {
          visitorId: 'visitor1',
          context: { key: 'value' },
          hasConsented: true
        },
        sdkInfo: {
          name: 'TypeScript' as const,
          version: '3.0.0',
          tag: 'flagship-ts-sdk'
        }
      };

      onQaAssistantReady(visitorVariationState);

      expect(sendVisitorAllocatedVariationsSpy).toHaveBeenCalledWith(visitorVariationState);
      expect(sendVisitorExposedVariationsSpy).toHaveBeenCalledWith(visitorVariationState);
    });
  });
});
