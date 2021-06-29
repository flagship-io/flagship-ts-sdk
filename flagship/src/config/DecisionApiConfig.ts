import {FlagshipConfig} from "./FlagshipConfig.ts";
import {DecisionMode} from "../enum/DecisionMode.ts";

export class DecisionApiConfig extends FlagshipConfig{
    public constructor(envId?: string, apiKey?: string) {
        super(envId, apiKey);
        this.decisionMode = DecisionMode.DECISION_API
    }
}