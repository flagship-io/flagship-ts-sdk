import { Targeting } from "./Targeting.ts";

export class TargetingList {
  private _targetingList: Array<Targeting>;

  constructor(targetingList: Array<Targeting>) {
    this._targetingList = targetingList;
  }

  /*   public static parse(jsonObject: JSON): TargetingList {
    try {
      let targetingList: Array<Targeting>;
      let targetingArray: JSON = jsonObject["targetings"];
      for (let i = 0; i < Object.keys(targetingArray).length; i++) {
        let targeting: Targeting = Targeting.parse(targetingArray[i]);
        if (targeting != null) {
          targetingList.push(targeting);
        }
        return new TargetingList(targetingList);
      }
    } catch (error) {
      return null;
    }
  } */

  public getTargetingList(): Array<Targeting> {
    return this._targetingList;
  }

  public isTargetingValid(context: Map<string, Object>): boolean {
    if (this._targetingList != null) {
      this._targetingList.forEach((targeting) => {
        if (!targeting.isTargetingValid(context)) {
          return false;
        }
      });
      return true;
    }
  }
}
