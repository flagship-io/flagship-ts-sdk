import { jest, expect, it, describe, beforeEach } from '@jest/globals';
import * as handleMessage from '../../../src/qaAssistant/common/handleMessage';
import * as webMessages from '../../../src/qaAssistant/web/messages/index';
import * as mobileHandleSdkMessage from '../../../src/qaAssistant/mobile/handleSdkMessage';
import { VisitorVariationState } from '../../../src/type.local';
import { mockGlobals } from '../../helpers';

describe('handleMessage (Platform Router)', () => {
  let webSendVisitorAllocatedVariationsSpy: jest.SpiedFunction<typeof webMessages.sendVisitorAllocatedVariations>;
  let webSendVisitorExposedVariationsSpy: jest.SpiedFunction<typeof webMessages.sendVisitorExposedVariations>;
  let webSendFsHitToQASpy: jest.SpiedFunction<typeof webMessages.sendFsHitToQA>;

  let mobileSendVisitorAllocatedVariationsSpy: jest.SpiedFunction<typeof mobileHandleSdkMessage.sendVisitorAllocatedVariations>;
  let mobileSendVisitorExposedVariationsSpy: jest.SpiedFunction<typeof mobileHandleSdkMessage.sendVisitorExposedVariations>;
  let mobileSendFsHitToQASpy: jest.SpiedFunction<typeof mobileHandleSdkMessage.sendFsHitToQA>;

  beforeEach(() => {
    webSendVisitorAllocatedVariationsSpy = jest.spyOn(webMessages, 'sendVisitorAllocatedVariations');
    webSendVisitorExposedVariationsSpy = jest.spyOn(webMessages, 'sendVisitorExposedVariations');
    webSendFsHitToQASpy = jest.spyOn(webMessages, 'sendFsHitToQA');

    mobileSendVisitorAllocatedVariationsSpy = jest.spyOn(mobileHandleSdkMessage, 'sendVisitorAllocatedVariations');
    mobileSendVisitorExposedVariationsSpy = jest.spyOn(mobileHandleSdkMessage, 'sendVisitorExposedVariations');
    mobileSendFsHitToQASpy = jest.spyOn(mobileHandleSdkMessage, 'sendFsHitToQA');

    webSendVisitorAllocatedVariationsSpy.mockImplementation(() => {});
    webSendVisitorExposedVariationsSpy.mockImplementation(() => {});
    webSendFsHitToQASpy.mockImplementation(() => {});
    mobileSendVisitorAllocatedVariationsSpy.mockImplementation(() => {});
    mobileSendVisitorExposedVariationsSpy.mockImplementation(() => {});
    mobileSendFsHitToQASpy.mockImplementation(() => {});
  });

  describe('sendVisitorAllocatedVariations', () => {
    it('should route to web implementation when __fsWebpackIsBrowser__, mobile when __fsWebpackIsReactNative__, or neither', () => {
      const visitorVariationState: VisitorVariationState = {
        visitorVariations: {
          campaign1: {
            campaignId: 'campaign1',
            variationGroupId: 'vg1',
            variationId: 'v1'
          }
        },
        visitorData: {
          visitorId: 'visitor1',
          context: { key: 'value' },
          hasConsented: true
        }
      };

      // Browser platform
      mockGlobals({
        __fsWebpackIsBrowser__: true,
        __fsWebpackIsReactNative__: false
      });
      handleMessage.sendVisitorAllocatedVariations(visitorVariationState);
      expect(webSendVisitorAllocatedVariationsSpy).toHaveBeenCalledWith(visitorVariationState);
      expect(mobileSendVisitorAllocatedVariationsSpy).not.toHaveBeenCalled();

      webSendVisitorAllocatedVariationsSpy.mockClear();
      mobileSendVisitorAllocatedVariationsSpy.mockClear();

      // React Native platform
      mockGlobals({
        __fsWebpackIsBrowser__: false,
        __fsWebpackIsReactNative__: true
      });
      handleMessage.sendVisitorAllocatedVariations(visitorVariationState);
      expect(mobileSendVisitorAllocatedVariationsSpy).toHaveBeenCalledWith(visitorVariationState);
      expect(webSendVisitorAllocatedVariationsSpy).not.toHaveBeenCalled();

      webSendVisitorAllocatedVariationsSpy.mockClear();
      mobileSendVisitorAllocatedVariationsSpy.mockClear();

      // Neither platform
      mockGlobals({
        __fsWebpackIsBrowser__: false,
        __fsWebpackIsReactNative__: false
      });
      handleMessage.sendVisitorAllocatedVariations(visitorVariationState);
      expect(webSendVisitorAllocatedVariationsSpy).not.toHaveBeenCalled();
      expect(mobileSendVisitorAllocatedVariationsSpy).not.toHaveBeenCalled();
    });
  });

  describe('sendVisitorExposedVariations', () => {
    it('should route to web or mobile implementation based on platform flags', () => {
      const visitorVariationState: VisitorVariationState = {
        exposedVariations: {
          campaign1: {
            campaignId: 'campaign1',
            variationGroupId: 'vg1',
            variationId: 'v1'
          }
        },
        navigationDetected: true
      };

      // Browser
      mockGlobals({
        __fsWebpackIsBrowser__: true,
        __fsWebpackIsReactNative__: false
      });
      handleMessage.sendVisitorExposedVariations(visitorVariationState);
      expect(webSendVisitorExposedVariationsSpy).toHaveBeenCalledWith(visitorVariationState);
      expect(mobileSendVisitorExposedVariationsSpy).not.toHaveBeenCalled();

      webSendVisitorExposedVariationsSpy.mockClear();

      // React Native
      mockGlobals({
        __fsWebpackIsBrowser__: false,
        __fsWebpackIsReactNative__: true
      });
      handleMessage.sendVisitorExposedVariations(visitorVariationState);
      expect(mobileSendVisitorExposedVariationsSpy).toHaveBeenCalledWith(visitorVariationState);
    });
  });

  describe('sendFsHitToQA', () => {
    it('should route hit data to web or mobile platform-specific sender', () => {
      const hit = [
        {
          type: 'PAGEVIEW',
          url: 'https://example.com/page1',
          qt: 100
        },
        {
          type: 'EVENT',
          action: 'click',
          category: 'button',
          qt: 200
        }
      ];

      // Browser
      mockGlobals({
        __fsWebpackIsBrowser__: true,
        __fsWebpackIsReactNative__: false
      });
      handleMessage.sendFsHitToQA(hit);
      expect(webSendFsHitToQASpy).toHaveBeenCalledWith(hit);
      expect(mobileSendFsHitToQASpy).not.toHaveBeenCalled();

      webSendFsHitToQASpy.mockClear();

      // React Native
      mockGlobals({
        __fsWebpackIsBrowser__: false,
        __fsWebpackIsReactNative__: true
      });
      handleMessage.sendFsHitToQA(hit);
      expect(mobileSendFsHitToQASpy).toHaveBeenCalledWith(hit);
      expect(webSendFsHitToQASpy).not.toHaveBeenCalled();
    });
  });
});
