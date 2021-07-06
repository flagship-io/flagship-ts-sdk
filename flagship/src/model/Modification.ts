export class Modification {
  private _key: string;
  private _campaignId: string;
  private _variationGroupId: string;
  private _variationId: string;
  private _isReference: boolean;
  // deno-lint-ignore no-explicit-any
  private _value: any;

  constructor(
    key: string,
    campaignId: string,
    variationGroupId: string,
    variationId: string,
    isReference: boolean,
    value: unknown,
  ) {
    this._key = key;
    this._campaignId = campaignId;
    this._variationGroupId = variationGroupId;
    this._variationId = variationId;
    this._isReference = isReference;
    this._value = value;
  }

  public get key(): string {
    return this._key;
  }

  public get campaignId(): string {
    return this._campaignId;
  }

  public get variationGroupId(): string {
    return this._variationGroupId;
  }

  public get variationId(): string {
    return this._variationId;
  }

  public get isReference(): boolean {
    return this._isReference;
  }

  // deno-lint-ignore no-explicit-any
  public get value(): any {
    return this._value;
  }
}
