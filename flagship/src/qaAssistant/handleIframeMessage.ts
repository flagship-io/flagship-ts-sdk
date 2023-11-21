
import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { FS_IS_QA_MODE_ENABLED } from '../enum/FlagshipConstant'
import { EventDataFromIframe, MSG_NAME_FROM_IFRAME } from './type'

export function handleIframeMessage ({ event, config, func }: { event: MessageEvent<EventDataFromIframe>, config: IFlagshipConfig, func?: (event: MessageEvent<EventDataFromIframe>) => void }) {
  switch (event.data.name) {
    case MSG_NAME_FROM_IFRAME.QaAssistantClose:
      onQaAssistantClose({ config, func })
      break

    default:
      break
  }
}

function onQaAssistantClose ({ config, func }:{config:IFlagshipConfig, func?: (event: MessageEvent<EventDataFromIframe>) => void}) {
  config.isQAModeEnabled = false
  sessionStorage.removeItem(FS_IS_QA_MODE_ENABLED)
  if (func) {
    window.removeEventListener('message', func)
  }
}
