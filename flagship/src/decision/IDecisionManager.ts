import { Campaign } from "../Model/Campaign";
import { Modification } from "../Model/Modification";

export interface IDecisionManager {
  getCampaigns(
    visitorId: string,
    context: Map<string, Object>
  ): Array<Campaign>;

  getModifications(campaigns: Array<Campaign>): Map<string, Modification>;
}
