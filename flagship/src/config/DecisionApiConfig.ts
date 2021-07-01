import { DecisionMode, FlagshipConfig } from "./FlagshipConfig.ts";

export class DecisionApiConfig extends FlagshipConfig {
  public constructor(envId?: string, apiKey?: string) {
    super(envId, apiKey);
    this.decisionMode = DecisionMode.DECISION_API;
  }
}
