class Variation {
  private _campaignId: string;
  private _variationGroupId: string;
  private _variationId: string;
  private _isReference: boolean;
  private _modifications: Modifications;
  private _allocation: number = 100;
  private _isSelected: boolean = false;

  constructor(
    campaignId: string,
    variationGroupId: string,
    variationId: string,
    isReference: boolean,
    modifications: Modifications,
    allocation: number
  ) {
    this._campaignId = campaignId;
    this._variationGroupId = variationGroupId;
    this._variationId = variationId;
    this._isReference = isReference;
    this._modifications = modifications;
    this._allocation = allocation;
  }

  public getCompaignId(): string {
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

  public getModifications(): Modifications {
    return this._modifications;
  }

  public getAllocation(): number {
    return this._allocation;
  }

  public isSelected(): boolean {
    return this._isSelected;
  }

  public setSelected(selected: boolean): void {
    this._isSelected = selected;
  }

  public toString(): string {
    return (
      "Variation{" +
      "campaignId='" +
      this._campaignId +
      "'" +
      ", variationGroupId='" +
      this._variationGroupId +
      "'" +
      ", variationId='" +
      this._variationId +
      "'" +
      ", isReference=" +
      this._isReference +
      ", modifications=" +
      this._modifications +
      ", allocation=" +
      this._allocation +
      ", isSelected=" +
      this._isSelected +
      "}"
    );
  }
}
