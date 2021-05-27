export enum Mode {
  /**
   * Flagship SDK mode decision api
   */
  DECISION_API,
  /**
   * Flagship SDK mode bucketing
   */
  BUCKETING,
}
export class FlagshipMode {
  static readonly DECISION_API: Mode = Mode.DECISION_API;

  static isFlagshipMode(value: Mode): boolean {
    switch (value) {
      case this.DECISION_API:
        return true;
      default:
        return false;
    }
  }
}
