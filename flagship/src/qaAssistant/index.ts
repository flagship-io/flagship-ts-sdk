import { FS_QA_ASSISTANT, FS_QA_ASSISTANT_LOCAL, FS_QA_ASSISTANT_STAGING, QA_ASSISTANT_LOCAL_URL, QA_ASSISTANT_PROD_URL, QA_ASSISTANT_STAGING_URL } from '@src/enum/FlagshipConstant'
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

  let bundleUrl:string|null = null
  const queryParam = new URLSearchParams(window.location.search)
  if (queryParam.get(FS_QA_ASSISTANT) === 'true') {
    bundleUrl = QA_ASSISTANT_PROD_URL
  } else if (queryParam.get(FS_QA_ASSISTANT_STAGING) === 'true') {
    bundleUrl = QA_ASSISTANT_STAGING_URL
  } else if (queryParam.get(FS_QA_ASSISTANT_LOCAL) === 'true') {
    bundleUrl = QA_ASSISTANT_LOCAL_URL
  }

  if (config.isQAModeEnabled || bundleUrl) {
    loadQaAssistant(config, bundleUrl)
    return
  }
  listenForKeyboardQaAssistant(config)
}
