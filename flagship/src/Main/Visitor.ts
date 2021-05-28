import { Modification } from "../Model/Modification.ts";
import { DecisionManager } from "../decision/DecisionManager.ts";
import { FlagshipConfig } from "./FlagshipConfig.ts";
import { Campaign } from "../Model/Campaign.ts";

export class Visitor {
  private _visitorId: string;
  private _context: Map<string, Object>;
  private _modifications: Map<string, Modification>;
  private _decisionManager: DecisionManager;

  constructor(
    config: FlagshipConfig,
    decisionManager: DecisionManager,
    visitorId: string,
    context: Map<string, Object>
  ) {
    this._decisionManager = decisionManager;
    this._visitorId = visitorId;
    this._context = new Map<string, Object>();
    this._modifications = new Map<string, Modification>();
    this.updateContext(context);
  }

  public updateContext(context: Map<string, Object>): void {
    if (context != null) {
      for (let [k, v] of Object.entries(context)) {
        this.updateContextKeyValue(k, v);
      }
    }
  }

  public updateContextKeyValue<Type>(key: string, value: Type): void {
    if (!this._decisionManager.isPanic()) {
      if (
        key != null &&
        (value instanceof String ||
          value instanceof Number ||
          value instanceof Boolean)
      ) {
        this._context.set(key, value);
      }
    }
  }

  public synchronizeModifications(): Visitor {
    try {
      let campaigns: Array<Campaign> = this._decisionManager.getCampaigns(
        this._visitorId,
        this._context
      );
      this._modifications.clear();
      if (!this._decisionManager.isPanic()) {
        let modifications: Map<string, Modification> =
          this._decisionManager.getModifications(campaigns);
        if (modifications != null) {
          this._modifications = modifications;
        }
      }
    } catch (error) {
      console.log(error);
    }
    return this;
  }
}
