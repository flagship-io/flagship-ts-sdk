import { IFlagshipConfig } from '../config/IFlagshipConfig';
import { FS_FORCED_VARIATIONS, FS_IS_QA_MODE_ENABLED, FS_VARIATIONS_FORCED_ALLOCATION, FS_VARIATIONS_FORCED_UNALLOCATION, QA_ASSISTANT_PROD_URL, TRUSTED_QA_ORIGINS } from '../enum/FlagshipConstant';
import { VisitorVariationState } from '../type.local';
import { FsVariationToForce } from '../types';
import { logInfoSprintf } from '../utils/utils';
import { appendScript } from './appendScript';
import { handleIframeMessage } from './messages/handleIframeMessage';
import { EventDataFromIframe } from './type';


function loadSessionVariations(key: string): Record<string, FsVariationToForce> {
  const sessionData = sessionStorage.getItem(key);
  let variations: Record<string, FsVariationToForce> = {};
  try {
    variations = JSON.parse(sessionData || '{}');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error parsing ${key}`, error);
  }
  return variations;
}

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

  visitorVariationState.forcedVariations =  loadSessionVariations(FS_FORCED_VARIATIONS);
  visitorVariationState.variationsForcedAllocation = loadSessionVariations(FS_VARIATIONS_FORCED_ALLOCATION); ;
  visitorVariationState.variationsForcedUnallocation = loadSessionVariations(FS_VARIATIONS_FORCED_UNALLOCATION); ;

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
