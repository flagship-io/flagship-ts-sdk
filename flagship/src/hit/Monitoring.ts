import { IFlagshipConfig } from '../config'
import { LogLevel } from '../enum'
import {
  EVENT_ACTION_API_ITEM,
  EVENT_CATEGORY_API_ITEM,
  SDK_APP,
  SDK_LANGUAGE
} from '../enum/FlagshipConstant'
import { version as packageVersion } from '../sdkVersion'
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
    accountId?:string
    envId?:string
    timestamp?:string
    component?: string
    subComponent: string
    sdkVersion?:string
    sdkName?: string
    decisionApiVersion?:string
    selfHostedDecisionApiVersion?:string
    message: string
    configMode?: string
    configTimeout?:string
    httpUrl?:string
    httpCode?:string
    httpHeaders?:string
    httpRequestBody?:string
    httpResponseBody?:string
    visitorContext?:string
    visitorAssignations?:string
    visitorFlags?:string
    level: LogLevel

  }

export class Monitoring extends HitAbstract implements IMonitoring {
    private _category: EventCategory;
    private _action: string;
    private _accountId? : string;
    private _envId? : string;
    private _timestamp? : string;
    private _component? : string;
    private _subComponent : string;
    private _sdkVersion? : string;
    private _sdkName? : string;
    private _decisionApiVersion? : string;
    private _selfHostedDecisionApiVersion? : string;
    private _message : string;
    private _configMode? : string;
    private _configTimeout? : string;
    private _httpUrl? : string;
    private _httpCode? : string;
    private _httpHeaders? : string;
    private _httpRequestBody? : string;
    private _httpResponseBody? : string;
    private _visitorContext? : string;
    private _visitorAssignations? : string;
    private _visitorFlags? : string;
    private _level : LogLevel;

    public get level () : LogLevel {
      return this._level
    }

    public set level (v : LogLevel) {
      this._level = v
    }

    public get visitorFlags () : string|undefined {
      return this._visitorFlags
    }

    public set visitorFlags (v : string|undefined) {
      this._visitorFlags = v
    }

    public get visitorAssignations () : string|undefined {
      return this._visitorAssignations
    }

    public set visitorAssignations (v : string|undefined) {
      this._visitorAssignations = v
    }

    public get visitorContext () : string|undefined {
      return this._visitorContext
    }

    public set visitorContext (v : string|undefined) {
      this._visitorContext = v
    }

    public get httpResponseBody () : string|undefined {
      return this._httpResponseBody
    }

    public set httpResponseBody (v : string|undefined) {
      this._httpResponseBody = v
    }

    public get httpRequestBody () : string|undefined {
      return this._httpRequestBody
    }

    public set httpRequestBody (v : string|undefined) {
      this._httpRequestBody = v
    }

    public get httpHeaders () : string|undefined {
      return this._httpHeaders
    }

    public set httpHeaders (v : string|undefined) {
      this._httpHeaders = v
    }

    public get httpCode () : string|undefined {
      return this._httpCode
    }

    public set httpCode (v : string|undefined) {
      this._httpCode = v
    }

    public get httpUrl () : string|undefined {
      return this._httpUrl
    }

    public set httpUrl (v : string|undefined) {
      this._httpUrl = v
    }

    public get configTimeout () : string|undefined {
      return this._configTimeout
    }

    public set configTimeout (v : string|undefined) {
      this._configTimeout = v
    }

    public get configMode () : string|undefined {
      return this._configMode
    }

    public set configMode (v : string|undefined) {
      this._configMode = v
    }

    public get message () : string {
      return this._message
    }

    public set message (v : string) {
      this._message = v
    }

    public get selfHostedDecisionApiVersion () : string|undefined {
      return this._selfHostedDecisionApiVersion
    }

    public set selfHostedDecisionApiVersion (v : string|undefined) {
      this._selfHostedDecisionApiVersion = v
    }

    public get decisionApiVersion () : string|undefined {
      return this._decisionApiVersion
    }

    public set decisionApiVersion (v : string|undefined) {
      this._decisionApiVersion = v
    }

    public get sdkName () : string|undefined {
      return this._sdkName
    }

    public set sdkName (v : string|undefined) {
      this._sdkName = v
    }

    public get sdkVersion () : string|undefined {
      return this._sdkVersion
    }

    public set sdkVersion (v : string|undefined) {
      this._sdkVersion = v
    }

    public get subComponent () : string {
      return this._subComponent
    }

    public set subComponent (v : string) {
      this._subComponent = v
    }

    public get component () : string|undefined {
      return this._component
    }

    public set component (v : string|undefined) {
      this._component = v
    }

    public get timestamp () : string|undefined {
      return this._timestamp
    }

    public set timestamp (v : string|undefined) {
      this._timestamp = v
    }

