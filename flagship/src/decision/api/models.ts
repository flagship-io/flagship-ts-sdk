export class CampaignDTO {
  public id = "";
  public variationGroupId = "";
  public variation: VariationDTO = new VariationDTO();
}

export class VariationDTO {
  public id = "";
  public reference = false;
  public modifications: ModificationsDTO = new ModificationsDTO();
}

export class ModificationsDTO {
  public type = "";
  public value: Map<string, unknown> = new Map<string, unknown>();
}
