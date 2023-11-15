
declare global {
    interface Window {
        ABTastyQaAssistant?: Window;
        flagship?: {
            envId: string
        }
    }
}

export enum MSG_NAME_FROM_IFRAME {
    QA_ASSISTANT_IS_READY = 'QA_ASSISTANT_IS_READY'
}

export enum MSG_NAME_TO_IFRAME {
    FLAGSHIP_ENV_ID = 'FLAGSHIP_ENV_ID'
}

export type QaAssistantReady = {
    name: MSG_NAME_FROM_IFRAME
};

export type FsEnvId = {
    name: MSG_NAME_TO_IFRAME,
    value: string
};

export type EventDataFromIframe = QaAssistantReady

export type EventDataToIframe = FsEnvId
