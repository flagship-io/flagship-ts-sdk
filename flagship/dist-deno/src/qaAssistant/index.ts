import { FS_QA_ASSISTANT,
  FS_QA_ASSISTANT_LOCAL,
  FS_QA_ASSISTANT_STAGING,
  QA_ASSISTANT_LOCAL_URL,
  QA_ASSISTANT_PROD_URL,
  QA_ASSISTANT_STAGING_URL,
  TAG_QA_ASSISTANT,
  TAG_QA_ASSISTANT_LOCAL,
  TAG_QA_ASSISTANT_STAGING,
  TRUSTED_QA_ORIGINS } from '../enum/FlagshipConstant.ts';
import { IFlagshipConfig } from '../config/IFlagshipConfig.ts';
import { isBrowser, onDomReady } from '../utils/utils.ts';
import { listenForKeyboardQaAssistant } from './listenForKeyboardQaAssistant.ts';
import { loadQaAssistant } from './loadQaAssistant.ts';
import { detectNavigationChanges } from './detectNavigationChanges.ts';
import { VisitorVariationState } from '../type.local.ts';
import { EventDataFromIframe, MSG_NAME_FROM_IFRAME } from './type.ts';

/**
 *
 * @param config
 * @returns
 */
export function launchQaAssistant(
  config: IFlagshipConfig,
  visitorVariationState: VisitorVariationState
): void {
  if (!isBrowser()) {
    return;
  }

  onDomReady(() => {
    const urlMap = {
      [FS_QA_ASSISTANT]: QA_ASSISTANT_PROD_URL,
      [TAG_QA_ASSISTANT]: QA_ASSISTANT_PROD_URL,
      [FS_QA_ASSISTANT_STAGING]: QA_ASSISTANT_STAGING_URL,
      [TAG_QA_ASSISTANT_STAGING]: QA_ASSISTANT_STAGING_URL,
      [FS_QA_ASSISTANT_LOCAL]: QA_ASSISTANT_LOCAL_URL,
      [TAG_QA_ASSISTANT_LOCAL]: QA_ASSISTANT_LOCAL_URL
    };
    const queryParam = new URLSearchParams(window.location.search);
    const urlKey =
      Object.keys(urlMap).find((key) => queryParam.get(key) === 'true') || '';

    if (window.__flagshipSdkOnPlatformChoiceLoaded) {
      window.removeEventListener('message', window.__flagshipSdkOnPlatformChoiceLoaded);
    }

    function onPlatformChoiceLoaded(
      event: MessageEvent<EventDataFromIframe>
    ): void {

      if (!TRUSTED_QA_ORIGINS.includes(event.origin)) {
        return;
      }

      if (
        event.data.name === MSG_NAME_FROM_IFRAME.QaAssistantPlatformChoiceLoaded
      ) {
        if (!config.isQAModeEnabled) {
          loadQaAssistant(config, null, visitorVariationState);
        }
        window.removeEventListener('message', onPlatformChoiceLoaded);
      }
    }

    window.__flagshipSdkOnPlatformChoiceLoaded = onPlatformChoiceLoaded;

    window.addEventListener('message', window.__flagshipSdkOnPlatformChoiceLoaded);

    detectNavigationChanges(config, visitorVariationState);

    if (config.isQAModeEnabled || urlKey) {
      loadQaAssistant(
        config,
        urlMap[urlKey as keyof typeof urlMap],
        visitorVariationState
      );
      return;
    }
    listenForKeyboardQaAssistant(config, visitorVariationState);
  });
}
