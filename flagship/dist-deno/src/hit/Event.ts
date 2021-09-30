import {
  EVENT_ACTION_API_ITEM,
  EVENT_CATEGORY_API_ITEM,
  EVENT_LABEL_API_ITEM,
  EVENT_VALUE_API_ITEM
} from '../enum/FlagshipConstant.ts'
import { HitType } from '../enum/HitType.ts'
import { logError } from '../utils/utils.ts'
import { HitAbstract, IHitAbstract } from './HitAbstract.ts'

export const ERROR_MESSAGE = 'event category and event action are required'
export const CATEGORY_ERROR =
  'The category value must be either EventCategory::ACTION_TRACKING or EventCategory::ACTION_TRACKING'

export enum EventCategory {
  ACTION_TRACKING = 'ACTION TRACKING',
  USER_ENGAGEMENT = 'USER ENGAGEMENT',
}

export interface IEvent extends IHitAbstract{
  category: EventCategory
  action: string
  eventLabel?: string
  eventValue?: number
}

export class Event extends HitAbstract implements IEvent {
  private _category!: EventCategory;
  private _action!: string;
  private _eventLabel!: string;
  private _eventValue!: number;

  public get category (): EventCategory {
    return this._category
  }

  /**
   * Specify Action Tracking or User Engagement.
   */
  public set category (v: EventCategory) {
    if (!(Object.values(EventCategory).includes(v))) {
      logError(this.config, CATEGORY_ERROR, 'category')
      return
    }
    this._category = v
  }

  public get action (): string {
    return this._action
  }

  /**
   * Specify Event name that will also serve as the KPI
   * that you will have inside your reporting
   */
  public set action (v: string) {
    if (!this.isNotEmptyString(v, 'action')) {
      return
    }
    this._action = v
  }

  public get eventLabel (): string {
    return this._eventLabel
  }

  /**
   * Specify additional description of event.
   */
  public set eventLabel (v: string) {
    if (!this.isNotEmptyString(v, 'eventLabel')) {
      return
    }
    this._eventLabel = v
  }

  public get eventValue (): number {
    return this._eventValue
  }

  /**
   * Specify the monetary value associated with an event
   * (e.g. you earn 10 to 100 euros depending on the quality of lead generated).
   *
   * <br/> NOTE: this value must be non-negative.
   */
  public set eventValue (v: number) {
    if (!this.isNumeric(v, 'eventValue')) {
      return
    }
    this._eventValue = v
  }

  public constructor (event:Omit<IEvent, 'type'>) {
    super(HitType.EVENT)
    const { category, action, eventLabel, eventValue } = event
    this.category = category
    this.action = action
    if (eventLabel) {
      this.eventLabel = eventLabel
    }
    if (eventValue) {
      this.eventValue = eventValue
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toApiKeys (): any {
    const apiKeys = super.toApiKeys()
    apiKeys[EVENT_CATEGORY_API_ITEM] = this.category
    apiKeys[EVENT_ACTION_API_ITEM] = this.action

    if (this.eventLabel) {
      apiKeys[EVENT_LABEL_API_ITEM] = this.eventLabel
    }

    if (this.eventValue) {
      apiKeys[EVENT_VALUE_API_ITEM] = this.eventValue
    }
    return apiKeys
  }

  public isReady (): boolean {
    return !!(super.isReady() && this.category && this.action)
  }

  public getErrorMessage (): string {
    return ERROR_MESSAGE
  }
}
