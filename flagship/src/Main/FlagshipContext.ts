import { Status } from "./Flagship.ts";
import { FlagshipConfig } from "./FlagshipConfig.ts";

export interface OnStatusChangedListener {
  onStatusChanged?(newStatus: Status): void;
}

export class FlagshipContext extends FlagshipConfig {
  private _envId: string;
  private _apiKey: string;

  constructor(envId: string, apiKey: string) {
    super();
    this._envId = envId;
    this._apiKey = apiKey;
  }

  public getEnvId(): string {
    return this._envId;
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
      this._flagshipMode +
      "}"
    );
  }
}
