import { DL_API_ITEM } from '../enum/FlagshipConstant.ts'
import { HitType } from '../enum/HitType.ts'
import { HitAbstract, IHitAbstract } from './HitAbstract.ts'

export const ERROR_MESSAGE = 'Screen name is required'

export interface IScreen extends IHitAbstract{
  documentLocation:string
}

export class Screen extends HitAbstract implements IScreen {
  private _documentLocation!: string;
  public get documentLocation (): string {
    return this._documentLocation
  }

  public set documentLocation (v: string) {
    if (!this.isNotEmptyString(v, 'documentLocation')) {
      return
    }
    this._documentLocation = v
  }

  public constructor (screen: Omit<IScreen, 'type'>) {
    super({
      type: HitType.SCREEN_VIEW,
      userIp: screen?.userIp,
      screenResolution: screen?.screenResolution,
      locale: screen?.locale,
      sessionNumber: screen?.sessionNumber
    })
    this.documentLocation = screen?.documentLocation
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
