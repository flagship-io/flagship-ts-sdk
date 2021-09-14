import { Modification } from '../model/Modification'
import {
  CONTEXT_NULL_ERROR,
  CONTEXT_PARAM_ERROR,
  GET_MODIFICATION_CAST_ERROR,
  GET_MODIFICATION_ERROR,
  GET_MODIFICATION_KEY_ERROR,
  GET_MODIFICATION_MISSING_ERROR,
  HitType,
  PANIC_MODE_ERROR,
  PROCESS_ACTIVE_MODIFICATION,
  PROCESS_GET_ALL_MODIFICATION,
  PROCESS_GET_MODIFICATION,
  PROCESS_GET_MODIFICATION_INFO,
  PROCESS_MODIFICATIONS_FOR_CAMPAIGN,
  PROCESS_SEND_HIT,
  PROCESS_SYNCHRONIZED_MODIFICATION,
  PROCESS_UPDATE_CONTEXT,
  SDK_APP,
  TRACKER_MANAGER_MISSING_ERROR,
  VISITOR_ID_ERROR
} from '../enum/index'
import { logError, sprintf } from '../utils/utils'
import { Event, HitAbstract, IPage, Item, Page, Transaction, IScreen, Screen } from '../hit/index'
import { IConfigManager, IFlagshipConfig } from '../config/index'
import { IEvent } from '../hit/Event'
import { IItem } from '../hit/Item'
import { ITransaction } from '../hit/Transaction'
import { modificationsRequested, primitive } from '../types'
import { CampaignDTO } from '../decision/api/models'
import { EventEmitter } from '../nodeDeps'

export const TYPE_HIT_REQUIRED_ERROR = 'property type is required and must '

export class Visitor extends EventEmitter {
  private _visitorId!: string;
  private _context: Record<string, primitive>;
  private _modifications: Map<string, Modification>;
  private _configManager: IConfigManager;
  private _config: IFlagshipConfig;
  private _campaigns!: CampaignDTO[]

  constructor (
    visitorId: string|null,
    context: Record<string, primitive>,
    configManager: IConfigManager
  ) {
    super()
    this.visitorId = visitorId || this.createVisitorId()
    this._modifications = new Map<string, Modification>()
    this._configManager = configManager
    this._config = configManager.config
    this._context = {}
    this.updateContext(context)
  }

  private createVisitorId (): string {
    const now = new Date()
    const random = Math.floor(Math.random() * (99999 - 10000) + 10000)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const twoDigits = (value: any): any => (value.toString().length === 1 ? `0${value}` : value)
    return `${now.getFullYear()}${twoDigits(now.getMonth() + 1)}${twoDigits(now.getDate())}${twoDigits(now.getHours())}${twoDigits(
        now.getMinutes()
    )}${random}`
  }

  public get visitorId (): string {
    return this._visitorId
  }

  public set visitorId (v: string) {
    if (!v || typeof v !== 'string') {
      logError(this.config, VISITOR_ID_ERROR, 'VISITOR ID')
      return
    }
    this._visitorId = v
  }

  public get context (): Record<string, primitive> {
    return this._context
  }

  /**
   * Clear the current context and set a new context value
   */
  public set context (v: Record<string, primitive>) {
    this._context = {}
    this.updateContext(v)
  }

  public get modifications (): Map<string, Modification> {
    return this._modifications
  }

  get configManager (): IConfigManager {
    return this._configManager
  }

  public get config (): IFlagshipConfig {
    return this._config
  }

  /**
   * Update the visitor context values, matching the given keys, used for targeting.
   *
   * A new context value associated with this key will be created if there is no previous matching value.
   *
   * Context keys must be String, and values types must be one of the following : Number, Boolean, String.
   * @param {Record<string, primitive>} context : collection of keys, values.
   */
  public updateContext (
    context: Record<string, primitive>
  ): void {
    if (!context) {
      logError(this.config, CONTEXT_NULL_ERROR, PROCESS_UPDATE_CONTEXT)
      return
    }

    for (const key in context) {
      const value = context[key]
      this.updateContextKeyValue(key, value)
    }
  }

