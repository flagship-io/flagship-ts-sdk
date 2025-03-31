/**
 * @jest-environment jsdom
 */

import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import * as utils from '../../src/utils/utils';
import { launchQaAssistant } from '../../src/qaAssistant';
import * as loadQaAssistant from '../../src/qaAssistant/loadQaAssistant';
import * as listenForKeyboardQaAssistant from '../../src/qaAssistant/listenForKeyboardQaAssistant';
import { DecisionApiConfig } from '../../src/config/DecisionApiConfig';
import { VisitorVariationState } from '../../src/type.local';
import { MSG_NAME_FROM_IFRAME } from '../../src/qaAssistant/type';
import { FS_QA_ASSISTANT, FS_QA_ASSISTANT_LOCAL, FS_QA_ASSISTANT_STAGING, QA_ASSISTANT_LOCAL_URL, QA_ASSISTANT_PROD_URL, QA_ASSISTANT_STAGING_URL, TRUSTED_QA_ORIGINS } from '../../src/enum/FlagshipConstant';
describe('Qa Assistant', () => {
  const { location } = window;
  const isBrowserSpy = jest.spyOn(utils, 'isBrowser');
  const loadQaAssistantSpy = jest.spyOn(loadQaAssistant, 'loadQaAssistant');
  const listenForKeyboardQaAssistantSpy = jest.spyOn(
    listenForKeyboardQaAssistant,
    'listenForKeyboardQaAssistant'
  );
  const onDomReadySpy = jest.spyOn(utils, 'onDomReady');
  const visitorVariationState: VisitorVariationState = {};

  beforeEach(() => {
    isBrowserSpy.mockReturnValue(true);

    onDomReadySpy.mockImplementation((callback?: () => void): boolean => {
      callback?.();
      return true;
    });

    loadQaAssistantSpy.mockImplementation(() => {
      //
    });
    listenForKeyboardQaAssistantSpy.mockImplementation(() => {
      //
    });
  });

  afterAll(() => {
    window.location = location as Location & string;
  });

  it('test launchQaAssistant when environment is not a browser', () => {
    isBrowserSpy.mockReturnValue(false);
    const config = new DecisionApiConfig();
    config.isQAModeEnabled = true;

    launchQaAssistant(config, visitorVariationState);
    expect(loadQaAssistantSpy).toBeCalledTimes(0);
    expect(listenForKeyboardQaAssistantSpy).toBeCalledTimes(0);
  });
  it('test launchQaAssistant when isQAModeEnabled is true', () => {
    const config = new DecisionApiConfig();
    config.isQAModeEnabled = true;

    launchQaAssistant(config, visitorVariationState);
    expect(loadQaAssistantSpy).toBeCalledTimes(1);
    expect(loadQaAssistantSpy).toBeCalledWith(
      config,
      undefined,
      visitorVariationState
    );
    expect(listenForKeyboardQaAssistantSpy).toBeCalledTimes(0);
  });

  it('test launchQaAssistant when isQAModeEnabled is false ', () => {
    const config = new DecisionApiConfig();
    config.isQAModeEnabled = false;

    launchQaAssistant(config, visitorVariationState);
    expect(loadQaAssistantSpy).toBeCalledTimes(0);
    expect(listenForKeyboardQaAssistantSpy).toBeCalledTimes(1);
    expect(listenForKeyboardQaAssistantSpy).toBeCalledWith(
      config,
      visitorVariationState
    );
  });

  it('test launchQaAssistant when when fs_qa_assistant is true ', () => {
    const config = new DecisionApiConfig();
    config.isQAModeEnabled = false;

    delete (window as any).location;
    window.location = {
      ...location,
      search: `?${FS_QA_ASSISTANT}=true`
    } as Location & string;

    launchQaAssistant(config, visitorVariationState);
    expect(loadQaAssistantSpy).toBeCalledTimes(1);
    expect(loadQaAssistantSpy).toBeCalledWith(
      config,
      QA_ASSISTANT_PROD_URL,
      visitorVariationState
    );
    expect(listenForKeyboardQaAssistantSpy).toBeCalledTimes(0);
  });

  it('test launchQaAssistant when when fs_qa_assistant_staging is true ', () => {
    const config = new DecisionApiConfig();
    config.isQAModeEnabled = false;

    delete (window as any).location;
    window.location = {
      ...location,
      search: `?${FS_QA_ASSISTANT_STAGING}=true`
    } as Location & string;

    launchQaAssistant(config, visitorVariationState);
    expect(loadQaAssistantSpy).toBeCalledTimes(1);
    expect(loadQaAssistantSpy).toBeCalledWith(
      config,
      QA_ASSISTANT_STAGING_URL,
      visitorVariationState
    );
    expect(listenForKeyboardQaAssistantSpy).toBeCalledTimes(0);
  });

  it('test launchQaAssistant when when fs_qa_assistant_local is true ', () => {
    const config = new DecisionApiConfig();
    config.isQAModeEnabled = false;

    delete (window as any).location;
    window.location = {
      ...location,
      search: `?${FS_QA_ASSISTANT_LOCAL}=true`
    } as Location & string;

    launchQaAssistant(config, visitorVariationState);
    expect(loadQaAssistantSpy).toBeCalledTimes(1);
    expect(loadQaAssistantSpy).toBeCalledWith(
      config,
      QA_ASSISTANT_LOCAL_URL,
      visitorVariationState
    );
    expect(listenForKeyboardQaAssistantSpy).toBeCalledTimes(0);
  });

  it('test launchQaAssistant when when fs_qa_assistant is true ', () => {
    onDomReadySpy.mockImplementation((): boolean => {
      return false;
    });

    const config = new DecisionApiConfig();
    config.isQAModeEnabled = false;

    delete (window as any).location;
    window.location = {
      ...location,
      search: `?${FS_QA_ASSISTANT}=true`
    } as Location & string;

    launchQaAssistant(config, visitorVariationState);
    expect(loadQaAssistantSpy).toBeCalledTimes(0);
    expect(listenForKeyboardQaAssistantSpy).toBeCalledTimes(0);
  });

  it('should call loadQaAssistant when receiving QA_ASSISTANT_PLATFORM_CHOICE_LOADED message', () => {
    const config = new DecisionApiConfig();
    config.isQAModeEnabled = false;

    delete (window as any).location;
    window.location = {
      ...location,
      search: ''

    } as Location & string;

    const event = new MessageEvent('message', {
      origin: TRUSTED_QA_ORIGINS[0],
      data: { name: MSG_NAME_FROM_IFRAME.QaAssistantPlatformChoiceLoaded }
    });

    launchQaAssistant(config, visitorVariationState);

    config.isQAModeEnabled = false;

    window.dispatchEvent(event);

    expect(loadQaAssistantSpy).toBeCalledTimes(1);
    expect(loadQaAssistantSpy).toBeCalledWith(
      config,
      null,
      visitorVariationState
    );
  });

  it('should call NOT loadQaAssistant when receiving QA_ASSISTANT_PLATFORM_CHOICE_LOADED message', () => {
    const config = new DecisionApiConfig();
    config.isQAModeEnabled = false;

    delete (window as any).location;
    window.location = {
      ...location,
      search: ''
    } as Location & string;

    const event = new MessageEvent('message', { data: { name: MSG_NAME_FROM_IFRAME.QaAssistantPlatformChoiceLoaded } });

    launchQaAssistant(config, visitorVariationState);

    config.isQAModeEnabled = false;

    window.dispatchEvent(event);

    expect(loadQaAssistantSpy).toBeCalledTimes(0);
  });
});
