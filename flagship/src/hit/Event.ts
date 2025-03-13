import {
  EVENT_ACTION_API_ITEM,
  EVENT_CATEGORY_API_ITEM,
  EVENT_LABEL_API_ITEM,
  EVENT_VALUE_API_ITEM
} from '../enum/FlagshipConstant'
import { HitType } from '../enum/HitType'
import { logError } from '../utils/utils'
import { EventCategory } from './EventCategory'
import { HitAbstract, IHitAbstract } from './HitAbstract'

export const ERROR_MESSAGE = 'event category and event action are required'
export const CATEGORY_ERROR =
  'The category value must be either EventCategory::ACTION_TRACKING or EventCategory::ACTION_TRACKING'
export const VALUE_FIELD_ERROR = 'value must be an integer and be >= 0'

export interface IEvent extends IHitAbstract{
  category: EventCategory
  action: string
  label?: string
  value?: number
}

export class Event extends HitAbstract implements IEvent {
  private _category!: EventCategory
  private _action!: string
  private _label!: string
  private _value!: number

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

  public get label (): string {
    return this._label
  }

  /**
   * Specify additional description of event.
   */
  public set label (v: string) {
    if (!this.isNotEmptyString(v, 'label')) {
      return
    }
    this._label = v
  }

  public get value (): number {
    return this._value
  }

  /**
   * Specify the monetary value associated with an event
   * (e.g. you earn 10 to 100 euros depending on the quality of lead generated).
   *
   * <br/> NOTE: this value must be non-negative.
   */
  public set value (v: number) {
    if (!Number.isInteger(v) || v < 0) {
      logError(this.config, VALUE_FIELD_ERROR, 'value')
      return
    }
    this._value = v
  }

  public constructor (param:Omit<IEvent, 'type'|'createdAt'|'visitorInstanceId'|'traffic'>) {
    super({
      type: HitType.EVENT,
      userIp: param.userIp,
      screenResolution: param.screenResolution,
      locale: param.locale,
      sessionNumber: param.sessionNumber,
      visitorId: param.visitorId,
      anonymousId: param.anonymousId,
      qaMode: param.qaMode,
      isActionTrackingHit: param.isActionTrackingHit
    })
    const { category, action, label, value } = param
    this.category = category
    this.action = action
    if (label) {
      this.label = label
    }
    if (value) {
      this.value = value
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toApiKeys (): any {
    const apiKeys = super.toApiKeys()
    apiKeys[EVENT_CATEGORY_API_ITEM] = this.category
    apiKeys[EVENT_ACTION_API_ITEM] = this.action

    if (this.label) {
      apiKeys[EVENT_LABEL_API_ITEM] = this.label
    }

    if (this.value) {
      apiKeys[EVENT_VALUE_API_ITEM] = this.value
    }
    return apiKeys
  }

  public toObject ():Record<string, unknown> {
    return {
      ...super.toObject(),
      category: this.category,
      action: this.action,
      label: this.label,
      value: this.value
    }
  }

  public isReady (checkParent = true): boolean {
    return !!((!checkParent || super.isReady()) && this.category && this.action)
  }

  public getErrorMessage (): string {
    return ERROR_MESSAGE
  }
}
