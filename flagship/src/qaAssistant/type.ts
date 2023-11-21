import { VisitorVariations } from './../types'

declare global {
    interface Window {
        ABTastyQaAssistant?: Window;
        flagship?: {
            envId: string
        }
    }
}

export enum MSG_NAME_FROM_IFRAME {
    QaAssistantClose = 'ABTASTY_QA_ASSISTANT_CLOSE'

}

export enum MSG_NAME_TO_IFRAME {
    FsUpdateVisitorAllocatedVariation = 'FS_UPDATE_VISITOR_ALLOCATED_VARIATION',
    FsVisitorExposedVariation = 'FS_VISITOR_EXPOSED_VARIATION',
}

export type VisitorAllocatedVariations = {
    name: MSG_NAME_TO_IFRAME
    value: Record<string, VisitorVariations>
};

export type EventDataFromIframe = {
    name: MSG_NAME_FROM_IFRAME
}

export type EventDataToIframe = VisitorAllocatedVariations