    public get envId () : string|undefined {
      return this._envId
    }

    public set envId (v : string|undefined) {
      this._envId = v
    }

    public get accountId () : string|undefined {
      return this._accountId
    }

    public set accountId (v : string|undefined) {
      this._accountId = v
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
        type: 'MONITORING',
        userIp: param.userIp,
        screenResolution: param.screenResolution,
        locale: param.locale,
        sessionNumber: param.sessionNumber,
        visitorId: param.visitorId || '0',
        anonymousId: param.anonymousId
      })
      const {
        action, accountId, envId, timestamp, component, subComponent, sdkVersion, sdkName,
        decisionApiVersion, selfHostedDecisionApiVersion, message,
        configMode, configTimeout, httpUrl, httpCode, httpHeaders, httpRequestBody,
        httpResponseBody, visitorContext, visitorAssignations, visitorFlags, level, config
      } = param
      this.config = config
      this._category = 'monitoring' as EventCategory
      this._action = action
      this._accountId = accountId
      this.envId = envId || config.envId
      this._timestamp = timestamp || new Date().toISOString()
      this._component = component || `Flagship SDK ${SDK_LANGUAGE.name}`
      this._subComponent = subComponent
      this._sdkVersion = sdkVersion || packageVersion
      this._sdkName = sdkName || SDK_LANGUAGE.name
      this._decisionApiVersion = decisionApiVersion
      this._selfHostedDecisionApiVersion = selfHostedDecisionApiVersion
      this._message = message
      this._configMode = configMode || config.decisionMode
      this._configTimeout = configTimeout || config.timeout?.toString()
      this._httpUrl = httpUrl
      this._httpCode = httpCode
      this._httpHeaders = httpHeaders
      this._httpRequestBody = httpRequestBody
      this._httpResponseBody = httpResponseBody
      this._visitorContext = visitorContext
      this._visitorAssignations = visitorAssignations
      this.visitorFlags = visitorFlags
      this._level = level
      this.ds = SDK_APP
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, complexity
    public toApiKeys (): any {
      const apiKeys = super.toApiKeys()
      apiKeys[EVENT_CATEGORY_API_ITEM] = this.category
      apiKeys[EVENT_ACTION_API_ITEM] = this.action
      apiKeys.cv = {
        0: `accountId, ${this.accountId || ''}`,
        1: `envId, ${this.envId || ''}`,
        2: `timestamp, ${this.timestamp || ''}`,
        3: `component, ${this.component || ''}`,
        4: `subComponent, ${this.subComponent || ''}`,
        5: `level, ${LogLevel[this.level] || ''}`,
        6: `sdkVersion, ${this.sdkVersion || ''}`,
        7: `sdkName, ${this.sdkName || ''}`,
        8: `decisionApiVersion, ${this.decisionApiVersion || ''} `,
        9: `selfHostedDecisionApiVersion, ${this.selfHostedDecisionApiVersion || ''}`,
        10: `message, ${this.message || ''}`,
        30: `config.mode, ${this.configMode || ''}`,
        31: `config.timeout, ${this.configTimeout || ''}`,
        50: `http.url, ${this.httpUrl || ''}`,
        51: `http.code, ${this.httpCode || ''}`,
        52: `http.headers, ${this.httpHeaders || ''}`,
        53: `http.requestBody, ${this.httpRequestBody || ''}`,
        54: `http.responseBody, ${this.httpResponseBody || ''}`,
        60: `visitor.context, ${this.visitorContext || ''}`,
        61: `visitor.assignations, ${this.visitorAssignations || ''}`,
        62: `visitor.flags, ${this.visitorFlags || ''}`
      }
      return apiKeys
    }

    public toObject ():Record<string, unknown> {
      return {
        ...super.toObject(),
        category: EventCategory,
        action: this.action,
        accountId: this.accountId,
        envId: this.envId,
        timestamp: this.timestamp,
        component: this.component,
        subComponent: this.subComponent,
        sdkVersion: this.sdkVersion,
        sdkName: this.sdkName,
        decisionApiVersion: this.decisionApiVersion,
        selfHostedDecisionApiVersion: this.selfHostedDecisionApiVersion,
        message: this.message,
        configMode: this.configMode,
        configTimeout: this.configTimeout,
        httpUrl: this.httpUrl,
        httpCode: this.httpCode,
        httpHeaders: this.httpHeaders,
        httpRequestBody: this.httpRequestBody,
        httpResponseBody: this.httpResponseBody,
        visitorContext: this.visitorContext,
        visitorAssignations: this.visitorAssignations,
        visitorFlags: this.visitorFlags,
        level: this.level
      }
    }

    public isReady (checkParent = true): boolean {
      return !!((!checkParent || super.isReady()) && this.category && this.action)
    }

    public getErrorMessage (): string {
      return ERROR_MESSAGE
    }
}
