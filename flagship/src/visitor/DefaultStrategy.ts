import {
  ACTIVATE_MODIFICATION_ERROR,
  ACTIVATE_MODIFICATION_KEY_ERROR,
  CONTEXT_NULL_ERROR,
  CONTEXT_PARAM_ERROR,
  EMIT_READY,
  FLAGSHIP_VISITOR_NOT_AUTHENTICATE,
  GET_FLAG_CAST_ERROR,
  GET_FLAG_MISSING_ERROR,
  GET_METADATA_CAST_ERROR,
  GET_MODIFICATION_CAST_ERROR,
  GET_MODIFICATION_ERROR,
  GET_MODIFICATION_KEY_ERROR,
  GET_MODIFICATION_MISSING_ERROR,
  HitType,
  METHOD_DEACTIVATED_BUCKETING_ERROR,
  PREDEFINED_CONTEXT_TYPE_ERROR,
  PROCESS_ACTIVE_MODIFICATION,
  PROCESS_GET_MODIFICATION,
  PROCESS_GET_MODIFICATION_INFO,
  PROCESS_SEND_HIT,
  PROCESS_SYNCHRONIZED_MODIFICATION,
  PROCESS_UPDATE_CONTEXT,
  SDK_APP,
  USER_EXPOSED_CAST_ERROR,
  USER_EXPOSED_FLAG_ERROR,
  VISITOR_ID_ERROR
} from '../enum/index'
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
} from '../hit/index'
import { HitShape, ItemHit } from '../hit/Legacy'
import { primitive, modificationsRequested, IHit, FlagDTO, VisitorCacheDTO, IFlagMetadata } from '../types'
import { hasSameType, logError, logInfo, sprintf } from '../utils/utils'
import { VisitorStrategyAbstract } from './VisitorStrategyAbstract'
import { CampaignDTO } from '../decision/api/models'
import { DecisionMode } from '../config/index'
import { FLAGSHIP_CONTEXT } from '../enum/FlagshipContext'
import { VisitorDelegate } from './index'
import { Batch, BATCH, BatchDTO } from '../hit/Batch'
import { FlagMetadata } from '../flag/FlagMetadata'

export const TYPE_HIT_REQUIRED_ERROR = 'property type is required and must '

export class DefaultStrategy extends VisitorStrategyAbstract {
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

    const modification = this.visitor.flagsData.get(key)
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

  async getModificationInfo (key: string): Promise<FlagDTO | null> {
    return this.getModificationInfoSync(key)
  }

