import { Modification } from "../model/Modification.ts";
import { IConfigManager } from "../config/ConfigManager.ts";
import {
  VISITOR_ID_ERROR,
  GET_MODIFICATION_KEY_ERROR,
  GET_MODIFICATION_MISSING_ERROR,
  GET_MODIFICATION_CAST_ERROR,
  GET_MODIFICATION_ERROR,
  TRACKER_MANAGER_MISSING_ERROR,
} from "../enum/FlagshipConstant.ts";
import { sprintf, logError } from "../utils/utils.ts";
import { FlagshipConfig } from "../config/FlagshipConfig.ts";

export class Visitor {
  private _visitorId: string;
  private _context!: Map<string, string | number | boolean>;
  private _modifications: Map<string, Modification>;
  private _configManager: IConfigManager;
  private _config: FlagshipConfig;

  constructor(
    visitorId: string,
    context: Map<string, string | number | boolean>,
    configManager: IConfigManager
  ) {
    this._visitorId = visitorId;
    this._modifications = new Map<string, Modification>();
    this._configManager = configManager;
    this._config = configManager.config;
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

  get configManager(): IConfigManager {
    return this._configManager;
  }

  public get config(): FlagshipConfig {
    return this._config;
  }
  public set config(v: FlagshipConfig) {
    this._config = v;
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
    if (!key || typeof key != "string") {
      logError(
        this.config.logManager,
        sprintf(GET_MODIFICATION_KEY_ERROR, key),
        "getModification"
      );
      return defaultValue;
    }

    const modification = this._modifications.get(key);
    if (!modification) {
      logError(
        this.config.logManager,
        sprintf(GET_MODIFICATION_MISSING_ERROR, key),
        "getModification"
      );
      return defaultValue;
    }

    if (typeof modification.value !== typeof defaultValue) {
      logError(
        this.config.logManager,
        sprintf(GET_MODIFICATION_CAST_ERROR, key),
        "getModification"
      );

      if (!modification.value) {
        this.activateModification(key);
      }
      return defaultValue;
    }

    if (activate) {
      this.activateModification(key);
    }

    return modification.value;
  }

  /**
   * Get the campaign modification information value matching the given key.
   * @param key : key which identify the modification.
   */
  public getModificationInfo(key: string): Modification | null {
    if (!key || typeof key != "string") {
      logError(
        this.config.logManager,
        sprintf(GET_MODIFICATION_KEY_ERROR, key),
        "getModificationInfo"
      );
      return null;
    }

    const modification = this.modifications.get(key);

    if (!modification) {
      logError(
        this.config.logManager,
        sprintf(GET_MODIFICATION_ERROR, key),
        "getModification"
      );
      return null;
    }

    return modification;
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

  private hasTrackingManager(process: string): boolean {
    const check = this.configManager.trackingManager;
    if (!check) {
      logError(
        this.config.logManager,
        sprintf(TRACKER_MANAGER_MISSING_ERROR),
        process
      );
    }
    return !!check;
  }

  /**
   * Report this user has seen this modification.
   * @param key : key which identify the modification to activate.
   */
  public activateModification(key: string): void {
    const functionName = "activateModification";
    if (!key || typeof key != "string") {
      logError(
        this.config.logManager,
        sprintf(GET_MODIFICATION_KEY_ERROR, key),
        functionName
      );
      return;
    }

    const modification = this.modifications.get(key);

    if (!modification) {
      if (!modification) {
        logError(
          this.config.logManager,
          sprintf(GET_MODIFICATION_ERROR, key),
          functionName
        );
        return;
      }
    }

    if (!this.hasTrackingManager(functionName)) {
      return;
    }

    this.configManager.trackingManager.sendActive(this, modification);
  }
}
