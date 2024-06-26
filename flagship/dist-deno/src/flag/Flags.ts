import { FLAG_METADATA, NO_FLAG_METADATA } from '../enum/index.ts'
import { IFlagMetadata } from '../types.ts'
import { hasSameType, logDebugSprintf } from '../utils/utils.ts'
import { VisitorDelegate } from '../visitor/index.ts'
import { FlagMetadata } from './FlagMetadata.ts'
import { forceVariation } from './forceVariation.ts'

export type FlagValue<S> = {
  defaultValue: S,
  userExposed?: boolean
}

export interface IFlag<T>{
  /**
   * Return the current flag value if the flag key exists in Flagship and expose it if needed.
   * @param visitorExposed Default True, if true it will report the flag exposure
   */
    getValue(visitorExposed?:boolean):T
    /**
     * Return true if the flag exists, false otherwise.
     */
    exists:()=>boolean

    /**
     * Tells Flagship the user have been exposed and have seen this flag
     * @deprecated use **visitorExposed** instead
     */
    userExposed:()=>Promise<void>

    /**
     * Tells Flagship the visitor have been exposed and have seen this flag
     * @returns
     */
    visitorExposed:()=>Promise<void>
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
    const visitorFlagDTO = this._visitor.flagsData.get(this._key)
    const forcedFlagDTO = forceVariation({ flagDTO: visitorFlagDTO, config: this._visitor.config })
    const flagDTO = forcedFlagDTO || visitorFlagDTO
    return !!(flagDTO?.campaignId && flagDTO.variationId && flagDTO.variationGroupId)
  }

  get metadata ():IFlagMetadata {
    const visitorFlagDTO = this._visitor.flagsData.get(this._key)
    const forcedFlagDTO = forceVariation({ flagDTO: visitorFlagDTO, config: this._visitor.config })
    const flagDTO = forcedFlagDTO || visitorFlagDTO
    const metadata = new FlagMetadata({
      campaignId: flagDTO?.campaignId || '',
      campaignName: flagDTO?.campaignName || '',
      variationGroupId: flagDTO?.variationGroupId || '',
      variationGroupName: flagDTO?.variationGroupName || '',
      variationId: flagDTO?.variationId || '',
      variationName: flagDTO?.variationName || '',
      isReference: !!flagDTO?.isReference,
      campaignType: flagDTO?.campaignType || '',
      slug: flagDTO?.slug
    })

    if (!flagDTO) {
      logDebugSprintf(this._visitor.config, FLAG_METADATA, NO_FLAG_METADATA, this._visitor.visitorId, this._key, metadata)
      return metadata
    }

    return this._visitor.getFlagMetadata({
      metadata,
      hasSameType: flagDTO.value === null || this._defaultValue === null || this._defaultValue === undefined || hasSameType(flagDTO.value, this._defaultValue),
      key: flagDTO.key
    })
  }

  userExposed ():Promise<void> {
    return this.visitorExposed()
  }

  visitorExposed () : Promise<void> {
    const flagDTO = this._visitor.flagsData.get(this._key)
    const forcedFlagDTO = forceVariation({ flagDTO, config: this._visitor.config })
    return this._visitor.visitorExposed({ key: this._key, flag: forcedFlagDTO || flagDTO, defaultValue: this._defaultValue })
  }

  getValue (userExposed = true) : T {
    const flagDTO = this._visitor.flagsData.get(this._key)
    const forcedFlagDTO = forceVariation({ flagDTO, config: this._visitor.config })

    const flag = forcedFlagDTO || flagDTO

    this._visitor.sendExposedVariation(flag)

    return this._visitor.getFlagValue({
      key: this._key,
      defaultValue: this._defaultValue,
      flag,
      userExposed
    })
  }
}
