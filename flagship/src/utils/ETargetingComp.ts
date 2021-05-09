enum ETargetingCompCase {
  EQUALS = "EQUALS",
  NOT_EQUALS = "NOT_EQUALS",
  CONTAINS = "CONTAINS",
  NOT_CONTAINS = "NOT_CONTAINS",
  GREATER_THAN = "GREATER_THAN",
  LOWER_THAN = "LOWER_THAN",
  GREATER_THAN_OR_EQUALS = "GREATER_THAN_OR_EQUALS",
  LOWER_THAN_OR_EQUALS = "LOWER_THAN_OR_EQUALS",
  STARTS_WITH = "STARTS_WITH",
  ENDS_WITH = "ENDS_WITH",
}

class ETargetingComp implements ITargetingComp {
  public static get(name: string): ETargetingCompCase {
    for (let e in Object.keys(ETargetingCompCase)) {
      if (e === name) {
        return ETargetingCompCase[e];
      }
    }
    return null;
  }

  public static compareObjects(
    contextValue: Object,
    flagshipValue: Object,
    etargetingEnum: ETargetingCompCase
  ): boolean {
    switch (etargetingEnum) {
      case ETargetingCompCase.EQUALS:
        return contextValue === flagshipValue;

      case ETargetingCompCase.NOT_EQUALS:
        return !contextValue === flagshipValue;

      case ETargetingCompCase.CONTAINS:
        return contextValue.toString().includes(flagshipValue.toString());

      case ETargetingCompCase.NOT_CONTAINS:
        return !contextValue.toString().includes(flagshipValue.toString());

      case ETargetingCompCase.GREATER_THAN:
        return (
          contextValue.toString().localeCompare(flagshipValue.toString()) > 0
        );

      case ETargetingCompCase.LOWER_THAN:
        return (
          contextValue.toString().localeCompare(flagshipValue.toString()) < 0
        );

      case ETargetingCompCase.GREATER_THAN_OR_EQUALS:
        return (
          contextValue.toString().localeCompare(flagshipValue.toString()) >= 0
        );

      case ETargetingCompCase.LOWER_THAN_OR_EQUALS:
        return (
          contextValue.toString().localeCompare(flagshipValue.toString()) <= 0
        );

      case ETargetingCompCase.STARTS_WITH:
        return contextValue.toString().startsWith(flagshipValue.toString());

      case ETargetingCompCase.ENDS_WITH:
        return contextValue.toString().endsWith(flagshipValue.toString());
    }
  }

  public compareNumbers(
    contextValue: Number,
    flagshipValue: Number,
    etargetingEnum: ETargetingCompCase
  ): boolean {
    switch (etargetingEnum) {
      case ETargetingCompCase.EQUALS:
        return contextValue === flagshipValue;

      case ETargetingCompCase.NOT_EQUALS:
        return contextValue !== flagshipValue;

      case ETargetingCompCase.GREATER_THAN:
        return contextValue > flagshipValue;

      case ETargetingCompCase.LOWER_THAN:
        return contextValue < flagshipValue;

      case ETargetingCompCase.GREATER_THAN_OR_EQUALS:
        return contextValue >= flagshipValue;

      case ETargetingCompCase.LOWER_THAN_OR_EQUALS:
        return contextValue <= flagshipValue;
    }
  }

  public compareInJsonArray(
    contextValue: Object,
    flagshipValue: JSON,
    etargetingEnum: ETargetingCompCase
  ): boolean {
    switch (etargetingEnum) {
      case ETargetingCompCase.EQUALS:
        for (let i in Object.keys(flagshipValue)) {
          let obj = Object.values(flagshipValue)[i];
          if (
            contextValue instanceof Number &&
            obj instanceof Number &&
            this.compareNumbers(contextValue, obj, ETargetingCompCase.EQUALS)
          )
            return true;
          else if (
            ETargetingComp.compareObjects(
              contextValue,
              obj,
              ETargetingCompCase.EQUALS
            )
          )
            return true;
        }
        return false;

      case ETargetingCompCase.NOT_EQUALS:
        for (let i in Object.keys(flagshipValue)) {
          let obj = Object.values(flagshipValue)[i];
          if (
            contextValue instanceof Number &&
            obj instanceof Number &&
            !this.compareNumbers(
              contextValue,
              obj,
              ETargetingCompCase.NOT_EQUALS
            )
          )
            return false;
          else if (
            !ETargetingComp.compareObjects(
              contextValue,
              obj,
              ETargetingCompCase.NOT_EQUALS
            )
          )
            return false;
        }
        return true;

      case ETargetingCompCase.CONTAINS:
        for (let i in Object.keys(flagshipValue)) {
          let obj = Object.values(flagshipValue)[i];
          if (
            ETargetingComp.compareObjects(
              contextValue,
              obj,
              ETargetingCompCase.CONTAINS
            )
          )
            return true;
        }
        return false;

      case ETargetingCompCase.NOT_CONTAINS:
        for (let i in Object.keys(flagshipValue)) {
          let obj = Object.values(flagshipValue)[i];
          if (
            !ETargetingComp.compareObjects(
              contextValue,
              obj,
              ETargetingCompCase.CONTAINS
            )
          )
            return false;
        }
        return true;
    }
  }
}
