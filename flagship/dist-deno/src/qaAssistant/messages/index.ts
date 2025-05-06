import { VisitorVariationState } from '../../type.local.ts';
import { EventDataToIframe, MSG_NAME_TO_IFRAME, VisitorVariationUpdateParam } from '../type.ts';

export function sendMessageToIframe(data: EventDataToIframe): void {
  if (!window?.frames?.ABTastyQaAssistant) {
    return;
  }
  window.frames.ABTastyQaAssistant.postMessage(data, '*');
}

export function sendVisitorAllocatedVariations(visitorVariationState: VisitorVariationState):void {

  if (!visitorVariationState?.visitorVariations) {
    return;
  }

  sendMessageToIframe({
    name: MSG_NAME_TO_IFRAME.FsUpdateVisitorAllocatedVariation,
    value: visitorVariationState.visitorVariations
  });
}

export function sendVisitorExposedVariations(visitorVariationState: VisitorVariationState):void {
  if (!visitorVariationState?.exposedVariations) {
    return;
  }

  const navigationDetected = visitorVariationState.navigationDetected;

  if (visitorVariationState.navigationDetected) {
    visitorVariationState.navigationDetected = false;
  }

  sendMessageToIframe({
    name: MSG_NAME_TO_IFRAME.FsVisitorExposedVariation,
    value: visitorVariationState.exposedVariations,
    param: navigationDetected ? VisitorVariationUpdateParam.NewNavigation : undefined
  });
}

export function sendFsHitToQA(hit: Record<string, unknown>[]):void {
  sendMessageToIframe({
    name: MSG_NAME_TO_IFRAME.FsHIT,
    value: hit.map(item => {
      return {
        ...item,
        timestamp: Date.now() - (item.qt as number)
      };
    })
  });
}
