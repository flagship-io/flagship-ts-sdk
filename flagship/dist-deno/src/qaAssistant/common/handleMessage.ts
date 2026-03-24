import { VisitorVariationState } from '../../type.local.ts';
import { sendVisitorAllocatedVariations as webSendVisitorAllocatedVariations,
  sendVisitorExposedVariations as webSendVisitorExposedVariations,
  sendFsHitToQA as webSendFsHitToQA  } from '../web/messages/index.ts';
import { sendVisitorAllocatedVariations as mobileSendVisitorAllocatedVariations,
  sendVisitorExposedVariations as mobileSendVisitorExposedVariations,
  sendFsHitToQA as mobileSendFsHitToQA } from '../mobile/handleSdkMessage.ts';


export function sendVisitorAllocatedVariations(visitorVariationState: VisitorVariationState):void {
  if (__fsWebpackIsBrowser__) {
    webSendVisitorAllocatedVariations(visitorVariationState);
  }
  if (__fsWebpackIsReactNative__) {
    mobileSendVisitorAllocatedVariations(visitorVariationState);
  }
}

export function sendVisitorExposedVariations(visitorVariationState: VisitorVariationState):void {
  if (__fsWebpackIsBrowser__) {
    webSendVisitorExposedVariations(visitorVariationState);
  }
  if (__fsWebpackIsReactNative__) {
    mobileSendVisitorExposedVariations(visitorVariationState);
  }
}

export function sendFsHitToQA(hit: Record<string, unknown>[]):void {
  if (__fsWebpackIsBrowser__) {
    webSendFsHitToQA(hit);
  }
  if (__fsWebpackIsReactNative__) {
    mobileSendFsHitToQA(hit);
  }
}
