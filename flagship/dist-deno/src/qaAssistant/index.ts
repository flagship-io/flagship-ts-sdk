import { IFlagshipConfig } from '../config/IFlagshipConfig.ts'
import { isBrowser } from '../utils/utils.ts'
import { listenForKeyboardQaAssistant } from './listenForKeyboardQaAssistant.ts'
import { loadQaAssistant } from './loadQaAssistant.ts'

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
