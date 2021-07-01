import { ETargetingCompCase } from "./ETargetingComp.ts";

export abstract class ITargetingComp {
  static compareObjects(
    contextValue: Object,
    flagshipValue: Object,
    etargetingEnum: ETargetingCompCase
  ): boolean;

  static compareObjects(
    contextValue: number,
    flagshipValue: number,
    etargetingEnum: ETargetingCompCase
  ): boolean {
    return ITargetingComp.compareObjects(
      contextValue,
      flagshipValue,
      etargetingEnum
    );
  }

  abstract compareInJsonArray(
    contextValue: Object,
    flagshipValue: JSON,
    etargetingEnum: ETargetingCompCase
  ): boolean;
}
