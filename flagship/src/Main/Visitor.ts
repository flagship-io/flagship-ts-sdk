import { Modification } from "../Model/Modification.ts";
import { DecisionManager } from "../decision/DecisionManager.ts";
import { FlagshipConfig } from "./FlagshipConfig.ts";
import { FlagshipContext } from "./FlagshipContext.ts";
import { Campaign } from "../Model/Campaign.ts";

export class Visitor {
  private _visitorId: string;
  private _context: Map<string, unknown>;
  private _modifications: Map<string, Modification>;
  private _config: FlagshipConfig;

  constructor(
    visitorId: string,
    context: Map<string, unknown>,
    config: FlagshipConfig
  ) {
    this._visitorId = visitorId;
    this._context = new Map<string, unknown>();
    this._modifications = new Map<string, Modification>();
    this.updateContext(context);
    this._config = config;
  }

  public updateContext(context: Map<string, unknown>): void {
    if (context != null) {
      for (let [k, v] of Object.entries(context)) {
        this.updateContextKeyValue(k, v);
      }
    }
  }

  public updateContextKeyValue<Type>(key: string, value: Type): void {
    if (!this._config.decisionManager?.isPanic) {
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

  public async synchronizeModifications(): Promise<Visitor> {
    try {
      const campaigns: Array<Campaign> =
        await this._decisionManager.getCampaigns(
          this._visitorId,
          this._context
        );
      this._modifications.clear();
      if (!this._decisionManager.isPanic()) {
        const modifications: Map<string, Modification> =
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
