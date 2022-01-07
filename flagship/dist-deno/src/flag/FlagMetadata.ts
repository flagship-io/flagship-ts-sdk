
export interface IFlagMetadata{
    campaignId:string
    variationGroupId:string
    variationId: string
    isReference: boolean
    campaignType: string
}

export class FlagMetadata implements IFlagMetadata {
    campaignId:string
    variationGroupId:string
    variationId: string
    isReference: boolean
    campaignType: string
    constructor (flagMetadata:IFlagMetadata) {
      const { campaignId, variationGroupId, variationId, isReference, campaignType } = flagMetadata
      this.campaignId = campaignId
      this.variationGroupId = variationGroupId
      this.variationId = variationId
      this.isReference = isReference
      this.campaignType = campaignType
    }

    public static Empty ():IFlagMetadata {
      return new FlagMetadata({
        campaignId: '',
        campaignType: '',
        variationId: '',
        variationGroupId: '',
        isReference: false
      })
    }

    toJSON ():string {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { toJSON, ...metadata } = this
      return JSON.stringify(metadata.campaignId ? metadata : {})
    }
}
