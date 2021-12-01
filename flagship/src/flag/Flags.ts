import { FlagDTO } from '../types'
import { VisitorDelegate } from '../visitor/index'
import { FlagMetadata, IFlagMetadata } from './FlagMetadata'

export interface IFlag{
  /**
   * Return the current flag value if the flag key exists in Flagship and activate it if needed.
   * @param defaultValue
   * @param userExposed
   */
    value<T>(defaultValue:T, userExposed?:boolean):T
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
    metadata:IFlagMetadata|null
}

export class Flag implements IFlag {
    private _visitor:VisitorDelegate
    private _flagDTO?: FlagDTO
    private _metadata:IFlagMetadata
    private _key:string
    constructor (key:string, visitor:VisitorDelegate, flagDTO?:FlagDTO) {
      this._key = key
      this._flagDTO = flagDTO
      this._visitor = visitor
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

    get metadata ():IFlagMetadata|null {
      return this.exists() ? this._visitor.getFlagMetadata(this._metadata) : null
    }

    userExposed ():Promise<void> {
      return this._visitor.userExposed(this._key, this._flagDTO)
    }

    value<T> (defaultValue: T, userExposed = true): T {
      return this._visitor.getFlagValue({ key: this._key, defaultValue, flag: this._flagDTO, userExposed })
    }
}
