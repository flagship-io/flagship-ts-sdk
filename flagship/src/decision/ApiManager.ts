import {
  BASE_API_URL,
  EXPOSE_ALL_KEYS,
  HEADER_APPLICATION_JSON,
  HEADER_CONTENT_TYPE,
  HEADER_X_API_KEY,
  HEADER_X_SDK_CLIENT,
  HEADER_X_SDK_VERSION,
  SDK_LANGUAGE,
  SDK_VERSION,
  URL_CAMPAIGNS,
} from "../enum/FlagshipConstant.ts";
import { DecisionManager } from "./DecisionManager.ts";
import { CampaignDTO } from "./api/models.ts";
import { Modification } from "../model/Modification.ts";
import { Visitor } from "../visitor/Visitor.ts";
import { logError } from "../utils/utils.ts";

export class ApiManager extends DecisionManager {
  private async getCampaignsAsync(visitor: Visitor) {
    try {
      const headers = {
        [HEADER_X_API_KEY]: `${this.config.apiKey}`,
        [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE,
        [HEADER_X_SDK_VERSION]: SDK_VERSION,
        [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON,
      };

      const postData = {
        visitorId: visitor.visitorId,
        // deno-lint-ignore camelcase
        trigger_hit: false,
        context: Object.fromEntries(visitor.context),
      };
      const url = `${BASE_API_URL}${this.config.envId}${URL_CAMPAIGNS}?${EXPOSE_ALL_KEYS}=true`;
      const data = await this._httpClient.postAsync(url, {
        headers,
        timeout: this.config.timeout,
        body: postData,
      });

      if (data.status >= 400) {
        logError(this.config, data.body, "getCampaignsAsync");
        return [];
      }

      this.panic = false;
      if (data.body.panic) {
        this.panic = true;
      }
      if (data.body.campaigns) {
        return data.body.campaigns;
      }
    } catch (error) {
      logError(this.config, error.message, "getCampaignsAsync");
    }
    return [];
  }

  private getModifications(campaigns: Array<CampaignDTO>) {
    const modifications = new Map<string, Modification>();
    campaigns.forEach((campaign) => {
      Object.entries(campaign.variation.modifications.value).forEach(
        ([key, value]) => {
          modifications.set(
            key,
            new Modification(
              key,
              campaign.id,
              campaign.variationGroupId,
              campaign.variation.id,
              campaign.variation.reference,
              value
            )
          );
        }
      );
    });
    return modifications;
  }

  public async getCampaignsModificationsAsync(
    visitor: Visitor
  ): Promise<Map<string, Modification>> {
    const campaigns = await this.getCampaignsAsync(visitor);
    return this.getModifications(campaigns);
  }
}
