import { IFlagshipConfig } from '../config/IFlagshipConfig.ts'
import { FS_FORCED_VARIATIONS, FS_IS_QA_MODE_ENABLED, QA_ASSISTANT_PROD_URL } from '../enum/FlagshipConstant.ts'
import { FsVariationToForce } from '../types.ts'
import { logInfoSprintf } from '../utils/utils.ts'
import { appendScript } from './appendScript.ts'
import { handleIframeMessage } from './messages/handleIframeMessage.ts'
import { EventDataFromIframe } from './type.ts'

/**
 *
 * @param config
 * @returns
 */
export function loadQaAssistant (config: IFlagshipConfig, bundleUrl:string|null = null): void {
  if (window?.frames?.ABTastyQaAssistant) {
    return
  }

  let forcedVariations: Record<string, FsVariationToForce> = {}
  const sessionForcedVariations = sessionStorage.getItem(FS_FORCED_VARIATIONS)
  try {
    forcedVariations = JSON.parse(sessionForcedVariations || '{}')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error parsing sessionForcedVariations', error)
  }

  window.flagship = {
    ...window.flagship,
    envId: config.envId as string,
    forcedVariations
  }

  const eventListenerMessage = (event: MessageEvent<EventDataFromIframe>):void => {
    handleIframeMessage({ event, config, func: eventListenerMessage })
  }
  window.addEventListener('message', eventListenerMessage)

  logInfoSprintf(config, 'QA assistant', 'Loading QA Assistant')

  appendScript(bundleUrl || QA_ASSISTANT_PROD_URL)

  config.isQAModeEnabled = true
  sessionStorage.setItem(FS_IS_QA_MODE_ENABLED, 'true')
}
