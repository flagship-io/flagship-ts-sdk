import { Modification } from '../index'
import {
  CONTEXT_NULL_ERROR, CONTEXT_PARAM_ERROR,
  EMIT_READY,
  FLAGSHIP_VISITOR_NOT_AUTHENTICATE,
  GET_MODIFICATION_CAST_ERROR,
  GET_MODIFICATION_ERROR, GET_MODIFICATION_KEY_ERROR,
  GET_MODIFICATION_MISSING_ERROR, HitType,
  METHOD_DEACTIVATED_BUCKETING_ERROR,
  PREDEFINED_CONTEXT_TYPE_ERROR,
  PROCESS_ACTIVE_MODIFICATION,
  PROCESS_GET_MODIFICATION,
  PROCESS_GET_MODIFICATION_INFO,
  PROCESS_SEND_HIT,
  PROCESS_SYNCHRONIZED_MODIFICATION,
  PROCESS_UPDATE_CONTEXT,
  SDK_APP,
  TRACKER_MANAGER_MISSING_ERROR,
  VISITOR_ID_ERROR
} from '../enum/index'
import { HitAbstract, IPage, IScreen, IEvent, Event, Screen, IItem, ITransaction, Item, Page, Transaction } from '../hit/index'
import { primitive, modificationsRequested, IHit } from '../types'
import { logError, sprintf } from '../utils/utils'
import { VisitorStrategyAbstract } from './VisitorStrategyAbstract'
import { CampaignDTO } from '../decision/api/models'
import { DecisionMode } from '../config/index'
import { FLAGSHIP_CONTEXT } from '../enum/FlagshipContext'

export const TYPE_HIT_REQUIRED_ERROR = 'property type is required and must '

export class DefaultStrategy extends VisitorStrategyAbstract {
  setConsent (hasConsented: boolean): void {
    const method = 'setConsent'
    this.visitor.hasConsented = hasConsented
    if (!this.hasTrackingManager(method)) {
      return
    }
    this.trackingManager.sendConsentHit(this.visitor)
      .catch((error) => {
        logError(this.config, error.message || error, method)
      })
  }

  private checkPredefinedContext (key:string, value:primitive):boolean|null {
    const type = FLAGSHIP_CONTEXT[key]
    if (!type) {
      return null
    }

    let check = false

    if (type === 'string') {
      check = typeof value === 'string'
    } else if (type === 'number') {
      check = typeof value === 'number'
    }

    if (!check) {
      logError(this.config, sprintf(
        PREDEFINED_CONTEXT_TYPE_ERROR,
        key,
        type), PROCESS_UPDATE_CONTEXT)
    }
    return check
  }

