import { FlagDTO } from '../types'
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
    value():T
    value<S> (param:FlagValue<S>) : S
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
    private _flagDTO?: FlagDTO
    private _metadata:IFlagMetadata
    private _key:string
    private _defaultValue:any
    constructor (param: {key:string, visitor:VisitorDelegate, flagDTO?:FlagDTO, defaultValue:T}) {
      const { key, visitor, flagDTO, defaultValue } = param
      this._key = key
      this._flagDTO = flagDTO
      this._visitor = visitor
      this._defaultValue = defaultValue
      this._metadata = new FlagMetadata({
        campaignId: flagDTO?.campaignId || '',
        scenarioId: '',
        variationId: flagDTO?.variationId || '',
        customId: '',
        isReference: !!flagDTO?.isReference,
        campaignType: ''
      })
    }

    exists ():boolean {
      return !!this._flagDTO
    }

    get metadata ():IFlagMetadata {
      return this._visitor.getFlagMetadata({
        metadata: this._metadata,
        hasSameType: hasSameType(this._flagDTO?.value, this._defaultValue)
      })
    }

    userExposed ():Promise<void> {
      return this._visitor.userExposed({ key: this._key, flag: this._flagDTO, defaultValue: this._defaultValue })
    }

    value():T
    value<S> (param:FlagValue<S>) : S
    value<S> (param?:FlagValue<S>) : S|T {
      this._defaultValue = param?.defaultValue ?? this._defaultValue
      const userExposed = param?.userExposed ?? true

      return this._visitor.getFlagValue({
        key: this._key,
        defaultValue: this._defaultValue,
        flag: this._flagDTO,
        userExposed: userExposed
      })
    }
}
