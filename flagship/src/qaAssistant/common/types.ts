import { SdkInfoType, VisitorData } from '../../type.local';
import { FsVariationToForce, VisitorVariations } from '../../types';

export enum VisitorVariationUpdateParam {
  NewNavigation = 'newNavigation',
}

export enum QAEventSdkName{
    SDK_ALLOCATED_VARIATIONS = 'sdk:allocated-variations',
    SDK_EXPOSED_VARIATIONS = 'sdk:exposed-variations',
    SDK_HIT_SENT = 'sdk:hit-sent',
}

export enum QAEventQaAssistantName{
    QA_READY = 'qa:ready',
    QA_CLOSE = 'qa:close',
    QA_RESET_FORCED_VARIATIONS = 'qa:reset-forced-variations',
    QA_MINIMIZE_QA_ASSISTANT = 'qa:minimize-qa-assistant',
    QA_TRIGGER_RENDER = 'qa:trigger-render',
    QA_APPLY_FORCED_VARIATIONS = 'qa:apply-forced-variations',
    QA_APPLY_FORCED_ALLOCATION = 'qa:apply-forced-allocation',
    QA_APPLY_FORCED_UNALLOCATION = 'qa:apply-forced-unallocation',
    QA_REMOVE_FORCED_VARIATION = 'qa:remove-forced-variation',
}

/**
 * Events that QA Assistant sends (QAA → SDK)
 */
export type QAAToSDKEvents = {
  [QAEventQaAssistantName.QA_READY]: undefined;
  [QAEventQaAssistantName.QA_CLOSE]: undefined;
  [QAEventQaAssistantName.QA_RESET_FORCED_VARIATIONS]: undefined;
  [QAEventQaAssistantName.QA_MINIMIZE_QA_ASSISTANT]: undefined;
  [QAEventQaAssistantName.QA_TRIGGER_RENDER]: undefined;
  [QAEventQaAssistantName.QA_APPLY_FORCED_VARIATIONS]: {value: Record<string, FsVariationToForce>};
  [QAEventQaAssistantName.QA_APPLY_FORCED_ALLOCATION]: {value: Record<string, FsVariationToForce>};
  [QAEventQaAssistantName.QA_APPLY_FORCED_UNALLOCATION]: {value: Record<string, FsVariationToForce>};
  [QAEventQaAssistantName.QA_REMOVE_FORCED_VARIATION]: {value: string[]};
};

/**
 * Events that SDK sends (SDK → QAA)
 */
export type SDKToQAAEvents = {
  [QAEventSdkName.SDK_ALLOCATED_VARIATIONS]: {
    value: Record<string, VisitorVariations>;
    param?: VisitorVariationUpdateParam;
    visitorData?: VisitorData;
    sdkInfo?:SdkInfoType }
  [QAEventSdkName.SDK_EXPOSED_VARIATIONS]: {
    value: Record<string, VisitorVariations>;
    param?: VisitorVariationUpdateParam;
    visitorData?: VisitorData;
    sdkInfo?:SdkInfoType };
  [QAEventSdkName.SDK_HIT_SENT]: {value: Record<string, unknown>[]}
};


export type QAEventMap = QAAToSDKEvents & SDKToQAAEvents;
