import { FlagshipConfig } from "./FlagshipConfig.ts";

export class FlagshipContext {
  private _envId: string;
  private _apiKey: string;
  private _config: FlagshipConfig;

  constructor(envId: string, apiKey: string, config: FlagshipConfig) {
    this._envId = envId;
    this._apiKey = apiKey;
    this._config = config;
  }

  public getEnvId(): string {
    return this._envId;
  }

  public get config(): FlagshipConfig {
    return this._config;
  }

  public getApiKey(): string {
    return this._apiKey;
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
      this.config.getFlagshipMode() +
      "}"
    );
  }
}
