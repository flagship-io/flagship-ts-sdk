export type ModificationsDTO = {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value:any;
}

export type VariationDTO = {
  id: string
  name: string
  reference?:boolean;
  modifications: ModificationsDTO
}

export type CampaignDTO = {
  id:string
  name: string
  slug?:string|null
  variationGroupId: string;
  variationGroupName: string
  variation: VariationDTO;
  type?: string
}
