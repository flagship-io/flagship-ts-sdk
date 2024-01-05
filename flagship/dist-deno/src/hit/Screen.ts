import { DL_API_ITEM } from '../enum/FlagshipConstant.ts'
import { HitType } from '../enum/HitType.ts'
import { HitAbstract, IHitAbstract } from './HitAbstract.ts'

export const ERROR_MESSAGE = 'Screen name is required'

export interface IScreen extends IHitAbstract{
  documentLocation:string
}

export class Screen extends HitAbstract implements IScreen {
  private _documentLocation!: string
  public get documentLocation (): string {
    return this._documentLocation
  }

  public set documentLocation (v: string) {
    if (!this.isNotEmptyString(v, 'documentLocation')) {
      return
    }
    this._documentLocation = v
  }

  public constructor (param: Omit<IScreen, 'type'|'createdAt'|'visitorInstanceId'|'traffic'>) {
    super({
      type: HitType.SCREEN_VIEW,
      userIp: param.userIp,
      screenResolution: param.screenResolution,
      locale: param.locale,
      sessionNumber: param.sessionNumber,
      visitorId: param.visitorId,
      anonymousId: param.anonymousId
    })
    this.documentLocation = param.documentLocation
  }

  public isReady (checkParent = true):boolean {
    return !!((!checkParent || super.isReady()) && this.documentLocation)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toApiKeys ():any {
    const apiKeys = super.toApiKeys()
    apiKeys[DL_API_ITEM] = this.documentLocation
    return apiKeys
  }

  public toObject ():Record<string, unknown> {
    return {
      ...super.toObject(),
      documentLocation: this.documentLocation
    }
  }

  public getErrorMessage (): string {
    return ERROR_MESSAGE
  }
}
