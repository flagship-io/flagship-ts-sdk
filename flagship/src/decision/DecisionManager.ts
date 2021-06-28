import {IDecisionManager} from "../decision/IDecisionManager.ts";
import {Campaign} from "../Model/Campaign.ts";
import {Modification} from "../Model/Modification.ts";
import {FlagshipConfig} from "../config/FlagshipConfig";

export abstract class DecisionManager implements IDecisionManager {
    public _config: FlagshipConfig;
    private _panic: boolean = false;
    protected _onStatusChangedListener = null;

    protected constructor(config: FlagshipConfig) {
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

    /*   public setOnStatusChangedListener(
      onStatusChangedListener: OnStatusChangedListener
    ) {
      this._onStatusChangedListener = onStatusChangedListener;
    } */
}
