
import { IFlagshipConfig } from '../../config/IFlagshipConfig'
import { isBrowser } from '../../utils/utils'
import { EventDataFromIframe, MSG_NAME_FROM_IFRAME } from '../type'
import { onApplyForcedVariations, onQaAssistantClose, onQaAssistantReady, onResetForcedVariations, render } from './iframeMessageActions'

export function handleIframeMessage ({ event, config, func }: { event: MessageEvent<EventDataFromIframe>, config: IFlagshipConfig, func?: (event: MessageEvent<EventDataFromIframe>) => void }) {
  if (!config.isQAModeEnabled || !isBrowser()) {
    return
  }
  switch (event.data.name) {
    case MSG_NAME_FROM_IFRAME.FsQaAssistantReady:
      onQaAssistantReady()
      break
    case MSG_NAME_FROM_IFRAME.MinimizeQaAssistantClose:
    case MSG_NAME_FROM_IFRAME.QaAssistantClose:
      onQaAssistantClose({ config, func })
      break
    case MSG_NAME_FROM_IFRAME.FsApplyForcedVariations:
      onApplyForcedVariations({ value: event.data.value })
      break
    case MSG_NAME_FROM_IFRAME.FsResetForcedVariations:
      onResetForcedVariations()
      break
    case MSG_NAME_FROM_IFRAME.FsTriggerRender:
      render(true)
      break
  }
}
