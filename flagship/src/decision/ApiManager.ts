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
    context: Map<string, unknown>
  ): Promise<Array<Campaign>> {
    let campaigns: Array<Campaign> = new Array<Campaign>();
    //let headers = new Map<>
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
        if (newCampaigns != null) {
          campaigns = campaigns.concat(
            newCampaigns.map((c) => {
              const modifValue: Map<string, Modification> = new Map<
                string,
                Modification
              >();
              for (const [k, v] of Object.entries(
                c.variation.modifications.value
              )) {
                modifValue.set(
                  k,
                  new Modification(
                    k,
                    c.id,
                    c.variationGroupId,
                    c.variation.id,
                    c.variation.reference,
                    v
                  )
                );
              }

              return new Campaign(
                c.id,
                new Map<string, VariationGroup>([
                  [
                    c.variationGroupId,
                    new VariationGroup(
                      c.id,
                      c.variationGroupId,
                      new Map<string, Variation>([
                        [
                          c.variation.id,
                          new Variation(
                            c.id,
                            c.variationGroupId,
                            c.variation.id,
                            c.variation.reference,
                            new Modifications(
                              c.variation.modifications.type,
                              c.id,
                              c.variationGroupId,
                              c.variation.id,
                              c.variation.reference,
                              modifValue
                            ),
                            100
                          ),
                        ],
                      ]),
                      new TargetingGroups([]),
                      c.variation.id
                    ),
                  ],
                ]),
                c.variationGroupId
              );
            })
          );
        }
      }

      return campaigns;
    } catch (e) {
      console.log("Error when calling Decision API: ", e);
      return campaigns;
    }
  }
}
