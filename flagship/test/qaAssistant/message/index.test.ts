/**
 * @jest-environment jsdom
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { sendFsHitToQA, sendMessageToIframe, sendVisitorAllocatedVariations, sendVisitorExposedVariations } from '../../../src/qaAssistant/messages';
import { EventDataToIframe, MSG_NAME_TO_IFRAME } from '../../../src/qaAssistant/type';
import { DecisionApiConfig } from '../../../src/config/DecisionApiConfig';
import * as utils from '../../../src/utils/utils';
import { VisitorVariations } from '../../../src/types';

describe('Test messages', () => {
  beforeEach(() => {
    config.isQAModeEnabled = true;
    isBrowserSpy.mockReturnValue(true);
  });
  const config = new DecisionApiConfig();
  config.envId = 'envId';

  const isBrowserSpy = jest.spyOn(utils, 'isBrowser');

  const postMessageSpy = jest.fn();
  global.window.frames.ABTastyQaAssistant = {
    ...global.window.frames,
    postMessage: postMessageSpy
  };

  it('test sendMessageToIframe', () => {
    const eventDataToIframe:EventDataToIframe = {
      name: MSG_NAME_TO_IFRAME.FsHIT,
      value: []
    };
    sendMessageToIframe(eventDataToIframe);
    expect(postMessageSpy).toBeCalledTimes(1);
    expect(postMessageSpy).toBeCalledWith(eventDataToIframe, '*');
  });

  it('test sendMessageToIframe when environment is not a browser', () => {
    isBrowserSpy.mockReturnValue(false);
    const eventDataToIframe:EventDataToIframe = {
      name: MSG_NAME_TO_IFRAME.FsHIT,
      value: []
    };
    sendMessageToIframe(eventDataToIframe);
    expect(postMessageSpy).toBeCalledTimes(0);
  });

  it('test sendVisitorAllocatedVariations', () => {
    const visitorVariations:Record<string, VisitorVariations> = { key: {} as VisitorVariations };
    sendVisitorAllocatedVariations(visitorVariations);
    expect(window.flagship?.visitorVariations).toEqual(visitorVariations);
    expect(postMessageSpy).toBeCalledTimes(1);
    expect(postMessageSpy).toBeCalledWith({
      name: MSG_NAME_TO_IFRAME.FsUpdateVisitorAllocatedVariation,
      value: visitorVariations
    }, '*');
  });

  it('test sendVisitorAllocatedVariations', () => {
    window.flagship = { visitorVariations: {} };
    isBrowserSpy.mockReturnValue(false);
    const visitorVariations:Record<string, VisitorVariations> = { key: {} as VisitorVariations };
    sendVisitorAllocatedVariations(visitorVariations);
    expect(window.flagship?.visitorVariations).toEqual({});
    expect(postMessageSpy).toBeCalledTimes(0);
  });

  it('test sendVisitorExposedVariations', () => {
    const visitorExposedVariations:Record<string, VisitorVariations> = { key: {} as VisitorVariations };
    sendVisitorExposedVariations(visitorExposedVariations);
    expect(postMessageSpy).toBeCalledTimes(1);
    expect(postMessageSpy).toBeCalledWith({
      name: MSG_NAME_TO_IFRAME.FsVisitorExposedVariation,
      value: visitorExposedVariations
    }, '*');
  });

  it('test sendFsHitToQA', () => {
    const hits:Record<string, unknown>[] = [
      { key: { key: 'value' } }
    ];
    sendFsHitToQA(hits);
    expect(postMessageSpy).toBeCalledTimes(1);
    expect(postMessageSpy).toBeCalledWith({
      name: MSG_NAME_TO_IFRAME.FsHIT,
      value: hits.map(item => {
        return {
          ...item,
          timestamp: Date.now() - (item.qt as number)
        };
      })
    }, '*');
  });
});
