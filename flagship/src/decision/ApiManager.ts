import { BASE_API_URL, URL_CAMPAIGNS } from "../Enum/FlagshipConstant.ts";
import { FlagshipContext } from "../Main/FlagshipContext.ts";
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
import { Modification } from "../Model/Modification.ts";

export class ApiManager extends DecisionManager {
  constructor(context: FlagshipContext) {
    super(context);
  }

  async getCampaignsModifications(
    visitorId: string,
    context: Map<string, unknown>
  ): Promise<Map<string, Modification>> {
    const modifMap: Map<string, Modification> = new Map<string, Modification>();
    try {
      const data = await (
        await fetch(BASE_API_URL + this._context.getEnvId() + URL_CAMPAIGNS, {
          method: "POST",
          headers: {
            "x-api-key": this._context.getApiKey(),
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
        newCampaigns.forEach((campaign) => {
          Object.entries(campaign.variation.modifications.value).forEach(
            ([k, v]) => {
              modifMap.set(
                k,
                new Modification(
                  k,
                  campaign.id,
                  campaign.variationGroupId,
                  campaign.variation.id,
                  campaign.variation.reference,
                  v
                )
              );
            }
          );
        });
      }
    } catch (e) {
      console.log("Error when calling Decision API: ", e);
    }
    return modifMap;
  }
}
