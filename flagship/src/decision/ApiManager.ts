import { BASE_API_URL, URL_CAMPAIGNS } from "../Enum/FlagshipConstant";

class ApiManager extends DecisionManager {
  public constructor(config: FlagshipConfig) {
    super(config);
  }

  public setOnStatusChangedListener(
    onStatusChangedListener: OnStatusChangedListener
  ): void {
    super.setOnStatusChangedListener(onStatusChangedListener);
    if (Flagship.getStatus() != Status.READY)
      onStatusChangedListener.onStatusChanged(Status.READY);
  }

  public getCampaigns(
    visitorId: string,
    context: Map<string, Object>
  ): Array<Campaign> {
    let campaigns: Array<Campaign>;
    //let headers = new Map<>
    window
      .fetch(BASE_API_URL + this._config.getEnvId() + URL_CAMPAIGNS, {
        method: "POST",
        headers: {
          "x-api-key": this._config.getApiKey(),
          "x-sdk-client": "Typescript",
          "x-sdk-version": "2.0.0",
        },
        body: JSON.stringify({
          visitorId: visitorId,
          trigger_hit: false,
          context: context,
        }),
      })
      .then((res) => res.json())
      .then((data) => {
        if (data != null) {
          let newCampaigns: Array<Campaign> = data?.campaigns;
          if (newCampaigns != null) {
            campaigns.concat(newCampaigns);
            campaigns = [...campaigns, ...newCampaigns];
          }
        }
      });

    //let newCampaigns: Array<Campaign> = await response.json();

    return campaigns;
  }
}
