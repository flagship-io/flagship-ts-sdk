import { Modification } from "../model/Modification.ts";
import { IConfigManager } from "../config/ConfigManager.ts";
import {
  VISITOR_ID_ERROR,
  GET_MODIFICATION_KEY_ERROR,
  GET_MODIFICATION_MISSING_ERROR,
  GET_MODIFICATION_CAST_ERROR,
  GET_MODIFICATION_ERROR,
  TRACKER_MANAGER_MISSING_ERROR,
  SDK_APP,
  CONTEXT_PARAM_ERROR,
  CONTEXT_NULL_ERROR,
  PANIC_MODE_ERROR,
} from "../enum/FlagshipConstant.ts";
import { sprintf, logError } from "../utils/utils.ts";
import { FlagshipConfig } from "../config/FlagshipConfig.ts";
import { HitAbstract } from "../hit/HitAbstract.ts";

export class Visitor {
  private _visitorId: string;
  private _context!: Record<string, string | number | boolean>;
  private _modifications: Map<string, Modification>;
  private _configManager: IConfigManager;
  private _config: FlagshipConfig;

  constructor(
    visitorId: string,
    context: Record<string, string | number | boolean>,
    configManager: IConfigManager
  ) {
    this._visitorId = visitorId;
    this._modifications = new Map<string, Modification>();
    this._configManager = configManager;
    this._config = configManager.config;
    this._context = {};
    this.updateContext(context);
  }

  public get visitorId(): string {
    return this._visitorId;
  }

  public set visitorId(v: string) {
    if (!v) {
      logError(this.config, VISITOR_ID_ERROR, "visitorId");
      return;
    }
    this._visitorId = v;
  }

  public get context(): Record<string, string | number | boolean> {
    return this._context;
  }

  /**
   * Clear the current context and set a new context value
   */
  public set context(v: Record<string, string | number | boolean>) {
    this._context = {};
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

  /**
   * Update the visitor context values, matching the given keys, used for targeting.
   *
   * A new context value associated with this key will be created if there is no previous matching value.
   *
   * Context keys must be String, and values types must be one of the following : Number, Boolean, String.
   * @param context : collection of keys, values.
   */
  public updateContext(
    context: Record<string, string | number | boolean>
  ): void {
    if (!context) {
      logError(this.config, CONTEXT_NULL_ERROR, "updateContext");
      return;
    }

    Object.entries(context).forEach(([key, value]) => {
      this.updateContextKeyValue(key, value);
    });
  }

  /**
   *  Update the visitor context values, matching the given keys, used for targeting.
   *
   * A new context value associated with this key will be created if there is no previous matching value.
   * Context key must be String, and value type must be one of the following : Number, Boolean, String.
   * @param key : context key.
   * @param value : context value.
   * @returns
   */
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
      logError(
        this.config,
        sprintf(CONTEXT_PARAM_ERROR, key),
        "updateContextKeyValue"
      );
      return;
    }
    this._context[key] = value;
  }

  /**
   * clear the actual visitor context
   */
  public clearContext(): void {
    this._context = {};
  }

  /**
   * isOnPanicMode
   */
  public isOnPanicMode(functionName: string) {
    const check = this.configManager.decisionManager.isPanic();
    if (check) {
      logError(
        this.config,
        sprintf(PANIC_MODE_ERROR, functionName),
        functionName
      );
    }
    return check;
  }

  /**
   * Retrieve a modification value by its key. If no modification match the given
   * key or if the stored value type and default value type do not match, default value will be returned.
   *
   */

  public getModification<T>(key: string, defaultValue: T, activate = false): T {
    if (this.isOnPanicMode("getModification")) {
      return defaultValue;
    }

    if (!key || typeof key != "string") {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_KEY_ERROR, key),
        "getModification"
      );
      return defaultValue;
    }

    const modification = this._modifications.get(key);
    if (!modification) {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_MISSING_ERROR, key),
        "getModification"
      );
      return defaultValue;
    }

    const castError = () => {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_CAST_ERROR, key),
        "getModification"
      );

      if (!modification.value) {
        this.activateModification(key);
      }
    };

    if (
      typeof modification.value === "object" &&
      typeof defaultValue === "object" &&
      Array.isArray(modification.value) !== Array.isArray(defaultValue)
    ) {
      castError();
      return defaultValue;
    }

    if (typeof modification.value !== typeof defaultValue) {
      castError();
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
    if (this.isOnPanicMode("getModificationInfo")) {
      return null;
    }

    if (!key || typeof key != "string") {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_KEY_ERROR, key),
        "getModificationInfo"
      );
      return null;
    }

    const modification = this.modifications.get(key);

    if (!modification) {
      logError(
        this.config,
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
        await this.configManager.decisionManager?.getCampaignsModificationsAsync(
          this
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
      logError(this.config, sprintf(TRACKER_MANAGER_MISSING_ERROR), process);
    }
    return !!check;
  }

  /**
   * Report this user has seen this modification.
   * @param key : key which identify the modification to activate.
   */
  public activateModification(key: string): void {
    const functionName = "activateModification";

    if (this.isOnPanicMode(functionName)) {
      return;
    }

    if (!key || typeof key != "string") {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_KEY_ERROR, key),
        functionName
      );
      return;
    }

    const modification = this.modifications.get(key);

    if (!modification) {
      if (!modification) {
        logError(
          this.config,
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

  /**
   * Send a Hit to Flagship servers for reporting.
   * @param hit
   */
  public sendHit(hit: HitAbstract) {
    const functionName = "sendHit";
    if (this.isOnPanicMode(functionName)) {
      return;
    }

    if (!this.hasTrackingManager(functionName)) {
      return;
    }
    hit.visitorId = this.visitorId;
    hit.ds = SDK_APP;
    hit.config = this.config;

    if (!hit.isReady()) {
      logError(this.config, hit.getErrorMessage(), functionName);
    }

    this.configManager.trackingManager.sendHit(hit);
  }
}
