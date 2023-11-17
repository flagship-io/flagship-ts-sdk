
import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { EventDataFromIframe, MSG_NAME_FROM_IFRAME } from './type'

export function handleIframeMessage ({ event, config }: { event: MessageEvent<EventDataFromIframe>, config: IFlagshipConfig }) {
  switch (event.data.name) {
    case MSG_NAME_FROM_IFRAME.QA_ASSISTANT_IS_READY:

      break

    default:
      break
  }
}
