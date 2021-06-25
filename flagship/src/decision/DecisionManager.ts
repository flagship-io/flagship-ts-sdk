import { FlagshipContext } from "../Main/FlagshipContext.ts";
import { IDecisionManager } from "../decision/IDecisionManager.ts";
import { Campaign } from "../Model/Campaign.ts";
import { Modification } from "../Model/Modification.ts";
import { OnStatusChangedListener } from "../Main/FlagshipConfig.ts";

export abstract class DecisionManager implements IDecisionManager {
  public _context: FlagshipContext;
  private _panic: boolean = false;
  protected _onStatusChangedListener = null;

  constructor(context: FlagshipContext) {
    this._context = context;
  }

  public getModifications(
    campaigns: Array<Campaign>
  ): Map<string, Modification> {
    let modifications: Map<string, Modification> = new Map<
      string,
      Modification
    >();
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
