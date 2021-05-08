enum Status {
  /**
   * Flagship SDK has not been started or initialized successfully.
   */
  NOT_READY,
  /**
   * Flagship SDK is ready to use.
   */
  READY,
}

class Flagship {
  private static _instance: Flagship = null;
  private _config: FlagshipConfig = null;
  private _status: Status = Status.NOT_READY;

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

  protected setConfig(config: FlagshipConfig) {
    if (config != null) {
      this._config = config;
    }
  }

  public static start(
    envId: string,
    apiKey: string,
    config: FlagshipConfig = null
  ): void {
    if (config == null) {
      config = new FlagshipConfig(envId, apiKey);
    }
    config.withEnvId(envId);
    config.withApiKey(apiKey);
    if (config.getEnvId == null || config.getApiKey == null) {
      console.log("envId & apikey not found");
    }

    this.getInstance().setConfig(config);
    if (this.isReady()) {
    }
  }
}
