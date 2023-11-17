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
    QA_ASSISTANT_IS_READY = 'QA_ASSISTANT_IS_READY',

}

export enum MSG_NAME_TO_IFRAME {
    FsUpdateVisitorAllocatedVariation = 'FS_UPDATE_VISITOR_ALLOCATED_VARIATION'
}

export type VisitorAllocatedVariations = {
    name: MSG_NAME_TO_IFRAME
    value: Record<string, VisitorVariations>
};

export type EventDataFromIframe = {
    name: MSG_NAME_FROM_IFRAME
}

export type EventDataToIframe = VisitorAllocatedVariations
