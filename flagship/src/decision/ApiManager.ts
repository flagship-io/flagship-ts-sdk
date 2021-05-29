import { BASE_API_URL, URL_CAMPAIGNS } from "../Enum/FlagshipConstant.ts";
import { FlagshipConfig } from "../Main/FlagshipConfig.ts";
import { Campaign } from "../Model/Campaign.ts";
import { OnStatusChangedListener } from "../Main/FlagshipConfig.ts";
import { DecisionManager } from "./DecisionManager.ts";
import { Flagship } from "../Main/Flagship.ts";
import { Status } from "../Main/Flagship.ts";
import { CampaignDTO } from "./api/models.ts";
import { VariationGroup } from "../Model/VariationGroup.ts";
import { TargetingGroups } from "../Model/TargetingGroups.ts";
import { Variation } from "../Model/Variation.ts";
import { Modifications } from "../Model/Modifications.ts";

export class ApiManager extends DecisionManager {
  constructor(config: FlagshipConfig) {
    super(config);
  }

  /*   public setOnStatusChangedListener(
    onStatusChangedListener: OnStatusChangedListener
  ): void {
    super.setOnStatusChangedListener(onStatusChangedListener);
    if (
      Flagship.getStatus() != Status.READY &&
      onStatusChangedListener !== undefined &&
      onStatusChangedListener.onStatusChanged !== undefined
    )
      onStatusChangedListener!.onStatusChanged(Status.READY);
  }*/

  public async getCampaigns(
    visitorId: string,
    context: Map<string, Object>
  ): Promise<Array<Campaign>> {
    let campaigns: Array<Campaign> = new Array<Campaign>();
    //let headers = new Map<>
    try {
      const data = await (
        await fetch(BASE_API_URL + "c0n48jn5thv01k0ijmo0" + URL_CAMPAIGNS, {
          method: "POST",
          headers: {
            "x-api-key": "BsIK86oh7c12c9G7ce4Wm1yBlWeaMf3t1S0xyYzI",
            "x-sdk-client": "Typescript",
            "x-sdk-version": "2.0.0",
          },
          body: JSON.stringify({
            visitorId: visitorId,
            trigger_hit: false,
            context: context,
          }),
        })
      ).json();

      if (data != null) {
        const newCampaigns: Array<CampaignDTO> = data.campaigns;
        if (newCampaigns != null) {
          campaigns = campaigns.concat(newCampaigns.map((c) => c as Campaign));
        }
      }

      return campaigns;
    } catch (e) {
      console.log("Error when calling Decision API: ", e);
      return campaigns;
    }
  }
}
