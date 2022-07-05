import { IFlagshipConfig } from '../config'
import { LogLevel } from '../enum'
import {
  EVENT_ACTION_API_ITEM,
  EVENT_CATEGORY_API_ITEM,
  SDK_APP,
  SDK_LANGUAGE,
  SDK_VERSION
} from '../enum/FlagshipConstant'
import { HitType } from '../enum/HitType'
import { logError } from '../utils/utils'
import { HitAbstract, IHitAbstract } from './HitAbstract'

export const ERROR_MESSAGE = 'event category and event action are required'
export const CATEGORY_ERROR =
    'The category value must be either EventCategory::ACTION_TRACKING or EventCategory::ACTION_TRACKING'
export const VALUE_FIELD_ERROR = 'value must be an integer and be >= 0'
export enum EventCategory {
    ACTION_TRACKING = 'Action Tracking',
    USER_ENGAGEMENT = 'User Engagement',
  }

export interface IMonitoring extends IHitAbstract{
    category: EventCategory
    action: string
    component?: string
    timestamp?: number
    stackVersion?: string
    level: LogLevel
    message: string
    technicalStack?: string
    data?: unknown
    subComponent: string
  }

export class Monitoring extends HitAbstract implements IMonitoring {
    private _category: EventCategory;
    private _action: string;
    private _custom? : Record<string, unknown>;
    private _component : string;
    private _timeStamp : number;
    private _stackVersion : string;
    private _level : LogLevel;
    private _message : string;
    private _technicalStack : string;
    private _subComponent : string;
    public get subComponent () : string {
      return this._subComponent
    }

    public set subComponent (v : string) {
      this._subComponent = v
    }

    private _data? : unknown;
    public get data () : unknown {
      return this._data
    }

    public set data (v : unknown) {
      this._data = v
    }

    public get technicalStack () : string {
      return this._technicalStack
    }

    public set technicalStack (v : string) {
      this._technicalStack = v
    }

    public get message () : string {
      return this._message
    }

    public set message (v : string) {
      this._message = v
    }

    public get level () : LogLevel {
      return this._level
    }

    public set level (v : LogLevel) {
      this._level = v
    }

    public get stackVersion () : string {
      return this._stackVersion
    }

    public set stackVersion (v : string) {
      this._stackVersion = v
    }

    public get timestamp () : number {
      return this._timeStamp
    }

    public set timestamp (v : number) {
      this._timeStamp = v
    }

    public get component () : string {
      return this._component
    }

    public set component (v : string) {
      this._component = v
    }

    public get custom () : Record<string, unknown>|undefined {
      return this._custom
    }

    public set custom (v : Record<string, unknown>|undefined) {
      this._custom = v
    }

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

    public constructor (param:Omit<IMonitoring & {config: IFlagshipConfig},
        'type'|'createdAt'|'category'>) {
      super({
        type: HitType.EVENT,
        userIp: param.userIp,
        screenResolution: param.screenResolution,
        locale: param.locale,
        sessionNumber: param.sessionNumber
      })
      const { message, action, level, config, visitorId, component, timestamp, stackVersion, technicalStack, subComponent, data } = param
      this.config = config
      this._category = EventCategory.ACTION_TRACKING
      this._action = action
      this._component = component || `Flagship SDK ${SDK_LANGUAGE.name}`
      this._timeStamp = timestamp || Date.now()
      this._stackVersion = stackVersion || SDK_VERSION
      this._level = level
      this._message = message
      this._technicalStack = technicalStack || SDK_LANGUAGE.name
      this.ds = SDK_APP
      this._subComponent = subComponent
      this.visitorId = visitorId || `${SDK_LANGUAGE.name}-${config.envId}`
      this._data = data
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public toApiKeys (): any {
      const apiKeys = super.toApiKeys()
      apiKeys[EVENT_CATEGORY_API_ITEM] = this.category
      apiKeys[EVENT_ACTION_API_ITEM] = this.action
      apiKeys.custom = {
        component: this.component,
        timestamp: this.timestamp,
        stackVersion: this.stackVersion,
        level: LogLevel[this.level],
        message: this.message,
        technicalStack: this.technicalStack,
        data: this.data
      }
      return apiKeys
    }

    public toObject ():Record<string, unknown> {
      return {
        ...super.toObject(),
        category: this.category,
        action: this.action,
        component: this.component,
        timestamp: this.timestamp,
        stackVersion: this.stackVersion,
        level: LogLevel[this.level],
        message: this.message,
        technicalStack: this.technicalStack,
        data: this.data
      }
    }

    public isReady (checkParent = true): boolean {
      return !!((!checkParent || super.isReady()) && this.category && this.action)
    }

    public getErrorMessage (): string {
      return ERROR_MESSAGE
    }
}
