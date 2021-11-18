import { Modification } from '../index.ts'
import {
  CONTEXT_NULL_ERROR,
  CONTEXT_PARAM_ERROR,
  EMIT_READY,
  FLAGSHIP_VISITOR_NOT_AUTHENTICATE,
  GET_MODIFICATION_CAST_ERROR,
  GET_MODIFICATION_ERROR,
  GET_MODIFICATION_KEY_ERROR,
  GET_MODIFICATION_MISSING_ERROR,
  HitType,
  HIT_CACHE_VERSION,
  METHOD_DEACTIVATED_BUCKETING_ERROR,
  PREDEFINED_CONTEXT_TYPE_ERROR,
  PROCESS_ACTIVE_MODIFICATION,
  PROCESS_CACHE_HIT,
  PROCESS_GET_MODIFICATION,
  PROCESS_GET_MODIFICATION_INFO,
  PROCESS_SEND_HIT,
  PROCESS_SYNCHRONIZED_MODIFICATION,
  PROCESS_UPDATE_CONTEXT,
  SDK_APP,
  TRACKER_MANAGER_MISSING_ERROR,
  VISITOR_CACHE_VERSION,
  VISITOR_ID_ERROR
} from '../enum/index.ts'
import {
  HitAbstract,
  IPage,
  IScreen,
  IEvent,
  Event,
  Screen,
  IItem,
  ITransaction,
  Item,
  Page,
  Transaction,
  IHitAbstract
} from '../hit/index.ts'
import { HitShape } from '../hit/Legacy.ts'
import { primitive, modificationsRequested, IHit } from '../types.ts'
import { logError, logInfo, sprintf } from '../utils/utils.ts'
import { VisitorStrategyAbstract } from './VisitorStrategyAbstract.ts'
import { CampaignDTO } from '../decision/api/models.ts'
import { DecisionMode } from '../config/index.ts'
import { FLAGSHIP_CONTEXT } from '../enum/FlagshipContext.ts'
import { VisitorLookupCacheDTO, VisitorSaveCacheDTO } from '../models/visitorDTO.ts'
import { VisitorDelegate } from '..ts'
import { HitCacheLookupDTO, HitCacheSaveDTO } from '../models/HitDTO.ts'

export const TYPE_HIT_REQUIRED_ERROR = 'property type is required and must '
export const LOOKUP_HITS_JSON_ERROR = 'JSON DATA must be an array of object'
export const LOOKUP_HITS_JSON_OBJECT_ERROR = 'JSON DATA must fit the type HitCacheLookupDTO'
export const LOOKUP_VISITOR_JSON_OBJECT_ERROR = 'JSON DATA must fit the type VisitorCacheLookupDTO'
export class DefaultStrategy extends VisitorStrategyAbstract {
  setConsent (hasConsented: boolean): void {
    const method = 'setConsent'
    this.visitor.hasConsented = hasConsented
    if (!hasConsented) {
      this.flushHits()
      this.flushVisitor()
    }
    if (!this.hasTrackingManager(method)) {
      return
    }

    this.trackingManager.sendConsentHit(this.visitor).catch((error) => {
      logError(this.config, error.message || error, method)
    })
  }

