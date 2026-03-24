import { IFlagshipConfig } from '../../config/IFlagshipConfig.ts';
import { VisitorVariationState } from '../../type.local.ts';
import { logDebugSprintf } from '../../utils/utils.ts';
import { QAEventQaAssistantName } from '../common/types.ts';
import { onQaAssistantReady } from './QaAssistantMessageAction.ts';
import { ABTastyQAEventBus } from './QAEventBus.ts';


function render(forcedReFetchFlags = false): void {
  globalThis.__abTastyOnTriggerRender__?.({ forcedReFetchFlags });
}

function removeForcedVariation(keys: string[], visitorVariationState: VisitorVariationState): void {
  const forcedVariations = { ...visitorVariationState.forcedVariations };
  keys.forEach((key) => {
    delete forcedVariations[key];
  });
  visitorVariationState.forcedVariations = forcedVariations;
}

function cleanupEventListeners(): void {
  globalThis.__abTastyOnQaAssistantReadyListener?.();
  globalThis.__abTastyOnQAApplyForcedVariationListener?.();
  globalThis.__abTastyOnQaApplyForcedAllocationListener?.();
  globalThis.__abTastyOnQaApplyForcedUnAllocationListener?.();
}

export function launchQaAssistant(
  config: IFlagshipConfig,
  visitorVariationState: VisitorVariationState
): void {
  cleanupEventListeners();
  visitorVariationState.shouldForceRender = false;

  globalThis.__abTastyOnQaAssistantReadyListener = ABTastyQAEventBus
    .onQAEventFromQAA(QAEventQaAssistantName.QA_READY, () => {

      onQaAssistantReady(visitorVariationState);
      logDebugSprintf(config, 'onQaAssistantReady',
        'QA Assistant is ready');
    });

  globalThis.__abTastyOnQAApplyForcedVariationListener = ABTastyQAEventBus
    .onQAEventFromQAA(QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS, (data) => {

      logDebugSprintf(config, 'onQaApplyForcedVariations',
        'Apply forced variations {0}', data.value);

      visitorVariationState.forcedVariations = {
        ...visitorVariationState.forcedVariations,
        ...data.value
      };
      render();
    });

  globalThis.__abTastyOnQaApplyForcedAllocationListener = ABTastyQAEventBus
    .onQAEventFromQAA(QAEventQaAssistantName.QA_APPLY_FORCED_ALLOCATION, (data) => {

      logDebugSprintf(config, 'onQaApplyForcedAllocation',
        'Apply forced allocations {0}', data.value);

      const variationsForcedAllocation = visitorVariationState.variationsForcedAllocation || {};
      const diffVariationKeys = Object.keys(variationsForcedAllocation)
        .filter((key) => !(key in data.value));

      if (diffVariationKeys.length > 0) {
        removeForcedVariation(diffVariationKeys, visitorVariationState);
      }

      visitorVariationState.shouldForceRender = true;
      visitorVariationState.variationsForcedAllocation = data.value;
      render(true);
    });

  globalThis.__abTastyOnQaApplyForcedUnAllocationListener = ABTastyQAEventBus
    .onQAEventFromQAA(QAEventQaAssistantName.QA_APPLY_FORCED_UNALLOCATION, (data) => {

      logDebugSprintf(config, 'onQaApplyForcedUnallocation',
        'Apply forced unallocations {0}', data.value);

      visitorVariationState.shouldForceRender = true;
      visitorVariationState.variationsForcedUnallocation = data.value;
      render(true);
    });
}
