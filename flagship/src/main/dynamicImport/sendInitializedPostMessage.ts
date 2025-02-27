import { ABTastyWebSDKPostMessageType } from '../../types'

export function sendInitializedPostMessage (): void {
  if (typeof window === 'undefined') {
    return
  }
  window.postMessage({ action: ABTastyWebSDKPostMessageType.AB_TASTY_WEB_SDK_INITIALIZED }, '*')
}
