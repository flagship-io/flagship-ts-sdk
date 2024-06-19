import { ANONYMOUS_ID, CUSTOMER_ENV_ID_API_ACTIVATE, QT_API_ITEM, VARIATION_GROUP_ID_API_ITEM_ACTIVATE, VARIATION_ID_API_ITEM, VISITOR_ID_API_ITEM } from '../enum/index.ts'
import { IFSFlagMetadata, primitive } from '../types.ts'
import { HitAbstract, IHitAbstract } from './HitAbstract.ts'

export const ERROR_MESSAGE = 'variationGroupId and variationId are required'

export interface IActivate extends IHitAbstract{
    variationGroupId: string
    variationId: string
    flagKey: string
    flagValue: unknown
    flagDefaultValue: unknown
    flagMetadata: IFSFlagMetadata
    visitorContext: Record<string, primitive>
}

export class Activate extends HitAbstract implements IActivate {
  private _variationGroupId! : string
  private _variationId! : string
  private _flagKey! : string
  private _flagValue! : unknown
  private _flagDefaultValue! : unknown
  private _flagMetadata! : IFSFlagMetadata
  private _visitorContext! : Record<string, primitive>

  public constructor (param:Omit<IActivate, 'type'|'createdAt'|'traffic'>) {
    super({
      type: 'ACTIVATE',
      userIp: param.userIp,
      screenResolution: param.screenResolution,
      locale: param.locale,
      sessionNumber: param.sessionNumber,
      visitorId: param.visitorId,
      anonymousId: param.anonymousId
    })
    const {
      variationGroupId, variationId, flagKey, flagValue,
      flagDefaultValue, flagMetadata, visitorContext
    } = param
    this.variationGroupId = variationGroupId
    this.variationId = variationId
    this.flagKey = flagKey
    this.flagValue = flagValue
    this.flagDefaultValue = flagDefaultValue
    this.flagMetadata = flagMetadata
    this.visitorContext = visitorContext
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

  public get flagKey () : string {
    return this._flagKey
  }

  public set flagKey (v : string) {
    this._flagKey = v
  }

  public get flagValue () : unknown {
    return this._flagValue
  }

  public set flagValue (v : unknown) {
    this._flagValue = v
  }

  public get flagDefaultValue () : unknown {
    return this._flagDefaultValue
  }

  public set flagDefaultValue (v : unknown) {
    this._flagDefaultValue = v
  }

  public get flagMetadata () : IFSFlagMetadata {
    return this._flagMetadata
  }

  public set flagMetadata (v : IFSFlagMetadata) {
    this._flagMetadata = v
  }

  public get visitorContext () : Record<string, primitive> {
    return this._visitorContext
  }

  public set visitorContext (v : Record<string, primitive>) {
    this._visitorContext = v
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
      [ANONYMOUS_ID]: null,
      [QT_API_ITEM]: Date.now() - this.createdAt
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
