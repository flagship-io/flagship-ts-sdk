import { ETargetingComp } from "../utils/ETargetingComp.ts";
import { ETargetingCompCase } from "../utils/ETargetingComp.ts";

export class Targeting {
  key: string;
  value: Object;
  operator: string;

  constructor(key: string, value: Object, operator: string) {
    this.key = key;
    this.value = value;
    this.operator = operator;
  }

  /*   public static parse(jsonObject: JSON): Targeting {
    try {
      let key: string = jsonObject["key"];
      let value: Object = jsonObject["Object"];
      let operator: string = jsonObject["operator"];
      return new Targeting(key, value, operator);
    } catch (error) {
      console.log(error);
      return null;
    }
  } */

  public isTargetingValid(context: Map<String, Object>): boolean {
    let contextValue: Object = context;
    let comparator: ETargetingCompCase = ETargetingComp.get(this.operator);
    if (comparator == null || this.key == null) return false;
    else if (
      comparator == ETargetingCompCase.EQUALS &&
      this.key === "fs_all_users"
    )
      return true;
    else if (contextValue == null) return false;
    else
      return ETargetingComp.compareObjects(
        contextValue,
        this.value,
        comparator
      );
  }
}
