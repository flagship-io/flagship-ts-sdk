export class Modification {
  private _key: string;
  private _campaignId: string;
  private _variationGroupId: string;
  private _variationId: string;
  private _isReference: boolean;
  private _value: unknown;

  constructor(
    key: string,
    campaignId: string,
    variationGroupId: string,
    variationId: string,
    isReference: boolean,
    value: unknown
  ) {
    this._key = key;
    this._campaignId = campaignId;
    this._variationGroupId = variationGroupId;
    this._variationId = variationId;
    this._isReference = isReference;
    this._value = value;
  }

  public getKey(): string {
    return this._key;
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

  public getValue(): unknown {
    return this._value;
  }
}
