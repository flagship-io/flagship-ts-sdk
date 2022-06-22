import { DL_API_ITEM } from '../enum/FlagshipConstant.ts'
import { HitType } from '../enum/HitType.ts'
import { HitAbstract, IHitAbstract } from './HitAbstract.ts'

export const ERROR_MESSAGE = 'documentLocation url is required'

export interface IPage extends IHitAbstract{
   documentLocation:string
}

export class Page extends HitAbstract implements IPage {
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

  public constructor (page:Omit<IPage, 'type'|'createdAt'>) {
    super({
      type: HitType.PAGE_VIEW,
      userIp: page.userIp,
      screenResolution: page.screenResolution,
      locale: page.locale,
      sessionNumber: page.sessionNumber
    })
    this.documentLocation = page.documentLocation
  }

  public isReady (checkParent = true):boolean {
    return !!((!checkParent || super.isReady()) && this.documentLocation)
  }

  public toApiKeys ():Record<string, unknown> {
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
