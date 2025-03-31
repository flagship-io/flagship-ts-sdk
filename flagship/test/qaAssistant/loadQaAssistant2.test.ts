/**
 * @jest-environment jsdom
 */

import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { loadQaAssistant } from '../../src/qaAssistant/loadQaAssistant';
import { DecisionApiConfig } from '../../src/config/DecisionApiConfig';
import * as handleIframeMessage from '../../src/qaAssistant/messages/handleIframeMessage';
import { VisitorVariationState } from '../../src/type.local';
import { TRUSTED_QA_ORIGINS } from '../../src/enum/FlagshipConstant';
import { MSG_NAME_FROM_IFRAME } from '../../src/qaAssistant/type';

describe('Test loadQaAssistant', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });
  const config = new DecisionApiConfig();
  config.envId = 'envId';
  const visitorVariationState: VisitorVariationState = {};

  const handleIframeMessageSpy = jest.spyOn(handleIframeMessage, 'handleIframeMessage');


  it('test loadQaAssistant handleIframeMessageSpy', () => {

    handleIframeMessageSpy.mockImplementation(() => {
      //
    });

    loadQaAssistant(config, null, visitorVariationState);

    const event = new MessageEvent('message', {
      origin: TRUSTED_QA_ORIGINS[0],
      data: { name: MSG_NAME_FROM_IFRAME.QaAssistantPlatformChoiceLoaded }
    });
    window.dispatchEvent(event);

    expect(handleIframeMessageSpy).toBeCalledTimes(1);
  });

});
