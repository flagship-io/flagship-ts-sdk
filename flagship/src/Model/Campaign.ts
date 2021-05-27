import { VariationGroup } from "./VariationGroup";
import { Modification } from "./Modification";
import { Variation } from "./Variation";

export class Campaign {
  private _id: string;
  private _variationGroups: Map<string, VariationGroup>;
  private _selectedVariationGroupId: string = null;

  constructor(
    id: string,
    variationGroups: Map<string, VariationGroup>,
    selectedVariationGroupId: string
  ) {
    this._id = id;
    this._variationGroups = variationGroups;
    this._selectedVariationGroupId = selectedVariationGroupId;
  }

  public getId(): string {
    return this._id;
  }

  public getVariationGroups(): Map<string, VariationGroup> {
    return this._variationGroups;
  }

  public selectVariation(visitorId: string): void {
    for (let [k, v] of Object.entries(this._variationGroups)) {
      let variationGroup: VariationGroup = v;
      variationGroup.selectVariation(visitorId);
    }
  }

  public selectedVariationGroupFromTargeting(
    context: Map<string, Object>
  ): boolean {
    for (let [k, v] of Object.entries(this._variationGroups)) {
      let variationGroup: VariationGroup = v;
      if (variationGroup.isTargetingValid(context)) {
        this._selectedVariationGroupId = variationGroup.getVariationGroupId();
        return true;
      }
    }
    return false;
  }

  public getSelectedVariationGroup(): VariationGroup {
    if (this._selectedVariationGroupId != null && this._variationGroups != null)
      return this._variationGroups.get(this._selectedVariationGroupId);
    return null;
  }

  public getModifications(): Map<string, Modification> {
    let modifications: Map<string, Modification>;
    let selectVariationGroup: VariationGroup = this.getSelectedVariationGroup();
    if (selectVariationGroup != null) {
      let selectedVariation: Variation =
        selectVariationGroup.getSelectVariation();
      if (selectedVariation != null) {
        Array.prototype.push.apply(
          modifications,
          selectedVariation.getModifications().getValues()
        );
      }
    }
    return modifications;
  }

  public toString(): String {
    return (
      "Campaign{" +
      "id='" +
      this._id +
      "'" +
      ", variationGroups=" +
      this._variationGroups +
      "}"
    );
  }
}
