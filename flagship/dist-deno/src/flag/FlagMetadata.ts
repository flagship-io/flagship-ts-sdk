import { IFlagMetadata } from '../types.ts'

export class FlagMetadata implements IFlagMetadata {
  campaignId:string
  campaignName: string
  variationGroupId:string
  variationGroupName: string
  variationId: string
  variationName: string
  isReference: boolean
  campaignType: string
  slug?: string | null | undefined
  constructor (flagMetadata: Omit<IFlagMetadata, 'toJSON'>) {
    const { campaignId, variationGroupId, variationId, isReference, campaignType, slug, variationGroupName, variationName, campaignName } = flagMetadata
    this.campaignId = campaignId
    this.variationGroupId = variationGroupId
    this.variationId = variationId
    this.isReference = isReference
    this.campaignType = campaignType
    this.campaignName = campaignName
    this.variationGroupName = variationGroupName
    this.variationName = variationName
    this.slug = slug
  }

  public static Empty ():IFlagMetadata {
    return new FlagMetadata({
      campaignId: '',
      campaignName: '',
      campaignType: '',
      variationId: '',
      variationName: '',
      variationGroupId: '',
      variationGroupName: '',
      isReference: false,
      slug: null
    })
  }
}
