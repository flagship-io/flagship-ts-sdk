import { Modification } from "../model/Modification.ts";
import { Visitor } from "../visitor/Visitor.ts";

export interface IDecisionManager {
  isPanic(): boolean;

  getCampaignsModificationsAsync(
    visitor: Visitor,
  ): Promise<Map<string, Modification>>;
}
