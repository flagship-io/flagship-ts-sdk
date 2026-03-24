import { VisitorVariationState } from '../../type.local.ts';
import { sendVisitorAllocatedVariations, sendVisitorExposedVariations } from './handleSdkMessage.ts';


export function onQaAssistantReady(visitorVariationState: VisitorVariationState):void {

  if (visitorVariationState.visitorVariations) {
    sendVisitorAllocatedVariations(visitorVariationState);
  }
  if (visitorVariationState.exposedVariations) {
    sendVisitorExposedVariations(visitorVariationState);
  }
}
