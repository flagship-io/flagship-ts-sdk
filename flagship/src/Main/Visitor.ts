import { Modification } from "../Model/Modification.ts";
import { FlagshipContext } from "./FlagshipContext.ts";
export class Visitor {
  private _visitorId: string;
  private _context: Map<string, unknown>;
  private _modifications: Map<string, Modification>;
  private _fsContext: FlagshipContext;

  constructor(
    visitorId: string,
    context: Map<string, unknown>,
    fsContext: FlagshipContext
  ) {
    this._visitorId = visitorId;
    this._context = new Map<string, unknown>();
    this._modifications = new Map<string, Modification>();
    this.updateContext(context);
    this._fsContext = fsContext;
  }

  public updateContext(context: Map<string, unknown>): void {
    if (context != null) {
      for (const [k, v] of Object.entries(context)) {
        this.updateContextKeyValue(k, v);
      }
    }
  }

  public updateContextKeyValue<Type>(key: string, value: Type): void {
    if (!this._fsContext.decisionManager?.isPanic) {
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
      const modifications: Map<string, Modification> | undefined =
        await this._fsContext.decisionManager?.getCampaignsModifications(
          this._visitorId,
          this._context
        );
      if (!this._fsContext.decisionManager?.isPanic() && modifications) {
        this._modifications.clear();
        this._modifications = modifications;
      }
    } catch (error) {
      console.log(error);
    }
    return this;
  }
}
