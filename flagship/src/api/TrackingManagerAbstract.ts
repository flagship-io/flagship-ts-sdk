import { IFlagshipConfig } from "../config/FlagshipConfig.ts";
import { Modification } from "../model/Modification.ts";
import { IHttpClient } from "../utils/httpClient.ts";
import { Visitor } from "../visitor/Visitor.ts";

export interface ITrackingManager {
  sendActive(visitor: Visitor, modification: Modification): void;
}

export abstract class TrackingManagerAbstract implements ITrackingManager {
  private _httpClient: IHttpClient;
  private _config: IFlagshipConfig;
  constructor(httpClient: IHttpClient, config: IFlagshipConfig) {
    this._httpClient = httpClient;
    this._config = config;
  }

  public get httpClient() {
    return this._httpClient;
  }

  public get config() {
    return this._config;
  }

  public abstract sendActive(
    visitor: Visitor,
    modification: Modification
  ): void;
}
