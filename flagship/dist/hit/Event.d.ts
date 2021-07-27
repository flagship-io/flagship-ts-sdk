import { HitAbstract, IHitAbstract } from './HitAbstract';
export declare const ERROR_MESSAGE = "event category and event action are required";
export declare const CATEGORY_ERROR = "The category value must be either EventCategory::ACTION_TRACKING or EventCategory::ACTION_TRACKING";
export declare enum EventCategory {
    ACTION_TRACKING = "ACTION_TRACKING",
    USER_ENGAGEMENT = "USER_ENGAGEMENT"
}
export interface IEvent extends IHitAbstract {
    category: EventCategory;
    action: string;
    eventLabel?: string;
    eventValue?: number;
}
export declare class Event extends HitAbstract implements IEvent {
    private _category;
    private _action;
    private _eventLabel;
    private _eventValue;
    get category(): EventCategory;
    /**
     * Specify Action Tracking or User Engagement.
     */
    set category(v: EventCategory);
    get action(): string;
    /**
     * Specify Event name that will also serve as the KPI
     * that you will have inside your reporting
     */
    set action(v: string);
    get eventLabel(): string;
    /**
     * Specify additional description of event.
     */
    set eventLabel(v: string);
    get eventValue(): number;
    /**
     * Specify the monetary value associated with an event
     * (e.g. you earn 10 to 100 euros depending on the quality of lead generated).
     *
     * <br/> NOTE: this value must be non-negative.
     */
    set eventValue(v: number);
    constructor(event: Omit<IEvent, 'type'>);
    toApiKeys(): any;
    isReady(): boolean;
    getErrorMessage(): string;
}
