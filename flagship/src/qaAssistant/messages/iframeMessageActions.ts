import { sendVisitorAllocatedVariations, sendVisitorExposedVariations } from './index';
import { FS_FORCED_VARIATIONS, FS_IS_QA_MODE_ENABLED, FS_QA_ASSISTANT_SCRIPT_TAG_ID, FS_VARIATIONS_FORCED_ALLOCATION, FS_VARIATIONS_FORCED_UNALLOCATION, SDK_INFO } from '../../enum/FlagshipConstant';
import { FsVariationToForce } from '../../types';
import { EventDataFromIframe, INTERNAL_EVENTS } from '../type';
import { IFlagshipConfig } from '../../config/IFlagshipConfig';
import { VisitorVariationState } from '../../type.local';

export function onQaAssistantReady(visitorVariationState: VisitorVariationState):void {

  if (visitorVariationState.visitorVariations) {
    sendVisitorAllocatedVariations(visitorVariationState);
  }
  if (visitorVariationState.exposedVariations) {
    sendVisitorExposedVariations(visitorVariationState);
  }
}

export function render(forcedReFetchFlags = false):void {
  if (SDK_INFO.name === 'TypeScript') {
    window.location.reload();
  }
  const triggerRenderEvent = new CustomEvent<{ forcedReFetchFlags: boolean }>(INTERNAL_EVENTS.FsTriggerRendering, { detail: { forcedReFetchFlags } });
  window.dispatchEvent(triggerRenderEvent);
}

export function onQaAssistantClose({ config, func, visitorVariationState }:{
  config:IFlagshipConfig,
  func?: (event: MessageEvent<EventDataFromIframe>) => void,
  visitorVariationState: VisitorVariationState

}):void {
  config.isQAModeEnabled = false;
  sessionStorage.removeItem(FS_IS_QA_MODE_ENABLED);
  if (func) {
    window.removeEventListener('message', func);
  }
  document.getElementById(FS_QA_ASSISTANT_SCRIPT_TAG_ID)?.remove();
  visitorVariationState.forcedVariations = {};
  render();
}

export function onApplyForcedVariations({ value,visitorVariationState }:{
  value:Record<string, FsVariationToForce>,
  visitorVariationState: VisitorVariationState
}):void {
  const sessionForcedVariations = sessionStorage.getItem(FS_FORCED_VARIATIONS);
  let forcedVariations: Record<string, FsVariationToForce> = {};
  try {
    forcedVariations = JSON.parse(sessionForcedVariations || '{}');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error parsing sessionForcedVariations', error);
  }
  forcedVariations = {
    ...forcedVariations,
    ...value
  };
  sessionStorage.setItem(FS_FORCED_VARIATIONS, JSON.stringify(forcedVariations));
  visitorVariationState.forcedVariations = forcedVariations;
  render();
}

export function onResetForcedVariations(visitorVariationState: VisitorVariationState):void {
  sessionStorage.removeItem(FS_FORCED_VARIATIONS);
  visitorVariationState.forcedVariations = {};
  render();
}

export function onRemoveForcedVariation({ value, visitorVariationState }:{
  value:Record<string, FsVariationToForce>,
  visitorVariationState: VisitorVariationState
}):void {
  const sessionForcedVariations = sessionStorage.getItem(FS_FORCED_VARIATIONS);
  let forcedVariations: Record<string, FsVariationToForce> = {};
  try {
    forcedVariations = JSON.parse(sessionForcedVariations || '{}');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error parsing sessionForcedVariations', error);
  }

  Object.keys(value).forEach((key) => {
    delete forcedVariations[key];
  });

  sessionStorage.setItem(FS_FORCED_VARIATIONS, JSON.stringify(forcedVariations));
  visitorVariationState.forcedVariations = forcedVariations;
  render();
}

export function onVariationsForcedAllocation({ value, visitorVariationState }:{
  value:Record<string, FsVariationToForce>,
  visitorVariationState: VisitorVariationState
}):void {
  sessionStorage.setItem(FS_VARIATIONS_FORCED_ALLOCATION, JSON.stringify(value));
  visitorVariationState.variationsForcedAllocation = value;
  visitorVariationState.shouldForceRender = true;
  render(true);
}

export function onVariationsForcedUnallocation({ value, visitorVariationState }:{
  value:Record<string, FsVariationToForce>,
  visitorVariationState: VisitorVariationState
}):void {
  sessionStorage.setItem(FS_VARIATIONS_FORCED_UNALLOCATION, JSON.stringify(value));
  visitorVariationState.variationsForcedUnallocation = value;
  visitorVariationState.shouldForceRender = true;
  render(true);
}
