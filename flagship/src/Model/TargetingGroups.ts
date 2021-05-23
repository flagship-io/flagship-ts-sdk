class TargetingGroups {
  private _targetingGroups: Array<TargetingList>;

  constructor(targetingGroups: Array<TargetingList>) {
    this._targetingGroups = targetingGroups;
  }

  /*   public static parse(jsonObject: JSON): TargetingGroups {
    try {
      let targetingGroup: Array<TargetingList>;
      for (let i = 0; i < Object.keys(jsonObject).length; i++) {
        let targetingList: TargetingList = TargetingList.parse(jsonObject[i]);
        if (targetingList != null) {
          targetingGroup.push(targetingList);
        }
        return new TargetingGroups(targetingGroup);
      }
    } catch (error) {
      return null;
    }
  } */

  public getTargetingGroups(): Array<TargetingList> {
    return this._targetingGroups;
  }

  public isTargetingValid(context: Map<string, Object>): boolean {
    if (this._targetingGroups != null) {
      this._targetingGroups.forEach((targetingGroup) => {
        if (targetingGroup.isTargetingValid(context)) {
          return true;
        }
      });
      return false;
    }
  }
}
