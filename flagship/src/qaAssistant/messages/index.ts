import { IFlagshipConfig } from '../../config/IFlagshipConfig'
import { EventDataToIframe, MSG_NAME_TO_IFRAME } from '../type'

export function sendMessageToIframe (data: EventDataToIframe): void {
  if (!window.frames.ABTastyQaAssistant) {
    return
  }
  window.frames.ABTastyQaAssistant.postMessage(data, '*')
}

export function onQaAssistantReady (config: IFlagshipConfig) {
  sendMessageToIframe({
    name: MSG_NAME_TO_IFRAME.FLAGSHIP_ENV_ID,
    value: config.envId as string
  })
}
