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
  private _context?: FlagshipContext = undefined;
  private _status: Status = Status.NOT_READY;
  private _decisionManager?: DecisionManager = undefined;

  private get _config(): FlagshipConfig | undefined {
    return this._context?.config;
  }

  protected static getInstance(): Flagship {
    if (!this._instance) {
      this._instance = new this();
    }
    return this._instance;
  }

  private static isReady(): boolean {
    return (
      this._instance?._context?.getEnvId() != null &&
      this._instance._context.getApiKey() != null &&
      this._instance._config?.getFlagshipMode() != null
    );
  }

  public static start(
    envId: string,
    apiKey: string,
    config: FlagshipConfig
  ): void {
    this.getInstance().setStatus(Status.NOT_READY);
    if (envId != null && apiKey != null) {
      const context = new FlagshipContext(envId, apiKey, config);
      this.getInstance().setContext(context);
      console.log("API WORKED");
    } else {
      console.log("envId null && apiKey null");
    }
  }

  public static getStatus(): Status {
    return this.getInstance()._status;
  }

  protected setStatus(status: Status): void {
    // return early pattern
    if (this._status === status) return;
    this._status = status;
    if (
      this._config?.getOnStatusChangedListener() != undefined &&
      this._config.getOnStatusChangedListener()?.onStatusChanged != undefined
    ) {
      this._config.getOnStatusChangedListener()!.onStatusChanged!(status);
    }
    if (this._status === Status.READY) {
      console.log("status ready");
    }
  }

  public static getConfig(): FlagshipConfig | undefined {
    return this.getInstance()._config;
  }

  protected setContext(context: FlagshipContext): void {
    if (context != undefined) {
      this._context = context;
    }
  }

  public static newVisitor(
    visitorId: string,
    context: Map<string, unknown>
  ): Visitor {
    const fsContext = this.getInstance()._context;
    if (fsContext !== undefined) {
      return new Visitor(visitorId, context, fsContext);
    }
    throw new Error("Config is empty");
  }
}
