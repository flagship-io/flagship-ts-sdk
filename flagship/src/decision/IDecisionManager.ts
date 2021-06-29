import { Modification } from "../model/Modification.ts";

export interface IDecisionManager {
  isPanic(): boolean;

  getCampaignsModifications(
    visitorId: string,
    context: Map<string, string | number | boolean>
  ): Promise<Map<string, Modification>>;
}
