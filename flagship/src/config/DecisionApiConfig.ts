import {FlagshipConfig} from "./FlagshipConfig";
import {DecisionMode} from "../Enum/DecisionMode";

export class DecisionApiConfig extends FlagshipConfig{
    public constructor(envId?: string, apiKey?: string) {
        super(envId, apiKey);
        this.decisionMode = DecisionMode.DECISION_API
    }
}