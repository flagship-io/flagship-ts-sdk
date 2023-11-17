import { VisitorVariations } from '../../types'
import { isBrowser } from '../../utils/utils'
import { EventDataToIframe, MSG_NAME_TO_IFRAME } from '../type'

export function sendMessageToIframe (data: EventDataToIframe): void {
  if (!window?.frames?.ABTastyQaAssistant || !isBrowser()) {
    return
  }
  window.frames.ABTastyQaAssistant.postMessage(data, '*')
}

export function sendVisitorAllocatedVariations (visitorVariations: Record<string, VisitorVariations>) {
  sendMessageToIframe({ name: MSG_NAME_TO_IFRAME.FsUpdateVisitorAllocatedVariation, value: visitorVariations })
}
