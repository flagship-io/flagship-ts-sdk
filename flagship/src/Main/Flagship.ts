import { FlagshipConfig } from "./FlagshipConfig.ts";
import { DecisionManager } from "../decision/DecisionManager.ts";
import { ApiManager } from "../decision/ApiManager.ts";
import { Visitor } from "./Visitor.ts";
import { FlagshipContext } from "./FlagshipContext.ts";

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
  private static _instance?: Flagship = undefined;
  private _config?: FlagshipContext = undefined;
  private _status: Status = Status.NOT_READY;
  private _decisionManager?: DecisionManager = undefined;

  protected static getInstance(): Flagship {
    if (!this._instance) {
      this._instance = new this();
    }
    return this._instance;
  }

  private static isReady(): boolean {
    return (
      this._instance != null &&
      this._instance._config != null &&
      this._instance._config.getEnvId() != null &&
      this._instance._config.getApiKey() != null &&
      this._instance._config.getFlagshipMode() != null
    );
  }

  public static start(
    envId: string,
    apiKey: string,
    config: FlagshipConfig
  ): void {
    this.getInstance().setStatus(Status.NOT_READY);
    if (envId != null && apiKey != null) {
      let context = config as FlagshipContext;
      if (context == null) {
        context = new FlagshipContext(envId, apiKey);
      }
      this.getInstance().setConfig(context);
      this.getInstance().setDecisionManager(new ApiManager(config));
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
        this._config.getOnStatusChangedListener() != undefined &&
        this._config.getOnStatusChangedListener()?.onStatusChanged != undefined
      ) {
        this._config.getOnStatusChangedListener()!.onStatusChanged!(status);
      }
      if (this._status === Status.READY) {
        console.log("status ready");
      }
    }
  }

  public static getConfig(): FlagshipConfig | undefined {
    return this.getInstance()._config;
  }

  protected setConfig(config: FlagshipContext): void {
    if (this._config != undefined) {
      this._config = config;
    }
  }

  protected setDecisionManager(decisionManager: DecisionManager): void {
    this._decisionManager = decisionManager;
  }

  protected static getDecisionManager(): DecisionManager | undefined {
    return this.getInstance()._decisionManager;
  }

  public static newVisitor(
    visitorId: string,
    context: Map<string, Object>
  ): Visitor {
    return new Visitor(
      this.getConfig()!,
      this.getDecisionManager()!,
      visitorId,
      context
    );
  }
}
