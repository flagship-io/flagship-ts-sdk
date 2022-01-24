export class ModificationsDTO {
  public type = '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public value:any;
}

export class VariationDTO {
  public id = '';
  public reference? = false;
  public modifications: ModificationsDTO = new ModificationsDTO();
}

export class CampaignDTO {
  public id = '';
  public variationGroupId = '';
  public variation: VariationDTO = new VariationDTO();
  public type? =''
}
