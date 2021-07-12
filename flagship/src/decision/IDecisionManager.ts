import { Modification } from "../model/Modification";
import { Visitor } from "../visitor/Visitor";

export interface IDecisionManager {
  isPanic(): boolean;

  getCampaignsModificationsAsync(
    visitor: Visitor,
  ): Promise<Map<string, Modification>>;
}
