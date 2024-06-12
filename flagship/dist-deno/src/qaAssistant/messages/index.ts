import { VisitorVariations } from '../../types.ts'
import { isBrowser } from '../../utils/utils.ts'
import { EventDataToIframe, MSG_NAME_TO_IFRAME } from '../type.ts'

export function sendMessageToIframe (data: EventDataToIframe): void {
  if (!window?.frames?.ABTastyQaAssistant || !isBrowser()) {
    return
  }
  window.frames.ABTastyQaAssistant.postMessage(data, '*')
}

export function sendVisitorAllocatedVariations (visitorVariations: Record<string, VisitorVariations>) {
  if (!isBrowser()) {
    return
  }
  window.flagship = {
    ...window.flagship,
    visitorVariations
  }

  sendMessageToIframe({ name: MSG_NAME_TO_IFRAME.FsUpdateVisitorAllocatedVariation, value: visitorVariations })
}

export function sendVisitorExposedVariations (visitorVariations: Record<string, VisitorVariations>) {
  sendMessageToIframe({ name: MSG_NAME_TO_IFRAME.FsVisitorExposedVariation, value: visitorVariations })
}

export function sendFsHitToQA (hit: Record<string, unknown>[]) {
  sendMessageToIframe({
    name: MSG_NAME_TO_IFRAME.FsHIT,
    value: hit.map(item => {
      return { ...item, timestamp: Date.now() - (item.qt as number) }
    })
  })
}
