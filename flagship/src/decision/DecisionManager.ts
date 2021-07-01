import {IDecisionManager} from "./IDecisionManager.ts";
import {Campaign} from "../model/Campaign.ts";
import {Modification} from "../model/Modification.ts";
import {FlagshipConfig} from "../config/FlagshipConfig.ts";

export abstract class DecisionManager implements IDecisionManager {
    protected _config: FlagshipConfig;
    protected _panic = false;
    protected _onStatusChangedListener = null;

    public constructor(config: FlagshipConfig) {
        this._config = config;
    }

    public getModifications(
        campaigns: Array<Campaign>
    ): Map<string, Modification> {
        let modifications = new Map<string, Modification>();
        if (campaigns != null) {
            campaigns.forEach((campaign) => {
                modifications = campaign.getModifications();
            });
        }
        return modifications;
    }

    abstract getCampaignsModifications(
        visitorId: string,
        context: Map<string, unknown>
    ): Promise<Map<string, Modification>>;

    public isPanic(): boolean {
        return this._panic;
    }
}
