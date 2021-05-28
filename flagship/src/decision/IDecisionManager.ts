import { Campaign } from "../Model/Campaign.ts";
import { Modification } from "../Model/Modification.ts";

export interface IDecisionManager {
  getCampaigns(
    visitorId: string,
    context: Map<string, Object>
  ): Promise<Array<Campaign>>;

  getModifications(campaigns: Array<Campaign>): Map<string, Modification>;
}
