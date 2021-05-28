import { FlagshipConfig } from "../Main/FlagshipConfig.ts";
import { IDecisionManager } from "../decision/IDecisionManager.ts";
import { Campaign } from "../Model/Campaign.ts";
import { Modification } from "../Model/Modification.ts";
import { OnStatusChangedListener } from "../Main/FlagshipConfig.ts";

export abstract class DecisionManager implements IDecisionManager {
  public _config: FlagshipConfig;
  private _panic: boolean = false;
  protected _onStatusChangedListener = null;

  constructor(config: FlagshipConfig) {
    this._config = config;
  }

  public getModifications(
    campaigns: Array<Campaign>
  ): Map<string, Modification> {
    let modifications: Map<string, Modification>;
    if (campaigns != null) {
      campaigns.forEach((campaign) => {
        Array.prototype.push.apply(modifications, campaign.getModifications());
      });
    }
    return modifications;
  }

  abstract getCampaigns(
    visitorId: string,
    context: Map<string, Object>
  ): Array<Campaign>;

  public isPanic(): boolean {
    return this._panic;
  }

  public setOnStatusChangedListener(
    onStatusChangedListener: OnStatusChangedListener
  ) {
    this._onStatusChangedListener = onStatusChangedListener;
  }
}
