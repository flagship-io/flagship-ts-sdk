import { Variation } from "./Variation.ts";
import { TargetingGroups } from "./TargetingGroups.ts";

export class VariationGroup {
  private _campaignId: string;
  private _variationGroupId: string;
  private _variations: Map<string, Variation>;
  private _targetingGroups: TargetingGroups;
  private _selectedVariationId: string;

  constructor(
    campaignId: string,
    variationGroupId: string,
    variations: Map<string, Variation>,
    targetingGroups: TargetingGroups,
    selectedVariationId: string
  ) {
    this._campaignId = campaignId;
    this._variationGroupId = variationGroupId;
    this._targetingGroups = targetingGroups;
    this._variations = variations;
    this._selectedVariationId = selectedVariationId;
  }

  public getCampaignId(): string {
    return this._campaignId;
  }

  public getVariationGroupId(): string {
    return this._variationGroupId;
  }

  public getVariations(): Map<string, Variation> {
    return this._variations;
  }

  public getTargetingGroups(): TargetingGroups {
    return this._targetingGroups;
  }

  public getSelectedVariationId(): string {
    return this._selectedVariationId;
  }

  public getSelectVariation(): Variation | undefined {
    if (this._selectedVariationId != null && this._variations != null) {
      return this._variations.get(this._selectedVariationId);
    }
    return undefined;
  }

  public selectVariation(visitorId: string): void {
    if (this._selectedVariationId != null && this._variations != null) {
      let p: number = 0;
      //THIS IS FOR BUCKETING
    }
  }

  public isTargetingValid(context: Map<string, Object>): boolean {
    if (this._targetingGroups != null) {
      return this._targetingGroups.isTargetingValid(context);
    }
    return true;
  }
}
