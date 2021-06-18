import { Campaign } from "../Model/Campaign.ts";
import { Modification } from "../Model/Modification.ts";

export interface IDecisionManager {
  getCampaigns(
    visitorId: string,
    context: Map<string, unknown>
  ): Promise<Array<Campaign>>;
  isPanic(): boolean;
  getModifications(campaigns: Array<Campaign>): Map<string, Modification>;
}
