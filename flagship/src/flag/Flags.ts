import { FLAG_METADATA, NO_FLAG_METADATA } from '../enum/index'
import { FlagDTO, IFlagMetadata } from '../types'
import { hasSameType, logDebugSprintf } from '../utils/utils'
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
    const forcedFlagDTO = this.forceVariation(visitorFlagDTO)
    const flagDTO = forcedFlagDTO || visitorFlagDTO
    return !!(flagDTO?.campaignId && flagDTO.variationId && flagDTO.variationGroupId)
  }

  get metadata ():IFlagMetadata {
    const visitorFlagDTO = this._visitor.flagsData.get(this._key)
    const forcedFlagDTO = this.forceVariation(visitorFlagDTO)
    const flagDTO = forcedFlagDTO || visitorFlagDTO
    const metadata = new FlagMetadata({
      campaignId: flagDTO?.campaignId || '',
      variationGroupId: flagDTO?.variationGroupId || '',
      variationId: flagDTO?.variationId || '',
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
    const forcedFlagDTO = this.forceVariation(flagDTO)
    return this._visitor.visitorExposed({ key: this._key, flag: forcedFlagDTO || flagDTO, defaultValue: this._defaultValue })
  }

  private forceVariation (flagDTO?:FlagDTO): FlagDTO|null {
    if (!flagDTO) {
      return null
    }
    if (!this._visitor.config.enableQAMode || !this._visitor.forcedVariations) {
      return null
    }
    const forcedVariation = this._visitor.forcedVariations.find(x => x.campaignId === flagDTO?.campaignId)
    if (!forcedVariation) {
      return null
    }
    const bucketingContent = this._visitor.configManager.decisionManager.getBucketingContent()
    if (!bucketingContent) {
      return null
    }
    const campaign = bucketingContent.campaigns?.find(x => x.id === forcedVariation.campaignId)
    if (!campaign) {
      return null
    }
    const variationGroup = campaign.variationGroups.find(x => x.id === forcedVariation.variationGroupId)
    if (!variationGroup) {
      return null
    }
    const variation = variationGroup.variations.find(x => x.id === forcedVariation.variationId)
    if (!variation) {
      return null
    }
    return {
      key: this._key,
      campaignId: campaign.id,
      variationGroupId: variationGroup.id,
      variationId: variation.id,
      isReference: !!variation.reference,
      campaignType: campaign.type,
      slug: campaign.slug,
      value: variation.modifications.value[this._key]
    }
  }

  getValue (userExposed = true) : T {
    const flagDTO = this._visitor.flagsData.get(this._key)
    const forcedFlagDTO = this.forceVariation(flagDTO)
    return this._visitor.getFlagValue({
      key: this._key,
      defaultValue: this._defaultValue,
      flag: forcedFlagDTO || flagDTO,
      userExposed
    })
  }
}
