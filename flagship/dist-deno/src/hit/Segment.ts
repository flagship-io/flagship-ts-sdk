import { primitive } from '../types.ts'
import { HitAbstract, IHitAbstract } from './HitAbstract.ts'

export const ERROR_MESSAGE = 'sl is required'

export interface ISegment extends IHitAbstract{
    data:Record<string, primitive>
}

export class Segment extends HitAbstract implements ISegment {
  private _data!: Record<string, primitive>;
  public get data (): Record<string, primitive> {
    return this._data
  }

  public set data (v: Record<string, primitive>) {
    this._data = v
  }

  public constructor (param:Omit<ISegment, 'type'|'createdAt'>) {
    super({
      type: 'CONTEXT',
      userIp: param.userIp,
      screenResolution: param.screenResolution,
      locale: param.locale,
      sessionNumber: param.sessionNumber,
      visitorId: param.visitorId,
      anonymousId: param.anonymousId
    })
    this.data = param.data
  }

  public isReady (checkParent = true):boolean {
    return !!((!checkParent || super.isReady()) && this.data)
  }

  public toApiKeys ():Record<string, unknown> {
    return {
      visitorId: this.visitorId,
      data: this.data,
      type: this.type
    }
  }

  public toObject ():Record<string, unknown> {
    return {
      ...super.toObject(),
      data: this.data
    }
  }

  public getErrorMessage (): string {
    return ERROR_MESSAGE
  }
}
