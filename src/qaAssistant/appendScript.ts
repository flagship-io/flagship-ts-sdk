import { FS_QA_ASSISTANT_SCRIPT_TAG_ID } from '../enum/FlagshipConstant'

/**
 *
 * @param bundleFileUrl
 */
export function appendScript (bundleFileUrl: string): void {
  const script = document.createElement('script')
  script.src = bundleFileUrl
  script.id = FS_QA_ASSISTANT_SCRIPT_TAG_ID
  document.body.append(script)
}
