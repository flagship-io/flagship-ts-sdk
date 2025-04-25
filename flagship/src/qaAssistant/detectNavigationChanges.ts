import { IFlagshipConfig } from '../config/IFlagshipConfig';
import { VisitorVariationState } from '../type.local';


export function detectNavigationChanges(config: IFlagshipConfig, visitorVariationState: VisitorVariationState, callback?: () => void): void {

  if (window.__flagshipSdkOriginalPushState) {
    window.history.pushState = window.__flagshipSdkOriginalPushState;
  }

  if (window.__flagshipSdkOriginalReplaceState) {
    window.history.replaceState = window.__flagshipSdkOriginalReplaceState;
  }

  if (window.__flagshipSdkPopStateHandler) {
    window.removeEventListener('popstate', window.__flagshipSdkPopStateHandler);
  }

  window.__flagshipSdkOriginalPushState = window.history.pushState;
  window.__flagshipSdkOriginalReplaceState = window.history.replaceState;

  function triggerCallback(): void {
    if (config.isQAModeEnabled) {
      visitorVariationState.navigationDetected = true;
      callback?.();
    }
  }

  window.history.pushState = function (...args): void {
    if (window.__flagshipSdkOriginalPushState) {
      window.__flagshipSdkOriginalPushState.apply(this, args);
      triggerCallback();
    }
  };

  window.history.replaceState = function (...args): void {
    if (window.__flagshipSdkOriginalReplaceState) {
      window.__flagshipSdkOriginalReplaceState.apply(this, args);
      triggerCallback();
    }
  };

  window.__flagshipSdkPopStateHandler = () => {
    triggerCallback();
  };

  window.addEventListener('popstate', window.__flagshipSdkPopStateHandler);
}
