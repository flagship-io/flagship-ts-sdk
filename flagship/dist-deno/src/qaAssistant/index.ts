import { FS_QA_ASSISTANT, FS_QA_ASSISTANT_LOCAL, FS_QA_ASSISTANT_STAGING, QA_ASSISTANT_LOCAL_URL, QA_ASSISTANT_PROD_URL, QA_ASSISTANT_STAGING_URL, TAG_QA_ASSISTANT, TAG_QA_ASSISTANT_LOCAL, TAG_QA_ASSISTANT_STAGING } from '../enum/FlagshipConstant.ts'
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
  const urlMap = {
    [FS_QA_ASSISTANT]: QA_ASSISTANT_PROD_URL,
    [TAG_QA_ASSISTANT]: QA_ASSISTANT_PROD_URL,
    [FS_QA_ASSISTANT_STAGING]: QA_ASSISTANT_STAGING_URL,
    [TAG_QA_ASSISTANT_STAGING]: QA_ASSISTANT_STAGING_URL,
    [FS_QA_ASSISTANT_LOCAL]: QA_ASSISTANT_LOCAL_URL,
    [TAG_QA_ASSISTANT_LOCAL]: QA_ASSISTANT_LOCAL_URL
  }
  const queryParam = new URLSearchParams(window.location.search)
  const urlKey = Object.keys(urlMap).find(key => queryParam.get(key) === 'true') || ''

  if (config.isQAModeEnabled || urlKey) {
    loadQaAssistant(config, urlMap[urlKey as keyof typeof urlMap])
    return
  }
  listenForKeyboardQaAssistant(config)
}
