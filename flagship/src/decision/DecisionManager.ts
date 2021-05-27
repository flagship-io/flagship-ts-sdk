abstract class DecisionManager implements IDecisionManager {
  protected _config: FlagshipConfig;
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
