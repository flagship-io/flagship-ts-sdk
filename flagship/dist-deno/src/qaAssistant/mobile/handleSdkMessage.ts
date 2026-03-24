import { VisitorVariationState } from '../../type.local.ts';
import { QAEventSdkName, VisitorVariationUpdateParam } from '../common/types.ts';
import { ABTastyQAEventBus } from './QAEventBus.ts';



export function sendVisitorAllocatedVariations(visitorVariationState: VisitorVariationState):void {

  if (!visitorVariationState?.visitorVariations) {
    return;
  }

  ABTastyQAEventBus.emitQAEventToQAA(QAEventSdkName.SDK_ALLOCATED_VARIATIONS,{
    value: visitorVariationState.visitorVariations,
    visitorData: visitorVariationState.visitorData,
    sdkInfo: visitorVariationState.sdkInfo
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

  ABTastyQAEventBus.emitQAEventToQAA(QAEventSdkName.SDK_EXPOSED_VARIATIONS,{
    value: visitorVariationState.exposedVariations,
    param: navigationDetected ? VisitorVariationUpdateParam.NewNavigation : undefined
  });
}

export function sendFsHitToQA(hit: Record<string, unknown>[]):void {
  const hitWithTimestamps = hit.map(item => {
    return {
      ...item,
      timestamp: Date.now() - (item.qt as number)
    };
  });
  ABTastyQAEventBus.emitQAEventToQAA(QAEventSdkName.SDK_HIT_SENT,{ value: hitWithTimestamps });
}
