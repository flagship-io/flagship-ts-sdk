import { Modification } from '../index'
import { CONTEXT_NULL_ERROR, CONTEXT_PARAM_ERROR, EMIT_READY, GET_MODIFICATION_CAST_ERROR, GET_MODIFICATION_ERROR, GET_MODIFICATION_KEY_ERROR, GET_MODIFICATION_MISSING_ERROR, HitType, PROCESS_ACTIVE_MODIFICATION, PROCESS_GET_MODIFICATION, PROCESS_GET_MODIFICATION_INFO, PROCESS_SEND_HIT, PROCESS_SYNCHRONIZED_MODIFICATION, PROCESS_UPDATE_CONTEXT, SDK_APP, TRACKER_MANAGER_MISSING_ERROR } from '../enum/index'
import { HitAbstract, IPage, IScreen, IEvent, Event, Screen, IItem, ITransaction, Item, Page, Transaction } from '../hit/index'
import { primitive, modificationsRequested } from '../types'
import { logError, sprintf } from '../utils/utils'
import { VisitorStrategyAbstract } from './VisitorStrategyAbstract'

export const TYPE_HIT_REQUIRED_ERROR = 'property type is required and must '

export class DefaultStrategy extends VisitorStrategyAbstract {
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

  getModification<T>(params: modificationsRequested<T>, activateAll?: boolean): Promise<T>;
  getModification<T>(params: modificationsRequested<T>[], activateAll?: boolean): Promise<T[]>;
  getModification<T> (params: modificationsRequested<T> | modificationsRequested<T>[], activateAll?: boolean): Promise<T | T[]> {
    return Promise.resolve(this.getModificationSync(params, activateAll))
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

  getModificationSync<T>(params: modificationsRequested<T>, activateAll?: boolean): T
  getModificationSync<T>(params: modificationsRequested<T>[], activateAll?: boolean): T[]
  getModificationSync<T>(params: modificationsRequested<T> | modificationsRequested<T>[], activateAll?: boolean): T | T[]
  getModificationSync<T> (params: modificationsRequested<T> | modificationsRequested<T>[], activateAll?: boolean): T | T[] {
    if (Array.isArray(params)) {
      return params.map(item => {
        return this.checkAndGetModification(item, activateAll)
      })
    }
    return this.checkAndGetModification(params, activateAll)
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

  synchronizeModifications (): Promise<void> {
    return new Promise((resolve, reject) => {
      this.configManager.decisionManager.getCampaignsAsync(this.visitor)
        .then(campaigns => {
          this.visitor.campaigns = campaigns
          this.visitor.modifications = this.visitor.configManager.decisionManager.getModifications(this.visitor.campaigns)
          this.visitor.emit(EMIT_READY)
          resolve()
        })
        .catch(error => {
          this.visitor.emit(EMIT_READY, error)
          logError(this.config, error.message, PROCESS_SYNCHRONIZED_MODIFICATION)
          reject(error)
        })
    })
  }

  activateModification(key: string): Promise<void>;
  activateModification(keys: { key: string; }[]): Promise<void>;
  activateModification(keys: string[]): Promise<void>;
  activateModification (params: string | string[] | { key: string; }[]): Promise<void> {
    return Promise.resolve(this.activateModificationSync(params))
  }

  private hasTrackingManager (process: string): boolean {
    const check = this.configManager.trackingManager
    if (!check) {
      logError(this.config, sprintf(TRACKER_MANAGER_MISSING_ERROR), process)
    }
    return !!check
  }

  private activate (key: string) {
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

    this.configManager.trackingManager.sendActive(this.visitor, modification)
  }

  activateModificationSync(key: string): void
  activateModificationSync(keys: { key: string }[]): void
  activateModificationSync(keys: string[]): void
  activateModificationSync(params: string | string[] | { key: string }[]): void
  activateModificationSync (params: string | string[] | { key: string }[]): void {
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

  sendHit(hit: HitAbstract): Promise<void>;
  sendHit(hit: HitAbstract[]): Promise<void>;
  sendHit(hit: IPage | IScreen | IEvent | IItem | ITransaction): Promise<void>;
  sendHit(hit: (IPage | IScreen | IEvent | IItem | ITransaction)[]): Promise<void>;
  sendHit (hit: HitAbstract | HitAbstract[] | IPage | IScreen | IEvent | IItem | ITransaction | (IPage | IScreen | IEvent | IItem | ITransaction)[]): Promise<void> {
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
    hitInstance.visitorId = this.visitor.visitorId
    hitInstance.ds = SDK_APP
    hitInstance.config = this.config

    if (!hitInstance.isReady()) {
      logError(this.config, hitInstance.getErrorMessage(), PROCESS_SEND_HIT)
      return
    }
    this.configManager.trackingManager.sendHit(hitInstance)
  }

  sendHitSync(hit: HitAbstract[]): void
  sendHitSync(hit: HitAbstract): void
  sendHitSync(hit: (IPage | IScreen | IEvent | IItem | ITransaction)[]): void
  sendHitSync(hit: HitAbstract | IPage | IScreen | IEvent | IItem | ITransaction): void
  sendHitSync(hit: HitAbstract | HitAbstract[] | IPage | IScreen | IEvent | IItem | ITransaction | (IPage | IScreen | IEvent | IItem | ITransaction)[]): void
  sendHitSync (hit: HitAbstract | HitAbstract[] | IPage | IScreen | IEvent | IItem | ITransaction | (IPage | IScreen | IEvent | IItem | ITransaction)[]): void {
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
