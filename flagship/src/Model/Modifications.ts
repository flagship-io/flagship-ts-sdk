export class Modifications {
  private _campaignId: string;
  private _variationGroupId: string;
  private _variationId: string;
  private _isReference: boolean;
  private _type: string;
  private _values: Object;

  constructor(
    type: string,
    campaignId: string,
    variationGroupId: string,
    variationId: string,
    isReference: boolean,
    values: Object
  ) {
    this._type = type;
    this._campaignId = campaignId;
    this._variationGroupId = variationGroupId;
    this._variationId = variationId;
    this._isReference = isReference;
    this._values = values;
  }

  public getType(): string {
    return this._type;
  }

  public getCampaignId(): string {
    return this._campaignId;
  }

  public getVariationGroupId(): string {
    return this._variationGroupId;
  }

  public getVariationId(): string {
    return this._variationId;
  }

  public isReference(): boolean {
    return this._isReference;
  }

  public getValues(): Object {
    return this._values;
  }
}
