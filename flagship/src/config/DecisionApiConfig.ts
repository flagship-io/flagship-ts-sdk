import { DecisionMode, FlagshipConfig } from "./FlagshipConfig";

export class DecisionApiConfig extends FlagshipConfig {
  public constructor(envId?: string, apiKey?: string) {
    super(envId, apiKey);
    this._decisionMode = DecisionMode.DECISION_API;
  }
}
