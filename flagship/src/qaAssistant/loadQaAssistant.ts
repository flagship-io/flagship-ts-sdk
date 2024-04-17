import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { FS_FORCED_VARIATIONS, FS_IS_QA_MODE_ENABLED, QA_ASSISTANT_PROD_URL } from '../enum/FlagshipConstant'
import { FsVariationToForce } from '../types'
import { logInfoSprintf } from '../utils/utils'
import { appendScript } from './appendScript'
import { handleIframeMessage } from './messages/handleIframeMessage'
import { EventDataFromIframe } from './type'

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
    console.error('Error parsing sessionForcedVariations', error)
  }

  window.flagship = {
    ...window.flagship,
    envId: config.envId as string,
    forcedVariations
  }

  const eventListenerMessage = (event: MessageEvent<EventDataFromIframe>) => {
    handleIframeMessage({ event, config, func: eventListenerMessage })
  }
  window.addEventListener('message', eventListenerMessage)

  logInfoSprintf(config, 'QA assistant', 'Loading QA Assistant')
  // const bundleFileUrl = 'https://127.0.0.1/bundle.js'

  appendScript(bundleUrl || QA_ASSISTANT_PROD_URL)

  config.isQAModeEnabled = true
  sessionStorage.setItem(FS_IS_QA_MODE_ENABLED, 'true')
}
