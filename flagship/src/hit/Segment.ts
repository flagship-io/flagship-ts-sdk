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

  public constructor (param:Omit<ISegment, 'type'>) {
    super({
      type: HitType.SEGMENT,
      userIp: param?.userIp,
      screenResolution: param?.screenResolution,
      locale: param?.locale,
      sessionNumber: param?.sessionNumber
    })
    this.sl = param.sl
  }

  public isReady (checkParent = true):boolean {
    return !!((!checkParent || super.isReady()) && this.sl)
  }

  public toApiKeys ():Record<string, unknown> {
    const apiKeys = super.toApiKeys()
    apiKeys[SL_ITEM] = this.sl
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
