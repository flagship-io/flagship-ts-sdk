export type ModificationsDTO = {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value:any;
}

export type VariationDTO = {
  id: string
  reference?:boolean;
  modifications: ModificationsDTO
}

export type CampaignDTO = {
  id:string
  slug?:string|null
  variationGroupId: string;
  variation: VariationDTO;
  type?: string
}