  public getModificationInfoSync (key: string): FlagDTO | null {
    if (!key || typeof key !== 'string') {
      logError(
        this.visitor.config,
        sprintf(GET_MODIFICATION_KEY_ERROR, key),
        PROCESS_GET_MODIFICATION_INFO
      )
      return null
    }

    const modification = this.visitor.flagsData.get(key)

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

  protected fetchVisitorCampaigns (visitor: VisitorDelegate) :CampaignDTO[]|null {
    if (!Array.isArray(visitor?.visitorCache?.data.campaigns)) {
      return null
    }
    visitor.updateContext((visitor.visitorCache as VisitorCacheDTO).data.context || {})
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (visitor.visitorCache as any).data.campaigns.map((campaign:any) => {
      return {
        id: campaign.campaignId,
        variationGroupId: campaign.variationGroupId,
        slug: campaign.slug,
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

  protected async globalFetchFlags (functionName:string): Promise<void> {
    try {
      let campaigns = await this.decisionManager.getCampaignsAsync(this.visitor)

      if (!campaigns) {
        campaigns = this.fetchVisitorCampaigns(this.visitor)
      }

      if (!campaigns) {
        return
      }

      this.visitor.campaigns = campaigns
      this.visitor.flagsData = this.decisionManager.getModifications(this.visitor.campaigns)
      this.visitor.emit(EMIT_READY)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      this.visitor.emit(EMIT_READY, error)
      logError(
        this.config,
        error.message || error,
        functionName
      )
    }
  }

  async synchronizeModifications (): Promise<void> {
    return this.globalFetchFlags(PROCESS_SYNCHRONIZED_MODIFICATION)
  }

  async activateModification (params: string): Promise<void> {
    if (!params || typeof params !== 'string') {
      logError(
        this.config,
        sprintf(ACTIVATE_MODIFICATION_KEY_ERROR, params),
        PROCESS_ACTIVE_MODIFICATION
      )
      return
    }
    return this.activate(params)
  }

  activateModifications(keys: { key: string }[]): Promise<void>
  activateModifications(keys: string[]): Promise<void>
  async activateModifications (params: string[] | { key: string }[]): Promise<void> {
    if (!params || !Array.isArray(params)) {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_KEY_ERROR, params),
        PROCESS_ACTIVE_MODIFICATION
      )
      return
    }
    params.forEach((item:string | {key: string}) => {
      if (typeof item === 'string') {
        this.activate(item)
      } else this.activate(item.key)
    })
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

  protected async sendActivate (modification: FlagDTO, functionName = PROCESS_ACTIVE_MODIFICATION):Promise<void> {
    try {
      await this.trackingManager.sendActive(this.visitor, modification)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logError(this.config, error.message || error, functionName)
      this.cacheHit(modification)
    }
  }

  private async activate (key: string) {
    const flag = this.visitor.flagsData.get(key)

    if (!flag) {
      logError(
        this.visitor.config,
        sprintf(ACTIVATE_MODIFICATION_ERROR, key),
        PROCESS_ACTIVE_MODIFICATION
      )
      return
    }

    if (this.isDeDuplicated(flag.variationGroupId + this.visitor.visitorId, this.config.activateDeduplicationTime as number)) {
      return
    }

    if (!this.hasTrackingManager(PROCESS_ACTIVE_MODIFICATION)) {
      return
    }

    await this.sendActivate(flag)
  }

  sendHit(hit: BatchDTO): Promise<void>
  sendHit(hit: HitAbstract): Promise<void>
  sendHit(hit: IHit): Promise<void>
  sendHit(hit: HitShape): Promise<void>
  sendHit (hit: IHit | HitAbstract | HitShape|BatchDTO): Promise<void> {
    if (!this.hasTrackingManager(PROCESS_SEND_HIT)) {
      return Promise.resolve()
    }
    return this.prepareAndSendHit(hit)
  }

  sendHits(hits: BatchDTO[]): Promise<void>
  sendHits(hits: HitAbstract[]): Promise<void>
  sendHits(hits: IHit[]): Promise<void>
  sendHits(hits: HitShape[]): Promise<void>
  async sendHits (hits: HitAbstract[] | IHit[]|HitShape[]|BatchDTO[]): Promise<void> {
    if (!this.hasTrackingManager(PROCESS_SEND_HIT)) {
      return
    }
    hits.forEach((hit:HitAbstract | HitShape | IHit | BatchDTO) => this.prepareAndSendHit(hit))
  }

  private getHitLegacy (hit: HitShape) {
    let newHit = null
    if (!hit || !hit.type) {
      return null
    }
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

    switch (commonProperties.type.toUpperCase()) {
      case HitType.EVENT:
        newHit = new Event(hitData as IEvent)
        break
      case HitType.ITEM:
        // eslint-disable-next-line no-case-declarations
        const data = hit.data as ItemHit
        newHit = new Item({
          ...hitData,
          productName: data.name,
          productSku: data.code,
          transactionId: data.transactionId,
          itemCategory: data.category,
          itemPrice: data.price,
          itemQuantity: data.quantity
        } as IItem)
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

  private getHit (hit: IHit|BatchDTO):HitAbstract|null {
    let newHit = null
    if (!hit || !hit.type) {
      return newHit
    }
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
      case BATCH:
        newHit = new Batch({
          hits: (hit as BatchDTO)?.hits?.map((item) => {
            return this.getHit(item as IHit)
          }).filter(item => item) as HitAbstract[]
        })
        break
    }
    return newHit
  }

  private async prepareAndSendHit (hit: IHit | HitShape | HitAbstract|BatchDTO) {
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
    return this.getAllFlagsData(activate)
  }

  async getAllFlagsData (activate: boolean): Promise<{ visitorId: string; campaigns: CampaignDTO[] }> {
    if (activate) {
      this.visitor.flagsData.forEach((_, key) => {
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
  public async getModificationsForCampaign (campaignId: string, activate = false): Promise<{ visitorId: string; campaigns: CampaignDTO[]}> {
    return this.getFlatsDataForCampaign(campaignId, activate)
  }

  async getFlatsDataForCampaign (campaignId: string, activate: boolean): Promise<{ visitorId: string; campaigns: CampaignDTO[] }> {
    if (activate) {
      this.visitor.flagsData.forEach((value) => {
        if (value.campaignId === campaignId) {
          this.userExposed({ key: value.key, flag: value, defaultValue: value.value })
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

  async fetchFlags (): Promise<void> {
    return this.globalFetchFlags('fetchFlags')
  }

  async userExposed <T> (param:{key:string, flag?:FlagDTO, defaultValue:T, userExposed?: boolean}): Promise<void> {
    const { key, flag, defaultValue, userExposed } = param

    const functionName = 'userExposed'
    if (!flag) {
      logInfo(
        this.visitor.config,
        sprintf(USER_EXPOSED_FLAG_ERROR, key),
        functionName
      )
      return
    }

    let shouldBeExposed = userExposed

    if (typeof this.config.onUserExposed === 'function') {
      shouldBeExposed = this.config.onUserExposed({
        metadata: {
          campaignId: flag.campaignId,
          campaignType: flag.campaignType as string,
          slug: flag.slug,
          isReference: !!flag.isReference,
          variationGroupId: flag.variationGroupId,
          variationId: flag.variationId
        },
        visitor: this.visitor,
        shouldBeExposed: userExposed === undefined || userExposed
      })
    }

    if (shouldBeExposed === false) {
      return
    }

    if (defaultValue !== null && defaultValue !== undefined && flag.value && !hasSameType(flag.value, defaultValue)) {
      logInfo(
        this.visitor.config,
        sprintf(USER_EXPOSED_CAST_ERROR, key),
        functionName
      )
      return
    }

    if (this.isDeDuplicated(flag.variationGroupId + this.visitor.visitorId, this.config.activateDeduplicationTime as number)) {
      return
    }

    if (!this.hasTrackingManager(functionName)) {
      return
    }

    return this.sendActivate(flag, functionName)
  }

  getFlagValue<T> (param:{ key:string, defaultValue: T, flag?:FlagDTO, userExposed?: boolean}): T {
    const { key, defaultValue, flag, userExposed } = param
    const functionName = 'getFlag value'
    if (!flag) {
      logInfo(
        this.config,
        sprintf(GET_FLAG_MISSING_ERROR, key),
        functionName
      )
      return defaultValue
    }

    if (!flag.value) {
      if (userExposed) {
        this.userExposed({ key, flag, defaultValue })
      }
      return defaultValue
    }

    if (defaultValue !== null && defaultValue !== undefined && !hasSameType(flag.value, defaultValue)) {
      logInfo(
        this.config,
        sprintf(GET_FLAG_CAST_ERROR, key),
        functionName
      )
      return defaultValue
    }

    this.userExposed({ key, flag, defaultValue, userExposed })
    return flag.value
  }

  getFlagMetadata (param:{metadata:IFlagMetadata, key?:string, hasSameType:boolean}):IFlagMetadata {
    const { metadata, hasSameType: checkType, key } = param
    const functionName = 'flag.metadata'
    if (!checkType) {
      logInfo(
        this.visitor.config,
        sprintf(GET_METADATA_CAST_ERROR, key),
        functionName
      )
      return FlagMetadata.Empty()
    }

    return metadata
  }

  protected logDeactivateOnBucketing (functionName: string): void {
    logError(
      this.config,
      sprintf(METHOD_DEACTIVATED_BUCKETING_ERROR, functionName),
      functionName
    )
  }
}
