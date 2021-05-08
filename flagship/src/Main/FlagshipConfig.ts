class FlagshipConfig {
  private _envId: string = null;
  private _apiKey: string = null;
  private _flagshipMode: FlagshipMode = FlagshipMode.DECISION_API;
  private _timeOut: number = 2000;
  private _logManager = null;
  private _decisionManager = null;
  private _trackingManager = null;

  constructor(envId: string, apiKey: string) {
    this._envId = envId;
    this._apiKey = apiKey;
  }

  public getEnvId(): string {
    return this._envId;
  }

  public withEnvId(envId: string): FlagshipConfig {
    this._envId = envId;
    return this;
  }

  public getApiKey(): string {
    return this._apiKey;
  }

  public withApiKey(apiKey: string): FlagshipConfig {
    this._apiKey = apiKey;
    return this;
  }

  public getFlagshipMode(): FlagshipMode {
    return this._flagshipMode;
  }

  public withFlagshipMode(flagshipMode: Mode): FlagshipConfig {
    if (FlagshipMode.isFlagshipMode(flagshipMode)) {
      this._flagshipMode = FlagshipMode;
      return this;
    }
  }

  public getTimeOut(): number {
    return this._timeOut;
  }

  public withTimeOut(timeOut: number): FlagshipConfig {
    this._timeOut = timeOut;
    return this;
  }

  public toString(): string {
    return (
      "FlagshipConfig{" +
      "envId='" +
      this._envId +
      "'" +
      ", apiKey='" +
      this._apiKey +
      "'" +
      ", mode=" +
      this._flagshipMode +
      "}"
    );
  }
}
