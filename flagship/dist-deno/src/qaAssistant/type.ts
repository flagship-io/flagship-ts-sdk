import { FsVariationToForce, VisitorVariations } from '../types.ts';

/**
 * All events posted from iframe
 */
export enum MSG_NAME_FROM_IFRAME {
  QaAssistantClose = 'ABTASTY_QA_ASSISTANT_CLOSE',
  FsApplyForcedVariations = 'FS_APPLY_FORCED_VARIATIONS',
  FsResetForcedVariations = 'FS_RESET_FORCED_VARIATIONS',
  FsQaAssistantReady = 'FS_QA_ASSISTANT_READY',
  MinimizeQaAssistantClose = 'ABTASTY_QA_MINIMIZE_QA_ASSISTANT_CLOSE',
  FsTriggerRender = 'FS_TRIGGER_RENDER',
  QaAssistantPlatformChoiceLoaded = 'ABTASTY_QA_ASSISTANT_PLATFORM_CHOICE_LOADED'
}

export type FsApplyForcedVariations = {
  name: MSG_NAME_FROM_IFRAME.FsApplyForcedVariations;
  value: Record<string, FsVariationToForce>;
};

export type EventDataFromIframe =
  | {
      name:
        | MSG_NAME_FROM_IFRAME.QaAssistantClose
        | MSG_NAME_FROM_IFRAME.FsResetForcedVariations
        | MSG_NAME_FROM_IFRAME.FsQaAssistantReady
        | MSG_NAME_FROM_IFRAME.MinimizeQaAssistantClose
        | MSG_NAME_FROM_IFRAME.FsTriggerRender
        | MSG_NAME_FROM_IFRAME.QaAssistantPlatformChoiceLoaded;
    }
  | FsApplyForcedVariations;

/**
 * All events posted to iframe
 */
export enum MSG_NAME_TO_IFRAME {
  FsUpdateVisitorAllocatedVariation = 'FS_UPDATE_VISITOR_ALLOCATED_VARIATION',
  FsVisitorExposedVariation = 'FS_VISITOR_EXPOSED_VARIATION',
  FsHIT = 'FS_HIT',
}

export enum VisitorVariationUpdateParam {
  NewNavigation = 'newNavigation',
}


export type VisitorAllocatedVariations = {
  name:
    | MSG_NAME_TO_IFRAME.FsUpdateVisitorAllocatedVariation
    | MSG_NAME_TO_IFRAME.FsVisitorExposedVariation;
  value: Record<string, VisitorVariations>;
  param?: VisitorVariationUpdateParam

};

export type FsSendHit = {
  name: MSG_NAME_TO_IFRAME.FsHIT;
  value: Record<string, unknown>[];
};

export type EventDataToIframe = VisitorAllocatedVariations | FsSendHit;

export enum INTERNAL_EVENTS {
  FsTriggerRendering = 'FS_TRIGGER_RENDERING',
}
