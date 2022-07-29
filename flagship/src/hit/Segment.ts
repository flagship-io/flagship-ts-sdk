import { SL_ITEM } from '../enum/FlagshipConstant'
import { HitType } from '../enum/HitType'
import { primitive } from '../types'
import { HitAbstract, IHitAbstract } from './HitAbstract'

export const ERROR_MESSAGE = 'sl is required'

export interface ISegment extends IHitAbstract{
    sl:Record<string, primitive>
}

export class Segment extends HitAbstract implements ISegment {
  private _sl!: Record<string, primitive>;
  public get sl (): Record<string, primitive> {
    return this._sl
  }

  public set sl (v: Record<string, primitive>) {
    this._sl = v
  }

  public constructor (param:Omit<ISegment, 'type'|'createdAt'>) {
    super({
      type: HitType.SEGMENT,
      userIp: param.userIp,
      screenResolution: param.screenResolution,
      locale: param.locale,
      sessionNumber: param.sessionNumber,
      visitorId: param.visitorId,
      anonymousId: param.anonymousId
    })
    this.sl = param.sl
  }

  public isReady (checkParent = true):boolean {
    return !!((!checkParent || super.isReady()) && this.sl)
  }

  public toApiKeys ():Record<string, unknown> {
    const apiKeys = super.toApiKeys()
    const context:Record<string, string> = {}
    Object.entries(this.sl).forEach(([key, value]) => {
      context[key] = value.toString()
    })
    apiKeys[SL_ITEM] = context
    return apiKeys
  }

  public toObject ():Record<string, unknown> {
    return {
      ...super.toObject(),
      sl: this.sl
    }
  }

  public getErrorMessage (): string {
    return ERROR_MESSAGE
  }
}
