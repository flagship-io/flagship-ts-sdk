import { FlagshipConfig } from "./FlagshipConfig.ts";
import { DecisionManager } from "../decision/DecisionManager.ts";
import { ApiManager } from "../decision/ApiManager.ts";
import { Visitor } from "./Visitor.ts";

export enum Status {
  /**
   * Flagship SDK has not been started or initialized successfully.
   */
  NOT_READY,
  /**
   * Flagship SDK is ready to use.
   */
  READY,
}

export class Flagship {
  private static _instance: Flagship = null;
  private _config: FlagshipConfig = null;
  private _status: Status = Status.NOT_READY;
  private _decisionManager: DecisionManager = null;

  protected static getInstance(): Flagship {
    if (!this._instance) {
      this._instance = new this();
    }
    return this._instance;
  }

  private static isReady(): Boolean {
    return (this._instance! =
      null &&
      this._instance._config != null &&
      this._instance._config.getEnvId() != null &&
      this._instance._config.getApiKey() != null &&
      this._instance._config.getFlagshipMode() != null);
  }

  public static start(
    envId: string,
    apiKey: string,
    config: FlagshipConfig
  ): void {
    this.getInstance().setStatus(Status.NOT_READY);
    if (envId != null && apiKey != null) {
      if (config == null) {
        config = new FlagshipConfig(envId, apiKey);
      }
      config.withEnvId(envId);
      config.withApiKey(apiKey);
      this.getInstance().setConfig(config);

      if (config.getEnvId == null || config.getApiKey == null) {
        console.log("envId & apikey not found");
      }

      this.getInstance().setConfig(config);
      let decisionManager: DecisionManager = new ApiManager(config);

      this.getInstance().setDecisionManager(decisionManager);
      console.log("API WORKED");
    } else {
      console.log("envId null && apiKey null");
    }
  }

  public static getStatus(): Status {
    return this.getInstance()._status;
  }

  protected setStatus(status: Status): void {
    if (this._status != status) {
      this._status = status;
      if (
        this._config != null &&
        this._config.getOnStatusChangedListener() != null
      ) {
        this._config.getOnStatusChangedListener().onStatusChanged(status);
      }
      if (this._status === Status.READY) {
        console.log("status ready");
      }
    }
  }

  public static getConfig(): FlagshipConfig {
    return this.getInstance()._config;
  }

  protected setConfig(config: FlagshipConfig): void {
    if (this._config != null) {
      this._config = config;
    }
  }

  protected setDecisionManager(decisionManager: DecisionManager): void {
    this._decisionManager = decisionManager;
  }

  protected static getDecisionManager(): DecisionManager {
    return this.getInstance()._decisionManager;
  }

  public static newVisitor(
    visitorId: string,
    context: Map<string, Object>
  ): Visitor {
    return new Visitor(
      this.getConfig(),
      this.getDecisionManager(),
      visitorId,
      context
    );
  }
}
