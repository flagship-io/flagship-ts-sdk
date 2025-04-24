/**
 * @jest-environment jsdom
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { sendFsHitToQA,
  sendMessageToIframe,
  sendVisitorAllocatedVariations,
  sendVisitorExposedVariations } from '../../../src/qaAssistant/messages';
import { EventDataToIframe,
  MSG_NAME_TO_IFRAME,
  VisitorVariationUpdateParam } from '../../../src/qaAssistant/type';
import { DecisionApiConfig } from '../../../src/config/DecisionApiConfig';
import { VisitorVariations } from '../../../src/types';
import { VisitorVariationState } from '../../../src/type.local';

describe('Test messages', () => {
  beforeEach(() => {
    config.isQAModeEnabled = true;
    global.window.frames.ABTastyQaAssistant = {
      ...global.window.frames,
      postMessage: postMessageSpy
    };
  });
  const config = new DecisionApiConfig();
  config.envId = 'envId';

  const postMessageSpy = jest.fn();


  const visitorVariationState: VisitorVariationState = {};

  it('should send a message to the iframe', () => {
    const eventDataToIframe: EventDataToIframe = {
      name: MSG_NAME_TO_IFRAME.FsHIT,
      value: []
    };
    sendMessageToIframe(eventDataToIframe);
    expect(postMessageSpy).toBeCalledTimes(1);
    expect(postMessageSpy).toBeCalledWith(eventDataToIframe, '*');
  });

  it('should not send a message to the iframe when the iframe is undefined', () => {
    global.window.frames.ABTastyQaAssistant = undefined;
    const eventDataToIframe: EventDataToIframe = {
      name: MSG_NAME_TO_IFRAME.FsHIT,
      value: []
    };
    sendMessageToIframe(eventDataToIframe);
    expect(postMessageSpy).toBeCalledTimes(0);
  });

  it('should send visitor allocated variations to the iframe', () => {
    const visitorVariations: Record<string, VisitorVariations> = {
      campaignId: {
        campaignId: 'campaignId',
        variationGroupId: 'variationGroupId',
        variationId: 'variationId'
      }
    };
    visitorVariationState.visitorVariations = visitorVariations;
    sendVisitorAllocatedVariations(visitorVariationState);
    expect(visitorVariationState?.visitorVariations).toEqual(visitorVariations);
    expect(postMessageSpy).toBeCalledTimes(1);
    expect(postMessageSpy).toBeCalledWith(
      {
        name: MSG_NAME_TO_IFRAME.FsUpdateVisitorAllocatedVariation,
        value: visitorVariations
      },
      '*'
    );
  });

  it('should not send visitor allocated variations when they are undefined', () => {
    visitorVariationState.visitorVariations = undefined;
    sendVisitorAllocatedVariations(visitorVariationState);
    expect(visitorVariationState?.visitorVariations).toBeUndefined();
    expect(postMessageSpy).toBeCalledTimes(0);
  });

  it('should send visitor exposed variations to the iframe', () => {
    const visitorExposedVariations: Record<string, VisitorVariations> = {
      campaignId: {
        campaignId: 'campaignId',
        variationGroupId: 'variationGroupId',
        variationId: 'variationId'
      }
    };
    visitorVariationState.exposedVariations = visitorExposedVariations;
    sendVisitorExposedVariations(visitorVariationState);
    expect(postMessageSpy).toBeCalledTimes(1);
    expect(postMessageSpy).toBeCalledWith(
      {
        name: MSG_NAME_TO_IFRAME.FsVisitorExposedVariation,
        value: visitorExposedVariations,
        param: undefined
      },
      '*'
    );
  });

  it('should send visitor exposed variations with navigation detected', () => {
    const visitorExposedVariations: Record<string, VisitorVariations> = {
      campaignId: {
        campaignId: 'campaignId',
        variationGroupId: 'variationGroupId',
        variationId: 'variationId'
      }
    };
    visitorVariationState.exposedVariations = visitorExposedVariations;
    visitorVariationState.navigationDetected = true;
    sendVisitorExposedVariations(visitorVariationState);
    expect(postMessageSpy).toBeCalledTimes(1);
    expect(postMessageSpy).toBeCalledWith(
      {
        name: MSG_NAME_TO_IFRAME.FsVisitorExposedVariation,
        value: visitorExposedVariations,
        param: VisitorVariationUpdateParam.NewNavigation
      },
      '*'
    );
    expect(visitorVariationState.navigationDetected).toBe(false);
  });

  it('should not send visitor exposed variations when they are undefined', () => {
    visitorVariationState.exposedVariations = undefined;
    visitorVariationState.navigationDetected = true;
    sendVisitorExposedVariations(visitorVariationState);
    expect(postMessageSpy).toBeCalledTimes(0);
    expect(visitorVariationState.navigationDetected).toBe(true);
  });

  it('should send FS hit data to QA', () => {
    const hits: Record<string, unknown>[] = [{ key: { key: 'value' } }];
    sendFsHitToQA(hits);
    expect(postMessageSpy).toBeCalledTimes(1);
    expect(postMessageSpy).toBeCalledWith(
      {
        name: MSG_NAME_TO_IFRAME.FsHIT,
        value: hits.map((item) => {
          return {
            ...item,
            timestamp: Date.now() - (item.qt as number)
          };
        })
      },
      '*'
    );
  });
});
