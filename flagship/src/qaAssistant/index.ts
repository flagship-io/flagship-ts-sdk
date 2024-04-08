import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { isBrowser } from '../utils/utils'
import { listenForKeyboardQaAssistant } from './listenForKeyboardQaAssistant'
import { loadQaAssistant } from './loadQaAssistant'

/**
 *
 * @param config
 * @returns
 */
export function launchQaAssistant (config: IFlagshipConfig): void {
  if (!isBrowser()) {
    return
  }
  if (config.isQAModeEnabled) {
    loadQaAssistant(config)
    return
  }
  listenForKeyboardQaAssistant(config)
}
