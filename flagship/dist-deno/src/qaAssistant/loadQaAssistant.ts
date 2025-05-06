import { IFlagshipConfig } from '../config/IFlagshipConfig.ts';
import { FS_FORCED_VARIATIONS, FS_IS_QA_MODE_ENABLED, QA_ASSISTANT_PROD_URL, TRUSTED_QA_ORIGINS } from '../enum/FlagshipConstant.ts';
import { VisitorVariationState } from '../type.local.ts';
import { FsVariationToForce } from '../types.ts';
import { logInfoSprintf } from '../utils/utils.ts';
import { appendScript } from './appendScript.ts';
import { handleIframeMessage } from './messages/handleIframeMessage.ts';
import { EventDataFromIframe } from './type.ts';

/**
 *
 * @param config
 * @returns
 */
export function loadQaAssistant(config: IFlagshipConfig, bundleUrl:string|null = null, visitorVariationState: VisitorVariationState): void {
  if (!window?.frames?.ABTastyQaAssistant) {
    logInfoSprintf(config, 'QA assistant', 'Loading QA Assistant');

    appendScript(bundleUrl || QA_ASSISTANT_PROD_URL);
  }

  let forcedVariations: Record<string, FsVariationToForce> = {};
  const sessionForcedVariations = sessionStorage.getItem(FS_FORCED_VARIATIONS);
  try {
    forcedVariations = JSON.parse(sessionForcedVariations || '{}');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error parsing sessionForcedVariations', error);
  }

  visitorVariationState.forcedVariations = forcedVariations;

  if (window.__flagshipSdkQaAssistantMessageHandler) {
    window.removeEventListener('message', window.__flagshipSdkQaAssistantMessageHandler);
  }

  const eventListenerMessage = (event: MessageEvent<EventDataFromIframe>):void => {
    if (!TRUSTED_QA_ORIGINS.includes(event?.origin)) {
      return;
    }
    handleIframeMessage({
      visitorVariationState,
      event,
      config,
      func: eventListenerMessage
    });
  };

  window.__flagshipSdkQaAssistantMessageHandler = eventListenerMessage;

  window.addEventListener('message', window.__flagshipSdkQaAssistantMessageHandler);

  config.isQAModeEnabled = true;
  sessionStorage.setItem(FS_IS_QA_MODE_ENABLED, 'true');
}
