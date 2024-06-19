import { FS_QA_ASSISTANT_SCRIPT_TAG_ID, FS_QA_URL, TAG_QA_URL } from '../enum/FlagshipConstant.ts'

const getScriptElement = (src: string): HTMLScriptElement | null =>
  document.querySelector<HTMLScriptElement>(`script[src*="${src}"]`)
/**
 *
 * @param bundleFileUrl
 */
export function appendScript (bundleFileUrl: string): void {
  if (getScriptElement(TAG_QA_URL) || getScriptElement(FS_QA_URL)) {
    return
  }
  const script = document.createElement('script')
  script.src = bundleFileUrl
  script.id = FS_QA_ASSISTANT_SCRIPT_TAG_ID
  document.body.append(script)
}
