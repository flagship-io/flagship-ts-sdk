import { Visitor } from "../visitor/Visitor.ts";
import { FlagshipStatus } from "../enum/FlagshipStatus.ts";
import { FlagshipConfig } from "../config/FlagshipConfig.ts";
import { DecisionApiConfig } from "../config/DecisionApiConfig.ts";
import { ConfigManager, IConfigManager } from "../config/ConfigManager.ts";
import { ApiManager } from "../decision/ApiManager.ts";
import { TrackingManager } from "../api/TrackingManager.ts";
import { DenoHttpClient } from "../utils/denoHttpClient.ts";
import { FlagshipLogManager } from "../utils/FlagshipLogManager.ts";
import { logError, logInfo, sprintf } from "../utils/utils.ts";
import {
  INITIALIZATION_PARAM_ERROR,
  PROCESS_INITIALIZATION,
  SDK_STARTED_INFO,
  SDK_VERSION,
} from "../enum/index.ts";

export class Flagship {
  private static _instance: Flagship;
  private _configManger!: IConfigManager;
  private _config!: FlagshipConfig;
  private _status!: FlagshipStatus;

  set config(value: FlagshipConfig) {
    this._config = value;
  }

  get config(): FlagshipConfig {
    return this._config;
  }

  private set configManager(value: IConfigManager) {
    this._configManger = value;
  }

  private get configManager(): IConfigManager {
    return this._configManger;
  }

  private constructor() {}

  protected static getInstance(): Flagship {
    if (!this._instance) {
      this._instance = new this();
    }
    return this._instance;
  }

  private static isReady(): boolean {
    const apiKey = this._instance.config.apiKey;
    const envId = this._instance.config.envId;
    return (
      this._instance &&
      true &&
      apiKey !== null &&
      apiKey !== "" &&
      envId != null &&
      envId != ""
    );
  }

  protected setStatus(status: FlagshipStatus): void {
    const statusChanged = this.config.getStatusChangedCallback();
    if (this.config && statusChanged && this._status !== status) {
      statusChanged(status);
    }
    this._status = status;
  }

  public static getStatus(): FlagshipStatus {
    return this.getInstance()._status;
  }

  public static getConfig(): FlagshipConfig {
    return this.getInstance()._config;
  }

  public static start(
    envId: string,
    apiKey: string,
    config?: FlagshipConfig,
  ): void {
    const flagship = this.getInstance();

    if (!config) {
      config = new DecisionApiConfig(envId, apiKey);
    }
    config.envId = envId;
    config.apiKey = apiKey;

    flagship._config = config;

    flagship.setStatus(FlagshipStatus.NOT_READY);

    //check custom logger
    if (!config.logManager) {
      config.logManager = new FlagshipLogManager();
    }

    if (!envId || envId === "" || !apiKey || apiKey === "") {
      logError(config, INITIALIZATION_PARAM_ERROR, PROCESS_INITIALIZATION);
      return;
    }

    const decisionManager = new ApiManager(
      new DenoHttpClient(),
      flagship.config,
    );
    const trackingManager = new TrackingManager(new DenoHttpClient(), config);
    flagship.configManager = new ConfigManager(
      config,
      decisionManager,
      trackingManager,
    );

    if (this.isReady()) {
      flagship.setStatus(FlagshipStatus.READY);
      logInfo(
        config,
        sprintf(SDK_STARTED_INFO, SDK_VERSION),
        PROCESS_INITIALIZATION,
      );
    } else {
      flagship.setStatus(FlagshipStatus.NOT_READY);
    }
  }

  public static newVisitor(
    visitorId: string,
    context: Record<string, string | number | boolean> = {},
  ): Visitor | null {
    if (!this.isReady() || !visitorId) {
      return null;
    }

    return new Visitor(visitorId, context, this.getInstance().configManager);
  }
}
