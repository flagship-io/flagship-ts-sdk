
/**
 * @jest-environment jsdom
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { IFlagshipConfig } from '../../src/config/IFlagshipConfig';
import { VisitorVariationState } from '../../src/type.local';
import { detectNavigationChanges } from '../../src/qaAssistant/detectNavigationChanges';

describe('detectNavigationChanges', () => {
  let config: IFlagshipConfig;
  let visitorVariationState: VisitorVariationState;
  let callback: jest.Mock;

  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  beforeEach(() => {
    window.__flagshipSdkOriginalPushState = undefined;
    window.__flagshipSdkOriginalReplaceState = undefined;
    window.__flagshipSdkPopStateHandler = undefined;

    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;

    config = { isQAModeEnabled: true } as IFlagshipConfig;

    visitorVariationState = { navigationDetected: false } as VisitorVariationState;

    callback = jest.fn();
  });

  afterEach(() => {

    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;


    if (window.__flagshipSdkPopStateHandler) {
      window.removeEventListener('popstate', window.__flagshipSdkPopStateHandler);
    }
  });

  it('should store the original history methods', () => {
    detectNavigationChanges(config, visitorVariationState, callback);

    expect(window.__flagshipSdkOriginalPushState).toBe(originalPushState);
    expect(window.__flagshipSdkOriginalReplaceState).toBe(originalReplaceState);
    expect(typeof window.__flagshipSdkPopStateHandler).toBe('function');
  });

  it('should override history.pushState and call callback when QA mode is enabled', () => {
    detectNavigationChanges(config, visitorVariationState, callback);


    window.history.pushState({}, '', '/new-page');

    expect(callback).toHaveBeenCalledTimes(1);
    expect(visitorVariationState.navigationDetected).toBe(true);
  });

  it('should override history.replaceState and call callback when QA mode is enabled', () => {
    detectNavigationChanges(config, visitorVariationState, callback);


    window.history.replaceState({}, '', '/replaced-page');

    expect(callback).toHaveBeenCalledTimes(1);
    expect(visitorVariationState.navigationDetected).toBe(true);
  });

  it('should call callback on popstate event when QA mode is enabled', () => {
    detectNavigationChanges(config, visitorVariationState, callback);

    window.dispatchEvent(new Event('popstate'));

    expect(callback).toHaveBeenCalledTimes(1);
    expect(visitorVariationState.navigationDetected).toBe(true);
  });

  it('should not call callback when QA mode is disabled', () => {
    config.isQAModeEnabled = false;
    detectNavigationChanges(config, visitorVariationState, callback);


    window.history.pushState({}, '', '/new-page');
    window.history.replaceState({}, '', '/replaced-page');
    window.dispatchEvent(new Event('popstate'));

    expect(callback).not.toHaveBeenCalled();
    expect(visitorVariationState.navigationDetected).toBe(false);
  });

  it('should clean up previous event handlers when called multiple times', () => {

    detectNavigationChanges(config, visitorVariationState, callback);

    const firstPushState = window.history.pushState;
    const firstReplaceState = window.history.replaceState;
    const firstPopStateHandler = window.__flagshipSdkPopStateHandler;

    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    detectNavigationChanges(config, visitorVariationState, callback);

    expect(removeEventListenerSpy).toHaveBeenCalledWith('popstate', firstPopStateHandler);

    expect(window.history.pushState).not.toBe(firstPushState);
    expect(window.history.replaceState).not.toBe(firstReplaceState);
    expect(window.__flagshipSdkPopStateHandler).not.toBe(firstPopStateHandler);

    removeEventListenerSpy.mockRestore();
  });
});