  /**
   *  Update the visitor context values, matching the given keys, used for targeting.
   *
   * A new context value associated with this key will be created if there is no previous matching value.
   * Context key must be String, and value type must be one of the following : Number, Boolean, String.
   * @param {string} key : context key.
   * @param {primitive} value : context value.
   */
  private updateContextKeyValue (
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
        this.visitor.config,
        sprintf(CONTEXT_PARAM_ERROR, key),
        PROCESS_UPDATE_CONTEXT
      )
      return
    }

    if (key.match(/^fs_/i)) {
      return
    }

    const predefinedContext = this.checkPredefinedContext(key, value)
    if (typeof predefinedContext === 'boolean' && !predefinedContext) {
      return
    }

    this.visitor.context[key] = value
  }

  updateContext (context: Record<string, primitive>): void {
    if (!context) {
      logError(this.visitor.config, CONTEXT_NULL_ERROR, PROCESS_UPDATE_CONTEXT)
      return
    }

    for (const key in context) {
      const value = context[key]
      this.updateContextKeyValue(key, value)
    }
  }

  clearContext (): void {
    this.visitor.context = {}
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

    const modification = this.visitor.modifications.get(key)
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
        this.activateModification(key)
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

  getModifications<T> (params: modificationsRequested<T>[], activateAll?: boolean): Promise<T[]> {
    return Promise.resolve(this.getModificationsSync(params, activateAll))
  }

  getModificationsSync<T> (params: modificationsRequested<T>[], activateAll?: boolean): T[] {
    return params.map(item => {
      return this.checkAndGetModification(item, activateAll)
    })
  }

  getModification<T> (params: modificationsRequested<T>): Promise<T> {
    return Promise.resolve(this.getModificationSync(params))
  }

  getModificationSync<T> (params: modificationsRequested<T>): T {
    return this.checkAndGetModification(params)
  }

  getModificationInfo (key: string): Promise<Modification | null> {
    return Promise.resolve(this.getModificationInfoSync(key))
  }

  public getModificationInfoSync (key: string): Modification | null {
    if (!key || typeof key !== 'string') {
      logError(
        this.visitor.config,
        sprintf(GET_MODIFICATION_KEY_ERROR, key),
        PROCESS_GET_MODIFICATION_INFO
      )
      return null
    }

    const modification = this.visitor.modifications.get(key)

    if (!modification) {
      logError(
        this.visitor.config,
        sprintf(GET_MODIFICATION_ERROR, key),
        PROCESS_GET_MODIFICATION_INFO
      )
      return null
    }
    return modification
  }

  async synchronizeModifications (): Promise<void> {
    try {
      const campaigns = await this.decisionManager.getCampaignsAsync(this.visitor)
      this.visitor.campaigns = campaigns
      this.visitor.modifications = this.decisionManager.getModifications(this.visitor.campaigns)
      this.visitor.emit(EMIT_READY)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      this.visitor.emit(EMIT_READY, error)
      logError(this.config, error.message || error, PROCESS_SYNCHRONIZED_MODIFICATION)
    }
  }

  async activateModification (params: string): Promise<void> {
    if (!params || typeof params !== 'string') {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_KEY_ERROR, params),
        PROCESS_ACTIVE_MODIFICATION
      )
      return
    }
    return this.activate(params)
  }

  activateModifications(keys: { key: string; }[]): Promise<void>;
  activateModifications(keys: string[]): Promise<void>;
  async activateModifications (params: string[] | { key: string; }[]): Promise<void> {
    if (!params || !Array.isArray(params)) {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_KEY_ERROR, params),
        PROCESS_ACTIVE_MODIFICATION
      )
      return
    }
    params.forEach((item) => {
      if (typeof item === 'string') {
        this.activate(item)
      } else this.activate(item.key)
    })
  }

  private hasTrackingManager (process: string): boolean {
    const check = this.trackingManager
    if (!check) {
      logError(this.config, sprintf(TRACKER_MANAGER_MISSING_ERROR), process)
    }
    return !!check
  }

  private async activate (key: string) {
    try {
      const modification = this.visitor.modifications.get(key)

      if (!modification) {
        logError(
          this.visitor.config,
          sprintf(GET_MODIFICATION_ERROR, key),
          PROCESS_ACTIVE_MODIFICATION
        )
        return
      }

      if (!this.hasTrackingManager(PROCESS_ACTIVE_MODIFICATION)) {
        return
      }

      await this.trackingManager.sendActive(this.visitor, modification)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logError(this.config, error.message || error, PROCESS_ACTIVE_MODIFICATION)
    }
  }

  sendHit(hit: HitAbstract): Promise<void>;
  sendHit(hit: IHit): Promise<void>;
  sendHit (hit: IHit|HitAbstract): Promise<void> {
    if (!this.hasTrackingManager(PROCESS_SEND_HIT)) {
      return Promise.resolve()
    }
    return this.prepareAndSendHit(hit)
  }

  sendHits(hits: HitAbstract[]): Promise<void>;
  sendHits(hits: IHit[]): Promise<void>;
  async sendHits (hits: HitAbstract[] | IHit[]): Promise<void> {
    if (!this.hasTrackingManager(PROCESS_SEND_HIT)) {
      return Promise.resolve()
    }
    hits.forEach((hit) => {
      this.prepareAndSendHit(hit)
    })
  }

  private getHit (hit:IHit) {
    let newHit = null

    switch (hit.type.toUpperCase()) {
      case HitType.EVENT:
        newHit = new Event(hit as IEvent)
        break
      case HitType.ITEM:
        newHit = new Item(hit as IItem)
        break
      case HitType.PAGE:
      case HitType.PAGE_VIEW:
        newHit = new Page(hit as IPage)
        break
      case HitType.SCREEN:
      case HitType.SCREEN_VIEW:
        newHit = new Screen(hit as IScreen)
        break
      case HitType.TRANSACTION:
        newHit = new Transaction(hit as ITransaction)
        break
    }
    return newHit
  }

  private async prepareAndSendHit (hit:IHit|HitAbstract) {
    try {
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
      hitInstance.visitorId = this.visitor.visitorId
      hitInstance.ds = SDK_APP
      hitInstance.config = this.config
      hitInstance.anonymousId = this.visitor.anonymousId

      if (!hitInstance.isReady()) {
        logError(this.config, hitInstance.getErrorMessage(), PROCESS_SEND_HIT)
        return
      }
      await this.trackingManager.sendHit(hitInstance)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logError(this.config, error.message || error, PROCESS_SEND_HIT)
    }
  }

  /**
   * returns a Promise<object> containing all the data for all the campaigns associated with the current visitor.
   *@deprecated
   */
  public getAllModifications (activate = false): Promise<{
    visitorId: string;
    campaigns: CampaignDTO[];
    }> {
    if (activate) {
      this.visitor.modifications.forEach((_, key) => {
        this.activateModification(key)
      })
    }
    return Promise.resolve({
      visitorId: this.visitor.visitorId,
      campaigns: this.visitor.campaigns
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
    }> {
    if (activate) {
      this.visitor.modifications.forEach(value => {
        if (value.campaignId === campaignId) {
          this.activateModification(value.key)
        }
      })
    }

    return Promise.resolve({
      visitorId: this.visitor.visitorId,
      campaigns: this.visitor.campaigns.filter(x => x.id === campaignId)
    })
  }

  authenticate (visitorId: string): void {
    const functionName = 'authenticate'
    if (this.config.decisionMode === DecisionMode.BUCKETING) {
      this.logDeactivateOnBucketing(functionName)
      return
    }

    if (!visitorId) {
      logError(this.config, VISITOR_ID_ERROR, functionName)
      return
    }
    this.visitor.anonymousId = this.visitor.visitorId
    this.visitor.visitorId = visitorId
  }

  unauthenticate (): void {
    const functionName = 'unauthenticate'
    if (this.config.decisionMode === DecisionMode.BUCKETING) {
      this.logDeactivateOnBucketing(functionName)
      return
    }
    if (!this.visitor.anonymousId) {
      logError(this.config, FLAGSHIP_VISITOR_NOT_AUTHENTICATE, functionName)
      return
    }
    this.visitor.visitorId = this.visitor.anonymousId
    this.visitor.anonymousId = null
  }

  protected logDeactivateOnBucketing (functionName:string):void {
    logError(this.config, sprintf(METHOD_DEACTIVATED_BUCKETING_ERROR, functionName), functionName)
  }
}