  /**
   *  Update the visitor context values, matching the given keys, used for targeting.
   *
   * A new context value associated with this key will be created if there is no previous matching value.
   * Context key must be String, and value type must be one of the following : Number, Boolean, String.
   * @param {string} key : context key.
   * @param {primitive} value : context value.
   */
  public updateContextKeyValue (
    key: string,
    value: primitive
  ): void {
    const valueType = typeof value
    if (
      typeof key !== 'string' ||
      key === '' ||
      (valueType !== 'string' && valueType !== 'number' && valueType !== 'boolean')
    ) {
      logError(
        this.config,
        sprintf(CONTEXT_PARAM_ERROR, key),
        PROCESS_UPDATE_CONTEXT
      )
      return
    }
    this._context[key] = value
  }

  /**
   * clear the actual visitor context
   */
  public clearContext (): void {
    this._context = {}
  }

  /**
   * isOnPanicMode
   */
  private isOnPanicMode (functionName: string) {
    const check = this.configManager.decisionManager.isPanic()
    if (check) {
      logError(
        this.config,
        sprintf(PANIC_MODE_ERROR, functionName),
        functionName
      )
    }
    return check
  }

  /**
   * Retrieve a modification value by its key. If no modification match the given
   * key or if the stored value type and default value type do not match, default value will be returned.
   * @param {string} key : key associated to the modification.
   * @param {T} defaultValue : default value to return.
   * @param {boolean} activate : Set this parameter to true to automatically report on our server that the current visitor has seen this modification. It is possible to call activateModification() later.
   */
  public getModification<T> (params: modificationsRequested<T>, activateAll? : boolean): Promise<T>
  public getModification<T> (params: modificationsRequested<T>[], activateAll? : boolean): Promise<T[]>
  public getModification<T> (params: modificationsRequested<T>| modificationsRequested<T>[], activateAll? : boolean): Promise<T|T[]> {
    return Promise.resolve(
      this.getModificationSync(params, activateAll)
    )
  }

