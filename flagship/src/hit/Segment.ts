import { S_API_ITEM } from '../enum/index'
import { primitive } from '../types'
import { HitAbstract, IHitAbstract } from './HitAbstract'

export const ERROR_MESSAGE = 'data property is required'

export interface ISegment extends IHitAbstract{
    context:Record<string, primitive>
}

export class Segment extends HitAbstract implements ISegment {
  private _context!: Record<string, primitive>
  public get context (): Record<string, primitive> {
    return this._context
  }

  public set context (v: Record<string, primitive>) {
    this._context = v
  }

  public constructor (param:Omit<ISegment, 'type'|'createdAt'|'visitorInstanceId'|'traffic'>) {
    super({
      type: 'SEGMENT',
      userIp: param.userIp,
      screenResolution: param.screenResolution,
      locale: param.locale,
      sessionNumber: param.sessionNumber,
      visitorId: param.visitorId,
      anonymousId: param.anonymousId,
      qaMode: param.qaMode
    })
    this.context = param.context
  }

  public isReady (checkParent = true):boolean {
    return !!((!checkParent || super.isReady()) && this.context)
  }

  public toApiKeys ():Record<string, unknown> {
    const apiKeys = super.toApiKeys()
    apiKeys[S_API_ITEM] = this.context
    return apiKeys
  }

  public toObject ():Record<string, unknown> {
    return {
      ...super.toObject(),
      context: this.context
    }
  }

  public getErrorMessage (): string {
    return ERROR_MESSAGE
  }
}
