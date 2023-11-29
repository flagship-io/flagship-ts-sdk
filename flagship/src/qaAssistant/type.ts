import { FsVariationToForce, VisitorVariations } from './../types'

declare global {
    interface Window {
        ABTastyQaAssistant?: Window;
        flagship?: {
            envId?: string
            forcedVariations?:Record<string, FsVariationToForce>
        }
    }
}

/**
 * All events posted from iframe
 */
export enum MSG_NAME_FROM_IFRAME {
    QaAssistantClose = 'ABTASTY_QA_ASSISTANT_CLOSE',
    FsApplyForcedVariations = 'FS_APPLY_FORCED_VARIATIONS',
}

export type FsApplyForcedVariations = {
    name: MSG_NAME_FROM_IFRAME.FsApplyForcedVariations;
    value: Record<string, FsVariationToForce>;
  };

export type EventDataFromIframe = {
    name: MSG_NAME_FROM_IFRAME.QaAssistantClose
}|FsApplyForcedVariations
/**
 * All events posted to iframe
 */
export enum MSG_NAME_TO_IFRAME {
    FsUpdateVisitorAllocatedVariation = 'FS_UPDATE_VISITOR_ALLOCATED_VARIATION',
    FsVisitorExposedVariation = 'FS_VISITOR_EXPOSED_VARIATION',
}

export type VisitorAllocatedVariations = {
    name: MSG_NAME_TO_IFRAME.FsUpdateVisitorAllocatedVariation|MSG_NAME_TO_IFRAME.FsVisitorExposedVariation
    value: Record<string, VisitorVariations>
};

export type EventDataToIframe = VisitorAllocatedVariations
