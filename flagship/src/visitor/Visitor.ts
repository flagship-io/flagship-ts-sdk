import { Modification } from "../model/Modification.ts";
import { ConfigManager } from "../config/ConfigManager.ts";
import {
  VISITOR_ID_ERROR,
  GET_MODIFICATION_KEY_ERROR,
  GET_MODIFICATION_MISSING_ERROR,
  GET_MODIFICATION_CAST_ERROR,
} from "../enum/FlagshipConstant.ts";
import { sprintf } from "../utils/utils.ts";

export class Visitor {
  private _visitorId: string;
  private _context!: Map<string, string | number | boolean>;
  private _modifications: Map<string, Modification>;
  private _configManager: ConfigManager;

  constructor(
    visitorId: string,
    context: Map<string, string | number | boolean>,
    configManager: ConfigManager
  ) {
    this._visitorId = visitorId;
    this._modifications = new Map<string, Modification>();
    this._configManager = configManager;
    this._context = new Map<string, string | number | boolean>();
    this.updateContext(context);
  }

  public get visitorId(): string {
    return this._visitorId;
  }

  public set visitorId(v: string) {
    //To do config.Logger
    if (!v) {
      console.log(VISITOR_ID_ERROR);
      return;
    }
    this._visitorId = v;
  }

  public get context(): Map<string, string | number | boolean> {
    return this._context;
  }

  /**
   * Clear the current context and set a new context value
   */
  public set context(v: Map<string, string | number | boolean>) {
    this._context.clear();
    this.updateContext(v);
  }

  public get modifications(): Map<string, Modification> {
    return this._modifications;
  }

  get configManager(): ConfigManager {
    return this._configManager;
  }

  public updateContext(context: Map<string, string | number | boolean>): void {
    if (!context) {
      console.log("contest is null");
      return;
    }
    for (const [k, v] of context) {
      this.updateContextKeyValue(k, v);
    }
  }

  public updateContextKeyValue(
    key: string,
    value: string | number | boolean
  ): void {
    const valueType = typeof value;
    if (
      typeof key != "string" ||
      key == "" ||
      (valueType != "string" && valueType != "number" && valueType != "boolean")
    ) {
      //To Do change to config.logManager
      console.log(
        `params 'key' must be a non null String, and 'value' must be one of the following types : String, Number, Boolean`
      );
      return;
    }
    this._context.set(key, value);
  }

  /**
   * clear the actual visitor context
   */
  public clearContext(): void {
    this._context.clear();
  }

  /**
   * Retrieve a modification value by its key. If no modification match the given
   * key or if the stored value type and default value type do not match, default value will be returned.
   *
   */
  public getModification<T>(key: string, defaultValue: T, activate = false): T {
    if (!key) {
      console.log(sprintf(GET_MODIFICATION_KEY_ERROR, key));
      return defaultValue;
    }

    const modification = this._modifications.get(key);
    if (!modification) {
      console.log(sprintf(GET_MODIFICATION_MISSING_ERROR, key));
      return defaultValue;
    }

    if (typeof modification.getValue() !== typeof defaultValue) {
      console.log(sprintf(GET_MODIFICATION_CAST_ERROR, key));
      //To do send activate if true
      return defaultValue;
    }

    if (activate) {
      //To do send activate
    }

    return modification.getValue();
  }

  public async synchronizeModifications(): Promise<Visitor> {
    try {
      const modifications =
        await this.configManager.decisionManager?.getCampaignsModifications(
          this._visitorId,
          this._context
        );
      this._modifications = modifications;
    } catch (error) {
      console.log(error);
    }
    return this;
  }
}
