import { VariationGroup } from "./VariationGroup.ts";
import { Modification } from "./Modification.ts";
import { Variation } from "./Variation.ts";

export class Campaign {
  private _id: string;
  private _variationGroups: Map<string, VariationGroup>;
  private _selectedVariationGroupId: string;

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
    for (const [k, v] of Object.entries(this._variationGroups)) {
      const variationGroup: VariationGroup = v;
      variationGroup.selectVariation(visitorId);
    }
  }

  public selectedVariationGroupFromTargeting(
    context: Map<string, Object>
  ): boolean {
    for (const [k, v] of Object.entries(this._variationGroups)) {
      const variationGroup: VariationGroup = v;
      if (variationGroup.isTargetingValid(context)) {
        this._selectedVariationGroupId = variationGroup.getVariationGroupId();
        return true;
      }
    }
    return false;
  }

  public getSelectedVariationGroup(): VariationGroup | undefined {
    if (this._selectedVariationGroupId != null && this._variationGroups != null)
      return this._variationGroups.get(this._selectedVariationGroupId);
    return undefined;
  }

  public getModifications(): Map<string, Modification> {
    let modifications: Map<string, Modification> = new Map<
      string,
      Modification
    >();
    let selectVariationGroup: VariationGroup | undefined =
      this.getSelectedVariationGroup();
    if (selectVariationGroup != null) {
      let selectedVariation: Variation | undefined =
        selectVariationGroup.getSelectVariation();
      if (selectedVariation != undefined) {
        Array.prototype.push.apply(
          modifications,
          selectedVariation.getModifications().getValues()
        );
      }
    }
    return modifications;
  }

  public toString(): string {
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
