import { Campaign } from "../Model/Campaign.ts";
import { Modification } from "../Model/Modification.ts";

export interface IDecisionManager {
  isPanic(): boolean;

  getCampaignsModifications(
    visitorId: string,
    context: Map<string, unknown>
  ): Promise<Map<string, Modification>>;
}
