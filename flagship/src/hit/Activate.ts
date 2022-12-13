import { ANONYMOUS_ID, CUSTOMER_ENV_ID_API_ACTIVATE, VARIATION_GROUP_ID_API_ITEM_ACTIVATE, VARIATION_ID_API_ITEM, VISITOR_ID_API_ITEM } from '../enum/index'
import { HitAbstract, IHitAbstract } from './HitAbstract'

export const ERROR_MESSAGE = 'variationGroupId and variationId are required'

export interface IActivate extends IHitAbstract{
    variationGroupId: string
    variationId: string
}

export class Activate extends HitAbstract implements IActivate {
  private _variationGroupId! : string
  private _variationId! : string

  public constructor (param:Omit<IActivate, 'type'|'createdAt'>) {
    super({
      type: 'ACTIVATE',
      userIp: param.userIp,
      screenResolution: param.screenResolution,
      locale: param.locale,
      sessionNumber: param.sessionNumber,
      visitorId: param.visitorId,
      anonymousId: param.anonymousId
    })
    this.variationGroupId = param.variationGroupId
    this.variationId = param.variationId
  }

  public get variationGroupId () : string {
    return this._variationGroupId
  }

  public set variationGroupId (v : string) {
    this._variationGroupId = v
  }

  public get variationId () : string {
    return this._variationId
  }

  public set variationId (v : string) {
    this._variationId = v
  }

  public isReady (checkParent = true):boolean {
    return !!((!checkParent || super.isReady()) && this.variationGroupId && this.variationId)
  }

  public toApiKeys ():Record<string, unknown> {
    const apiKeys:Record<string, unknown> = {
      [VISITOR_ID_API_ITEM]: this.anonymousId || this.visitorId,
      [VARIATION_ID_API_ITEM]: this.variationId,
      [VARIATION_GROUP_ID_API_ITEM_ACTIVATE]: this.variationGroupId,
      [CUSTOMER_ENV_ID_API_ACTIVATE]: this.config.envId,
      [ANONYMOUS_ID]: null
    }

    if (this.visitorId && this.anonymousId) {
      apiKeys[VISITOR_ID_API_ITEM] = this.visitorId
      apiKeys[ANONYMOUS_ID] = this.anonymousId
    }

    return apiKeys
  }

  public toObject ():Record<string, unknown> {
    return {
      ...super.toObject(),
      variationGroupId: this.variationGroupId,
      variationId: this.variationId
    }
  }

  public getErrorMessage (): string {
    return ERROR_MESSAGE
  }
}
