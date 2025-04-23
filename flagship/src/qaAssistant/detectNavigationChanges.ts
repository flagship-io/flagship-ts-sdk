import { IFlagshipConfig } from '../config/IFlagshipConfig';
import { VisitorVariationState } from '../type.local';


export function detectNavigationChanges(config: IFlagshipConfig, visitorVariationState: VisitorVariationState, callback?: () => void): void {
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  function triggerCallback(): void {
    if (config.isQAModeEnabled) {
      visitorVariationState.navigationDetected = true;
      callback?.();
    }
  }

  window.history.pushState = function (...args): void {
    originalPushState.apply(this, args);
    triggerCallback();
  };

  window.history.replaceState = function (...args): void {
    originalReplaceState.apply(this, args);
    triggerCallback();
  };

  window.addEventListener('popstate', () => {
    triggerCallback();
  });
}
