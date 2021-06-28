import { BASE_API_URL, URL_CAMPAIGNS } from "../Enum/FlagshipConstant";
import { Campaign } from "../Model/Campaign";
import { OnStatusChangedListener } from "../Main/FlagshipConfig";
import { DecisionManager } from "./DecisionManager";
import { Flagship } from "../Main/Flagship";
import { CampaignDTO } from "./api/models";
import { VariationGroup } from "../Model/VariationGroup";
import { TargetingGroups } from "../Model/TargetingGroups";
import { Variation } from "../Model/Variation";
import { Modifications } from "../Model/Modifications";
import { Modification } from "../Model/Modification";
import {FlagshipStatus} from "../Enum/FlagshipStatus";
import {FlagshipConfig} from "../config/FlagshipConfig";

export class ApiManager extends DecisionManager {

  async getCampaignsModifications(
    visitorId: string,
    context: Map<string, string | number | boolean>
  ): Promise<Map<string, Modification>> {
    const modifMap: Map<string, Modification> = new Map<string, Modification>();
    try {
      const data = await (
        await fetch(BASE_API_URL + this._config.envId + URL_CAMPAIGNS, {
          method: "POST",
          headers: {
            "x-api-key": this._config.apiKey,
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
