import { VisitorVariationState } from '../../type.local';
import { sendVisitorAllocatedVariations, sendVisitorExposedVariations } from './handleSdkMessage';


export function onQaAssistantReady(visitorVariationState: VisitorVariationState):void {

  if (visitorVariationState.visitorVariations) {
    sendVisitorAllocatedVariations(visitorVariationState);
  }
  if (visitorVariationState.exposedVariations) {
    sendVisitorExposedVariations(visitorVariationState);
  }
}
