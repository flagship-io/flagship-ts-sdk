import { Modification } from "../model/Modification.ts";
import {
  CONTEXT_NULL_ERROR,
  CONTEXT_PARAM_ERROR,
  GET_MODIFICATION_CAST_ERROR,
  GET_MODIFICATION_ERROR,
  GET_MODIFICATION_KEY_ERROR,
  GET_MODIFICATION_MISSING_ERROR,
  PANIC_MODE_ERROR,
  PROCESS_ACTIVE_MODIFICATION,
  PROCESS_GET_MODIFICATION,
  PROCESS_GET_MODIFICATION_INFO,
  PROCESS_SEND_HIT,
  PROCESS_UPDATE_CONTEXT,
  SDK_APP,
  TRACKER_MANAGER_MISSING_ERROR,
  VISITOR_ID_ERROR,
} from "../enum/index.ts";
import { logError, sprintf } from "../utils/utils.ts";
import { HitAbstract } from "../hit/index.ts";
import { IConfigManager, IFlagshipConfig } from "../config/index.ts";

export class Visitor {
  private _visitorId!: string;
  private _context: Record<string, string | number | boolean>;
  private _modifications: Map<string, Modification>;
  private _configManager: IConfigManager;
  private _config: IFlagshipConfig;

  constructor(
    visitorId: string,
    context: Record<string, string | number | boolean>,
    configManager: IConfigManager
  ) {
    this.visitorId = visitorId;
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
    if (!v || typeof v !== "string") {
      logError(this.config, VISITOR_ID_ERROR, "VISITOR ID");
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

  public get config(): IFlagshipConfig {
    return this._config;
  }

  /**
   * Update the visitor context values, matching the given keys, used for targeting.
   *
   * A new context value associated with this key will be created if there is no previous matching value.
   *
   * Context keys must be String, and values types must be one of the following : Number, Boolean, String.
   * @param {Record<string, string | number | boolean>} context : collection of keys, values.
   */
  public updateContext(
    context: Record<string, string | number | boolean>
  ): void {
    if (!context) {
      logError(this.config, CONTEXT_NULL_ERROR, PROCESS_UPDATE_CONTEXT);
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
   * @param {string} key : context key.
   * @param {string | number | boolean} value : context value.
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
        PROCESS_UPDATE_CONTEXT
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
  private isOnPanicMode(functionName: string) {
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
   * @param {string} key : key associated to the modification.
   * @param {T} defaultValue : default value to return.
   * @param {boolean} activate : Set this parameter to true to automatically report on our server that the current visitor has seen this modification. It is possible to call activateModification() later.
   */
  public getModificationAsync<T>(
    key: string,
    defaultValue: T,
    activate = false
  ): Promise<T> {
    return new Promise((resolve) => {
      resolve(this.getModification(key, defaultValue, activate));
    });
  }

  /**
   * Retrieve a modification value by its key. If no modification match the given
   * key or if the stored value type and default value type do not match, default value will be returned.
   * @param {string} key : key associated to the modification.
   * @param {T} defaultValue : default value to return.
   * @param {boolean} activate : Set this parameter to true to automatically report on our server that the current visitor has seen this modification. It is possible to call activateModification() later.
   */
  public getModification<T>(key: string, defaultValue: T, activate = false): T {
    if (this.isOnPanicMode(PROCESS_GET_MODIFICATION)) {
      return defaultValue;
    }

    if (!key || typeof key != "string") {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_KEY_ERROR, key),
        PROCESS_GET_MODIFICATION
      );
      return defaultValue;
    }

    const modification = this._modifications.get(key);
    if (!modification) {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_MISSING_ERROR, key),
        PROCESS_GET_MODIFICATION
      );
      return defaultValue;
    }

    const castError = () => {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_CAST_ERROR, key),
        PROCESS_GET_MODIFICATION
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
   * @param {string} key : key which identify the modification.
   * @returns {Modification | null}
   */
  public getModificationInfoAsync(key: string): Promise<Modification | null> {
    return new Promise((resolve) => {
      resolve(this.getModificationInfo(key));
    });
  }

  /**
   * Get the campaign modification information value matching the given key.
   * @param {string} key : key which identify the modification.
   * @returns {Modification | null}
   */
  public getModificationInfo(key: string): Modification | null {
    if (this.isOnPanicMode(PROCESS_GET_MODIFICATION_INFO)) {
      return null;
    }

    if (!key || typeof key != "string") {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_KEY_ERROR, key),
        PROCESS_GET_MODIFICATION_INFO
      );
      return null;
    }

    const modification = this.modifications.get(key);

    if (!modification) {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_ERROR, key),
        PROCESS_GET_MODIFICATION_INFO
      );
      return null;
    }

    return modification;
  }

  /**
   * This function calls the decision api and update all the campaigns modifications
   * from the server according to the visitor context.
   */
  public async synchronizeModifications(): Promise<void> {
    const modifications =
      await this.configManager.decisionManager?.getCampaignsModificationsAsync(
        this
      );
    this._modifications = modifications;
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
  public activateModificationAsync(key: string): Promise<void> {
    return new Promise((resolve) => {
      resolve(this.activateModification(key));
    });
  }

  /**
   * Report this user has seen this modification.
   * @param key : key which identify the modification to activate.
   */
  public activateModification(key: string): void {
    if (this.isOnPanicMode(PROCESS_ACTIVE_MODIFICATION)) {
      return;
    }

    if (!key || typeof key != "string") {
      logError(
        this.config,
        sprintf(GET_MODIFICATION_KEY_ERROR, key),
        PROCESS_ACTIVE_MODIFICATION
      );
      return;
    }

    const modification = this.modifications.get(key);

    if (!modification) {
      if (!modification) {
        logError(
          this.config,
          sprintf(GET_MODIFICATION_ERROR, key),
          PROCESS_ACTIVE_MODIFICATION
        );
        return;
      }
    }

    if (!this.hasTrackingManager(PROCESS_ACTIVE_MODIFICATION)) {
      return;
    }

    this.configManager.trackingManager.sendActive(this, modification);
  }

  /**
   * Send a Hit to Flagship servers for reporting.
   * @param hit
   */
  public sendHitAsync(hit: HitAbstract): Promise<void> {
    return new Promise((resolve) => {
      this.sendHit(hit);
      resolve();
    });
  }

  /**
   * Send a Hit to Flagship servers for reporting.
   * @param hit
   */
  public sendHit(hit: HitAbstract) {
    if (this.isOnPanicMode(PROCESS_SEND_HIT)) {
      return;
    }

    if (!this.hasTrackingManager(PROCESS_SEND_HIT)) {
      return;
    }
    hit.visitorId = this.visitorId;
    hit.ds = SDK_APP;
    hit.config = this.config;

    if (!hit.isReady()) {
      logError(this.config, hit.getErrorMessage(), PROCESS_SEND_HIT);
      return;
    }

    this.configManager.trackingManager.sendHit(hit);
  }
}
