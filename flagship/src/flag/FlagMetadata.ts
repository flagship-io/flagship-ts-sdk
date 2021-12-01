
export interface IFlagMetadata{
    campaignId:string
    scenarioId:string
    variationId: string
    customId: string
    isReference: boolean
    campaignType: string
}

export class FlagMetadata implements IFlagMetadata {
    campaignId:string
    scenarioId:string
    variationId: string
    customId: string
    isReference: boolean
    campaignType: string
    constructor (flagMetadata:IFlagMetadata) {
      const { campaignId, scenarioId, variationId, customId, isReference, campaignType } = flagMetadata
      this.campaignId = campaignId
      this.scenarioId = scenarioId
      this.variationId = variationId
      this.customId = customId
      this.isReference = isReference
      this.campaignType = campaignType
    }

    toJSON ():string {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { toJSON, ...metadata } = this
      return JSON.stringify(metadata)
    }
}
