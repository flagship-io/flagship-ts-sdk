
import { IFlagshipConfig } from '../../config/IFlagshipConfig.ts';
import { VisitorVariationState } from '../../type.local.ts';
import { isBrowser } from '../../utils/utils.ts';
import { EventDataFromIframe, MSG_NAME_FROM_IFRAME } from '../type.ts';
import { onApplyForcedVariations, onQaAssistantClose, onQaAssistantReady, onResetForcedVariations, render } from './iframeMessageActions.ts';

export function handleIframeMessage({ event, config, func, visitorVariationState }:
  { event: MessageEvent<EventDataFromIframe>, config: IFlagshipConfig, func?: (event: MessageEvent<EventDataFromIframe>) => void,
  visitorVariationState: VisitorVariationState }):void {
  if (!config.isQAModeEnabled || !isBrowser()) {
    return;
  }
  switch (event.data.name) {
    case MSG_NAME_FROM_IFRAME.FsQaAssistantReady:
      onQaAssistantReady(visitorVariationState);
      break;
    case MSG_NAME_FROM_IFRAME.MinimizeQaAssistantClose:
    case MSG_NAME_FROM_IFRAME.QaAssistantClose:
      onQaAssistantClose({
        config,
        func,
        visitorVariationState
      });
      break;
    case MSG_NAME_FROM_IFRAME.FsApplyForcedVariations:
      onApplyForcedVariations({
        value: event.data.value,
        visitorVariationState
      });
      break;
    case MSG_NAME_FROM_IFRAME.FsResetForcedVariations:
      onResetForcedVariations(visitorVariationState);
      break;
    case MSG_NAME_FROM_IFRAME.FsTriggerRender:
      render(true);
      break;
  }
}