  private checkPredefinedContext (
    key: string,
    value: primitive
  ): boolean | null {
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
      logError(
        this.config,
        sprintf(PREDEFINED_CONTEXT_TYPE_ERROR, key, type),
        PROCESS_UPDATE_CONTEXT
      )
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
  private updateContextKeyValue (key: string, value: primitive): void {
    const valueType = typeof value
    if (
      typeof key !== 'string' ||
      key === '' ||
      (valueType !== 'string' &&
        valueType !== 'number' &&
        valueType !== 'boolean')
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

  private checkAndGetModification<T> (
    params: modificationsRequested<T>,
    activateAll?: boolean
  ): T {
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
      logInfo(
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

  async getModifications<T> (
    params: modificationsRequested<T>[],
    activateAll?: boolean
  ): Promise<Record<string, T>> {
    return this.getModificationsSync(params, activateAll)
  }

  getModificationsSync<T> (
    params: modificationsRequested<T>[],
    activateAll?: boolean
  ): Record<string, T> {
    const flags: Record<string, T> = {}
    params.forEach((item) => {
      flags[item.key] = this.checkAndGetModification(item, activateAll)
    })
    return flags
  }

  async getModification<T> (params: modificationsRequested<T>): Promise<T> {
    return this.getModificationSync(params)
  }

  getModificationSync<T> (params: modificationsRequested<T>): T {
    return this.checkAndGetModification(params)
  }

  async getModificationInfo (key: string): Promise<Modification | null> {
    return this.getModificationInfoSync(key)
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

  protected checKLookupVisitorDataV1 (item:VisitorLookupCacheDTO):boolean {
    if (!item || !item.data || !item.data.visitorId) {
      return false
    }
    const campaigns = item.data.campaigns
    if (!campaigns) {
      return true
    }
    if (!Array.isArray(campaigns)) {
      return false
    }

    return campaigns.every(x => x.campaignId && x.type && x.variationGroupId && x.variationId)
  }

  protected checKLookupVisitorData (item:VisitorLookupCacheDTO):boolean {
    if (item.version === 1) {
      return this.checKLookupVisitorDataV1(item)
    }
    return false
  }

  public async lookupVisitor ():Promise<void> {
    try {
      const visitorCacheInstance = this.config.visitorCacheImplementation
      if (!visitorCacheInstance || !visitorCacheInstance.lookupVisitor || typeof visitorCacheInstance.lookupVisitor !== 'function') {
        return
      }
      const visitorCacheJson = visitorCacheInstance.lookupVisitor(this.visitor.visitorId)
      if (!visitorCacheJson) {
        return
      }
      const visitorCache:VisitorLookupCacheDTO = JSON.parse(visitorCacheJson)
      if (!this.checKLookupVisitorData(visitorCache)) {
        throw new Error(LOOKUP_VISITOR_JSON_OBJECT_ERROR)
      }
      this.visitor.visitorCache = visitorCache
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logError(this.config, error.message || error, 'lookupVisitor')
    }
  }

  protected async cacheVisitor ():Promise<void> {
    try {
      const visitorCacheInstance = this.config.visitorCacheImplementation
      if (this.decisionManager.isPanic() || !visitorCacheInstance || !visitorCacheInstance.cacheVisitor || typeof visitorCacheInstance.cacheVisitor !== 'function') {
        return
      }
      const data: VisitorSaveCacheDTO = {
        version: VISITOR_CACHE_VERSION,
        data: {
          visitorId: this.visitor.visitorId,
          anonymousId: this.visitor.anonymousId,
          consent: this.visitor.hasConsented,
          context: this.visitor.context,
          campaigns: this.visitor.campaigns.map(campaign => {
            return {
              campaignId: campaign.id,
              variationGroupId: campaign.variationGroupId,
              variationId: campaign.variation.id,
              isReference: campaign.variation.reference,
              type: campaign.variation.modifications.type,
              activated: false,
              flags: campaign.variation.modifications.value
            }
          })
        }
      }
      visitorCacheInstance.cacheVisitor(this.visitor.visitorId, JSON.stringify(data))
      this.visitor.visitorCache = data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logError(
        this.config,
        error.message || error,
        'cacheVisitor'
      )
    }
  }

  protected async flushVisitor ():Promise<void> {
    try {
      const visitorCacheInstance = this.config.visitorCacheImplementation
      if (!visitorCacheInstance || !visitorCacheInstance.cacheVisitor || typeof visitorCacheInstance.flushVisitor !== 'function') {
        return
      }
      visitorCacheInstance.flushVisitor(this.visitor.visitorId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logError(
        this.config,
        error.message || error,
        'flushVisitor'
      )
    }
  }

  protected fetchVisitorCampaigns (visitor: VisitorDelegate) :CampaignDTO[] {
    if (!visitor.visitorCache || !visitor.visitorCache.data ||
      !visitor.visitorCache.data.campaigns) {
      return []
    }
    this.setConsent(!!visitor.visitorCache.data.consent)
    visitor.updateContext(visitor.visitorCache.data.context || {})
    return visitor.visitorCache.data.campaigns.map(campaign => {
      return {
        id: campaign.campaignId,
        variationGroupId: campaign.variationGroupId,
        variation: {
          id: campaign.variationId,
          reference: !!campaign.isReference,
          modifications: {
            type: campaign.type,
            value: campaign.flags
          }
        }
      }
    })
  }

  async synchronizeModifications (): Promise<void> {
    try {
      await this.lookupVisitor()
      let campaigns = await this.decisionManager.getCampaignsAsync(
        this.visitor
      )
      if (!campaigns.length) {
        campaigns = this.fetchVisitorCampaigns(this.visitor)
      }
      this.visitor.campaigns = campaigns
      this.visitor.modifications = this.decisionManager.getModifications(
        this.visitor.campaigns
      )
      this.cacheVisitor()
      this.visitor.emit(EMIT_READY)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      this.visitor.emit(EMIT_READY, error)
      logError(
        this.config,
        error.message || error,
        PROCESS_SYNCHRONIZED_MODIFICATION
      )
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

  activateModifications(keys: { key: string }[]): Promise<void>
  activateModifications(keys: string[]): Promise<void>
  async activateModifications (
    params: string[] | { key: string }[]
  ): Promise<void> {
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

  private isDeDuplicated (key:string, deDuplicationTime:number):boolean {
    if (deDuplicationTime === 0) {
      return false
    }

    const deDuplicationCache = this.visitor.deDuplicationCache[key]
    if (deDuplicationCache && (Date.now() - deDuplicationCache) <= (deDuplicationTime * 1000)) {
      return true
    }
    this.visitor.deDuplicationCache[key] = Date.now()

    this.visitor.clearDeDuplicationCache(deDuplicationTime)
    return false
  }

  private async activate (key: string) {
    if (this.isDeDuplicated(key, this.config.activateDeduplicationTime as number)) {
      return
    }

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
    } catch (error: any) {
      logError(this.config, error.message || error, PROCESS_ACTIVE_MODIFICATION)
    }
  }

  sendHit(hit: HitAbstract): Promise<void>
  sendHit(hit: IHit): Promise<void>
  sendHit(hit: HitShape): Promise<void>
  sendHit (hit: IHit | HitAbstract | HitShape): Promise<void> {
    if (!this.hasTrackingManager(PROCESS_SEND_HIT)) {
      return Promise.resolve()
    }
    return this.prepareAndSendHit(hit)
  }

  sendHits(hits: HitAbstract[]): Promise<void>
  sendHits(hits: IHit[]): Promise<void>
  sendHits(hits: HitShape[]): Promise<void>
  async sendHits (hits: HitAbstract[] | IHit[]|HitShape[]): Promise<void> {
    if (!this.hasTrackingManager(PROCESS_SEND_HIT)) {
      return
    }
    hits.forEach((hit) => this.prepareAndSendHit(hit))
  }

  private getHitLegacy (hit: HitShape) {
    let newHit = null

    const hitTypeToEnum: Record<string, HitType> = {
      Screen: HitType.SCREEN_VIEW,
      ScreenView: HitType.SCREEN_VIEW,
      Transaction: HitType.TRANSACTION,
      Page: HitType.PAGE_VIEW,
      PageView: HitType.PAGE_VIEW,
      Item: HitType.ITEM,
      Event: HitType.EVENT
    }
    const commonProperties: IHitAbstract = {
      type: hitTypeToEnum[hit.type]
    }

    const hitData: IHitAbstract = { ...commonProperties, ...hit.data }

    switch (hit.type.toUpperCase()) {
      case HitType.EVENT:
        newHit = new Event(hitData as IEvent)
        break
      case HitType.ITEM:
        newHit = new Item(hitData as IItem)
        break
      case HitType.PAGE_VIEW:
        newHit = new Page(hitData as IPage)
        break
      case HitType.SCREEN_VIEW:
        newHit = new Screen(hitData as IScreen)
        break
      case HitType.TRANSACTION:
        newHit = new Transaction(hit.data as ITransaction)
        break
    }
    return newHit
  }

  private getHit (hit: IHit) {
    let newHit = null

    switch (hit.type.toUpperCase()) {
      case HitType.EVENT:
        newHit = new Event(hit as IEvent)
        break
      case HitType.ITEM:
        newHit = new Item(hit as IItem)
        break
      case HitType.PAGE_VIEW:
        newHit = new Page(hit as IPage)
        break
      case HitType.SCREEN_VIEW:
        newHit = new Screen(hit as IScreen)
        break
      case HitType.TRANSACTION:
        newHit = new Transaction(hit as ITransaction)
        break
    }
    return newHit
  }

  protected checKLookupHitData (item:HitCacheLookupDTO):boolean {
    if (item && item.version === 1 && item.data && item.data.type && item.data.visitorId) {
      return true
    }
    logError(this.config, LOOKUP_HITS_JSON_OBJECT_ERROR, 'lookupHits')
    return false
  }

  async lookupHits ():Promise<void> {
    try {
      const hitCacheImplementation = this.config.hitCacheImplementation
      if (!hitCacheImplementation || typeof hitCacheImplementation.lookupHits !== 'function') {
        return
      }

      const hitsCacheJson = hitCacheImplementation.lookupHits(this.visitor.visitorId)
      if (!hitsCacheJson) {
        return
      }
      const hitsCache:HitCacheLookupDTO[] = JSON.parse(hitsCacheJson)
      if (!Array.isArray(hitsCache)) {
        throw Error(LOOKUP_HITS_JSON_ERROR)
      }

      hitsCache.forEach(item => {
        if (!this.checKLookupHitData(item)) {
          return
        }
        const hit:IHit = {
          type: item.data.type,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...item.data.content as any
        }
        this.sendHit(hit)
      })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logError(this.config, error.message || error, 'lookupHits')
    }
  }

  protected async cacheHit (hitInstance: HitAbstract):Promise<void> {
    try {
      const hitCacheImplementation = this.config.hitCacheImplementation
      if (!hitCacheImplementation || typeof hitCacheImplementation.cacheHit !== 'function') {
        return
      }
      const hitData: HitCacheSaveDTO = {
        version: HIT_CACHE_VERSION,
        data: {
          visitorId: this.visitor.visitorId,
          anonymousId: this.visitor.anonymousId,
          type: hitInstance.type,
          content: hitInstance.toObject()
        }
      }
      hitCacheImplementation.cacheHit(this.visitor.visitorId, JSON.stringify(hitData))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logError(this.config, error.message || error, PROCESS_CACHE_HIT)
    }
  }

  protected async flushHits (): Promise<void> {
    try {
      const hitCacheImplementation = this.config.hitCacheImplementation
      if (!hitCacheImplementation || typeof hitCacheImplementation.flushHits !== 'function') {
        return
      }

      hitCacheImplementation.flushHits(this.visitor.visitorId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logError(this.config, error.message || error, 'flushHits')
    }
  }

  private async prepareAndSendHit (hit: IHit | HitShape | HitAbstract) {
    let hitInstance: HitAbstract
    if (hit instanceof HitAbstract) {
      hitInstance = hit
    } else if ('data' in hit) {
      const hitShape = hit as HitShape
      const hitFromInt = this.getHitLegacy(hitShape)
      if (!hitFromInt) {
        logError(this.config, TYPE_HIT_REQUIRED_ERROR, PROCESS_SEND_HIT)
        return
      }
      hitInstance = hitFromInt
    } else {
      const hitFromInt = this.getHit(hit as IHit)
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

    if (this.isDeDuplicated(JSON.stringify(hitInstance), this.config.hitDeduplicationTime as number)) {
      return
    }

    if (!hitInstance.isReady()) {
      logError(this.config, hitInstance.getErrorMessage(), PROCESS_SEND_HIT)
      return
    }

    try {
      await this.trackingManager.sendHit(hitInstance)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logError(this.config, error.message || error, PROCESS_SEND_HIT)
      this.cacheHit(hitInstance)
    }
  }

  /**
   * returns a Promise<object> containing all the data for all the campaigns associated with the current visitor.
   *@deprecated
   */
  public async getAllModifications (activate = false): Promise<{
    visitorId: string
    campaigns: CampaignDTO[]
  }> {
    if (activate) {
      this.visitor.modifications.forEach((_, key) => {
        this.activateModification(key)
      })
    }
    return {
      visitorId: this.visitor.visitorId,
      campaigns: this.visitor.campaigns
    }
  }

  /**
   * Get data for a specific campaign.
   * @param campaignId Identifies the campaign whose modifications you want to retrieve.
   * @param activate
   * @deprecated
   * @returns
   */
  public async getModificationsForCampaign (
    campaignId: string,
    activate = false
  ): Promise<{
    visitorId: string
    campaigns: CampaignDTO[]
  }> {
    if (activate) {
      this.visitor.modifications.forEach((value) => {
        if (value.campaignId === campaignId) {
          this.activateModification(value.key)
        }
      })
    }

    return {
      visitorId: this.visitor.visitorId,
      campaigns: this.visitor.campaigns.filter((x) => x.id === campaignId)
    }
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

  protected logDeactivateOnBucketing (functionName: string): void {
    logError(
      this.config,
      sprintf(METHOD_DEACTIVATED_BUCKETING_ERROR, functionName),
      functionName
    )
  }
}
