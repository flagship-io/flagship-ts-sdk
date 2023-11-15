import { FLAG_METADATA, NO_FLAG_METADATA } from '../enum/index'
import { FlagDTO, IFlagMetadata } from '../types'
import { forceVariation, hasSameType, logDebugSprintf } from '../utils/utils'
import { VisitorDelegate } from '../visitor/index'
import { FlagMetadata } from './FlagMetadata'

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
    const forcedFlagDTO = forceVariation({ flagDTO: visitorFlagDTO, visitor: this._visitor })
    const flagDTO = forcedFlagDTO || visitorFlagDTO
    return !!(flagDTO?.campaignId && flagDTO.variationId && flagDTO.variationGroupId)
  }

  get metadata ():IFlagMetadata {
    const visitorFlagDTO = this._visitor.flagsData.get(this._key)
    const forcedFlagDTO = forceVariation({ flagDTO: visitorFlagDTO, visitor: this._visitor })
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
    const forcedFlagDTO = forceVariation({ flagDTO, visitor: this._visitor })
    return this._visitor.visitorExposed({ key: this._key, flag: forcedFlagDTO || flagDTO, defaultValue: this._defaultValue })
  }

  protected addFlagAsExposed (flag?:FlagDTO) {
    if (!flag || !this._visitor.config.isQAModeEnabled) {
      return
    }
    const exposedVariations = this._visitor.exposedVariations
    const exposedVariation = exposedVariations?.find(x => x.campaignId === flag.campaignId)
    if (exposedVariation) {
      exposedVariation.variationId = flag.variationId
      exposedVariation.variationGroupId = flag.variationGroupId
      return
    }
    exposedVariations?.push({
      campaignId: flag.campaignId,
      variationGroupId: flag.variationGroupId,
      variationId: flag.variationId,
      originalVariationId: flag.originalVariationId || flag.variationId
    })
  }

  getValue (userExposed = true) : T {
    const flagDTO = this._visitor.flagsData.get(this._key)
    const forcedFlagDTO = forceVariation({ flagDTO, visitor: this._visitor })
    const flag = forcedFlagDTO || flagDTO

    this.addFlagAsExposed(flag)

    return this._visitor.getFlagValue({
      key: this._key,
      defaultValue: this._defaultValue,
      flag,
      userExposed
    })
  }
}