  private checkAndGetModification<T> (params:modificationsRequested<T>, activateAll?:boolean) :T {
    const { key, defaultValue, activate } = params
    if (!key || typeof key !== 'string') {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_KEY_ERROR, key),
        PROCESS_GET_MODIFICATION
      )
      return defaultValue
    }

    const modification = this._modifications.get(key)
    if (!modification) {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_MISSING_ERROR, key),
        PROCESS_GET_MODIFICATION
      )
      return defaultValue
    }

    const castError = () => {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_CAST_ERROR, key),
        PROCESS_GET_MODIFICATION
      )

      if (!modification.value && (activate || activateAll)) {
        this.activateModificationSync(key)
      }
    }

    if (
      typeof modification.value === 'object' &&
      typeof defaultValue === 'object' &&
      Array.isArray(modification.value) !== Array.isArray(defaultValue)
    ) {
      castError()
      return defaultValue
    }

    if (typeof modification.value !== typeof defaultValue) {
      castError()
      return defaultValue
    }

    if (activate || activateAll) {
      this.activateModification(key)
    }

    return modification.value
  }

  /**
   * Retrieve a modification value by its key. If no modification match the given
   * key or if the stored value type and default value type do not match, default value will be returned.
   * @param {string} key key associated to the modification.
   * @param {T} defaultValue default value to return.
   * @param {boolean} activate Set this parameter to true to automatically report on our server that the current visitor has seen this modification. It is possible to call activateModification() later.
   */
  public getModificationSync<T> (params: modificationsRequested<T>, activateAll? : boolean): T
  public getModificationSync<T> (params: modificationsRequested<T>[], activateAll? : boolean): T[]
  public getModificationSync<T> (params: modificationsRequested<T>| modificationsRequested<T>[], activateAll? : boolean): T|T[]
  public getModificationSync<T> (params: modificationsRequested<T>| modificationsRequested<T>[], activateAll?:boolean): T|T[] {
    if (this.isOnPanicMode(PROCESS_GET_MODIFICATION)) {
      if (Array.isArray(params)) {
        return params.map(item => item.defaultValue)
      }
      return params.defaultValue
    }

    if (Array.isArray(params)) {
      return params.map(item => {
        return this.checkAndGetModification(item, activateAll)
      })
    }
    return this.checkAndGetModification(params, activateAll)
  }

  /**
   * returns a Promise<object> containing all the data for all the campaigns associated with the current visitor.
   *@deprecated
   */
  public getAllModifications (activate = false): Promise<{
    visitorId: string;
    campaigns: CampaignDTO[];
    }>|null {
    if (this.isOnPanicMode(PROCESS_GET_ALL_MODIFICATION)) {
      return null
    }
    if (activate) {
      this.modifications.forEach((_, key) => {
        this.activateModification(key)
      })
    }
    return Promise.resolve({
      visitorId: this.visitorId,
      campaigns: this._campaigns
    })
  }

  /**
   * Get data for a specific campaign.
   * @param campaignId Identifies the campaign whose modifications you want to retrieve.
   * @param activate
   * @deprecated
   * @returns
   */
  public getModificationsForCampaign (campaignId:string, activate = false):Promise<{
    visitorId: string;
    campaigns: CampaignDTO[];
    }>|null {
    if (this.isOnPanicMode(PROCESS_MODIFICATIONS_FOR_CAMPAIGN)) {
      return null
    }

    if (activate) {
      this.modifications.forEach(value => {
        if (value.campaignId === campaignId) {
          this.activateModification(value.key)
        }
      })
    }

    return Promise.resolve({
      visitorId: this.visitorId,
      campaigns: this._campaigns.filter(x => x.id === campaignId)
    })
  }

  /**
   * Get the campaign modification information value matching the given key.
   * @param {string} key : key which identify the modification.
   * @returns {Modification | null}
   */
  public getModificationInfo (key: string): Promise<Modification | null> {
    return Promise.resolve(this.getModificationInfoSync(key))
  }

  /**
   * Get the campaign modification information value matching the given key.
   * @param {string} key : key which identify the modification.
   * @returns {Modification | null}
   */
  public getModificationInfoSync (key: string): Modification | null {
    if (this.isOnPanicMode(PROCESS_GET_MODIFICATION_INFO)) {
      return null
    }

    if (!key || typeof key !== 'string') {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_KEY_ERROR, key),
        PROCESS_GET_MODIFICATION_INFO
      )
      return null
    }

    const modification = this.modifications.get(key)

    if (!modification) {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_ERROR, key),
        PROCESS_GET_MODIFICATION_INFO
      )
      return null
    }

    return modification
  }

  /**
   * This function calls the decision api and update all the campaigns modifications
   * from the server according to the visitor context.
   */
  public async synchronizeModifications (): Promise<void> {
    return new Promise((resolve) => {
      this.configManager.decisionManager.getCampaignsAsync(this)
        .then(campaigns => {
          this._campaigns = campaigns
          this._modifications = this.configManager.decisionManager.getModifications(this._campaigns)
          this.emit('ready')
          resolve()
        })
        .catch(error => {
          this.emit('ready', error)
          logError(this.config, error.message || error, PROCESS_SYNCHRONIZED_MODIFICATION)
          resolve()
        })
    })
  }

  private hasTrackingManager (process: string): boolean {
    const check = this.configManager.trackingManager
    if (!check) {
      logError(this.config, sprintf(TRACKER_MANAGER_MISSING_ERROR), process)
    }
    return !!check
  }

  /**
   * Report this user has seen this modification.
   * @param key : key which identify the modification to activate.
   */
  public activateModification (key: string): Promise<void>
  /**
    * Report this user has seen these modifications.
    * @deprecated use ["key1","key2",...] instead of
    * @param {Array<{ key: string }>} keys keys which identify the modifications to activate.
    */
  public activateModification (keys: Array<{ key: string }>): Promise<void>
  /**
    * Report this user has seen these modifications.
    * @param keys  keys which identify the modifications to activate.
    */
  public activateModification (keys: Array<string>):Promise<void>

  public activateModification (params: string | Array<{ key: string }> | Array<string>): Promise<void> {
    return Promise.resolve(this.activateModificationSync(params))
  }

  private activate (key: string) {
    const modification = this.modifications.get(key)

    if (!modification) {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_ERROR, key),
        PROCESS_ACTIVE_MODIFICATION
      )
      return
    }

    if (!this.hasTrackingManager(PROCESS_ACTIVE_MODIFICATION)) {
      return
    }

    this.configManager.trackingManager
      .sendActive(this, modification)
      .catch((error) => {
        logError(this.config, error.message || error, PROCESS_ACTIVE_MODIFICATION)
      })
  }

  /**
   * Report this user has seen this modification.
   * @param key : key which identify the modification to activate.
   */
  public activateModificationSync (key: string): void
  /**
   * Report this user has seen these modifications.
   * @deprecated use ["key1","key2",...] instead of
   * @param {Array<{ key: string }>} keys keys which identify the modifications to activate.
   */
  public activateModificationSync (keys: Array<{ key: string }>): void
  /**
   * Report this user has seen these modifications.
   * @param keys  keys which identify the modifications to activate.
   */
  public activateModificationSync (keys: Array<string>): void
  public activateModificationSync (params: string | Array<{ key: string }> | Array<string>):void
  public activateModificationSync (params: string | Array<{ key: string }> | Array<string>): void {
    if (this.isOnPanicMode(PROCESS_ACTIVE_MODIFICATION)) {
      return
    }

    if (!params || (typeof params !== 'string' && !Array.isArray(params))) {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_KEY_ERROR, params),
        PROCESS_ACTIVE_MODIFICATION
      )
      return
    }

    if (typeof params === 'string') {
      this.activate(params)
    } else if (Array.isArray(params)) {
      params.forEach((item) => {
        if (typeof item === 'string') {
          this.activate(item)
        } else this.activate(item.key)
      })
    }
  }

  /**
   * Send a Hit to Flagship servers for reporting.
   * @param hit
   */
  public sendHit (hit:HitAbstract): Promise<void>
  public sendHit (hit:Array<HitAbstract>): Promise<void>
  public sendHit (hit:IPage|IScreen|IEvent|IItem|ITransaction): Promise<void>
  public sendHit (hit:Array<IPage|IScreen|IEvent|IItem|ITransaction>): Promise<void>
  public sendHit (hit:IPage|IScreen|IEvent|IItem|ITransaction|
    Array<IPage|IScreen|IEvent|IItem|ITransaction>|
    HitAbstract|HitAbstract[]): Promise<void> {
    return Promise.resolve(this.sendHitSync(hit))
  }

  private getHit (hit:IPage|IScreen|IEvent|IItem|ITransaction) {
    let newHit = null

    switch (hit.type.toUpperCase()) {
      case HitType.EVENT:
        newHit = new Event(hit as IEvent)
        break
      case HitType.ITEM:
        newHit = new Item(hit as IItem)
        break
      case 'PAGE':
      case HitType.PAGE_VIEW:
        newHit = new Page(hit as IPage)
        break
      case 'SCREEN':
      case HitType.SCREEN_VIEW:
        newHit = new Screen(hit as IScreen)
        break
      case HitType.TRANSACTION:
        newHit = new Transaction(hit as ITransaction)
        break
    }
    return newHit
  }

  private async prepareAndSendHit (hit:IPage|IScreen|IEvent|IItem|ITransaction|HitAbstract) {
    let hitInstance:HitAbstract
    if (hit instanceof HitAbstract) {
      hitInstance = hit
    } else {
      const hitFromInt = this.getHit(hit)
      if (!hitFromInt) {
        logError(this.config, TYPE_HIT_REQUIRED_ERROR, PROCESS_SEND_HIT)
        return
      }
      hitInstance = hitFromInt
    }
    hitInstance.visitorId = this.visitorId
    hitInstance.ds = SDK_APP
    hitInstance.config = this.config

    if (!hitInstance.isReady()) {
      logError(this.config, hitInstance.getErrorMessage(), PROCESS_SEND_HIT)
      return
    }
    this.configManager.trackingManager.sendHit(hitInstance).catch((error) => {
      logError(this.config, error.message || error, PROCESS_SEND_HIT)
    })
  }

  /**
   * Send a Hit to Flagship servers for reporting.
   * @param hit
   */
  public sendHitSync (hit:Array<HitAbstract>):void
  public sendHitSync (hit:HitAbstract):void
  public sendHitSync (hit:Array<IPage|IScreen|IEvent|IItem|ITransaction>):void
  public sendHitSync (hit:IPage|IScreen|IEvent|IItem|ITransaction|HitAbstract):void
  public sendHitSync (hit:IPage|IScreen|IEvent|IItem|ITransaction|
    Array<IPage|IScreen|IEvent|IItem|ITransaction>|
    HitAbstract|HitAbstract[]): void

  public sendHitSync (hit:IPage|IScreen|IEvent|IItem|ITransaction|
    Array<IPage|IScreen|IEvent|IItem|ITransaction>|
    HitAbstract|HitAbstract[]): void {
    if (this.isOnPanicMode(PROCESS_SEND_HIT)) {
      return
    }

    if (!this.hasTrackingManager(PROCESS_SEND_HIT)) {
      return
    }
    if (Array.isArray(hit)) {
      hit.forEach(item => {
        this.prepareAndSendHit(item)
      })
    } else {
      this.prepareAndSendHit(hit)
    }
  }
}
