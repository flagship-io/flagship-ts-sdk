import { DL_API_ITEM } from '../enum/FlagshipConstant'
import { HitType } from '../enum/HitType'
import { HitAbstract, IHitAbstract } from './HitAbstract'

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

  public constructor (page:Omit<IPage, 'type'>) {
    super(HitType.PAGE_VIEW)
    this.documentLocation = page?.documentLocation
  }

  public isReady ():boolean {
    return !!(super.isReady() && this.documentLocation)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toApiKeys ():any {
    const apiKeys = super.toApiKeys()
    apiKeys[DL_API_ITEM] = this.documentLocation
    return apiKeys
  }

  public getErrorMessage (): string {
    return ERROR_MESSAGE
  }
}
