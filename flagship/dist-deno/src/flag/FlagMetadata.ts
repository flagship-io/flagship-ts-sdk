import { IFlagMetadata } from '../types.ts'

export class FlagMetadata implements IFlagMetadata {
  campaignId:string
  variationGroupId:string
  variationId: string
  isReference: boolean
  campaignType: string
  slug?: string | null | undefined
  constructor (flagMetadata: Omit<IFlagMetadata, 'toJSON'>) {
    const { campaignId, variationGroupId, variationId, isReference, campaignType, slug } = flagMetadata
    this.campaignId = campaignId
    this.variationGroupId = variationGroupId
    this.variationId = variationId
    this.isReference = isReference
    this.campaignType = campaignType
    this.slug = slug
  }

  public static Empty ():IFlagMetadata {
    return new FlagMetadata({
      campaignId: '',
      campaignType: '',
      variationId: '',
      variationGroupId: '',
      isReference: false,
      slug: null
    })
  }
}
