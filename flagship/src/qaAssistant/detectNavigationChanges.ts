import { IFlagshipConfig } from '../config/IFlagshipConfig';


export function detectNavigationChanges(config: IFlagshipConfig, callback?: () => void): void {
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  function triggerCallback(): void {
    if (config.isQAModeEnabled) {
      window.flagship = {
        ...window.flagship,
        navigationDetected: true
      };
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
