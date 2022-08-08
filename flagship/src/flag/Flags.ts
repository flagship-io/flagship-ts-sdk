import { hasSameType } from '../utils/utils'
import { VisitorDelegate } from '../visitor/index'
import { FlagMetadata, IFlagMetadata } from './FlagMetadata'

export type FlagValue<S> = {
  defaultValue: S,
  userExposed?: boolean
}

export interface IFlag<T>{
  /**
   * Return the current flag value if the flag key exists in Flagship and activate it if needed.
   * @param defaultValue
   * @param userExposed
   */
    getValue(userExposed?:boolean):T
    /**
     * Return true if the flag exists, false otherwise.
     */
    exists:()=>boolean
    /**
     * activate the current key
     */
    userExposed:()=>Promise<void>
    /**
     * Return The campaign metadata object.
     */
    metadata:IFlagMetadata
}

export class Flag<T> implements IFlag<T> {
  private _visitor:VisitorDelegate
  private _key:string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _defaultValue:any
  constructor (param: {key:string, visitor:VisitorDelegate, defaultValue:T}) {
    const { key, visitor, defaultValue } = param
    this._key = key
    this._visitor = visitor
    this._defaultValue = defaultValue
  }

  exists ():boolean {
    const flagDTO = this._visitor.flagsData.get(this._key)
    return !!(flagDTO?.campaignId && flagDTO.variationId && flagDTO.variationGroupId)
  }

  get metadata ():IFlagMetadata {
    const flagDTO = this._visitor.flagsData.get(this._key)
    const metadata = new FlagMetadata({
      campaignId: flagDTO?.campaignId || '',
      variationGroupId: flagDTO?.variationGroupId || '',
      variationId: flagDTO?.variationId || '',
      isReference: !!flagDTO?.isReference,
      campaignType: flagDTO?.campaignType || '',
      slug: flagDTO?.slug
    })

    if (!flagDTO) {
      return metadata
    }

    return this._visitor.getFlagMetadata({
      metadata,
      hasSameType: !flagDTO.value || hasSameType(flagDTO.value, this._defaultValue),
      key: flagDTO.key
    })
  }

  userExposed ():Promise<void> {
    const flagDTO = this._visitor.flagsData.get(this._key)
    return this._visitor.userExposed({ key: this._key, flag: flagDTO, defaultValue: this._defaultValue })
  }

  getValue (userExposed = true) : T {
    const flagDTO = this._visitor.flagsData.get(this._key)
    return this._visitor.getFlagValue({
      key: this._key,
      defaultValue: this._defaultValue,
      flag: flagDTO,
      userExposed
    })
  }
}
