import { IDecisionManager } from "./IDecisionManager.ts";
import { Modification } from "../model/Modification.ts";
import { FlagshipConfig } from "../config/FlagshipConfig.ts";
import { IHttpClient } from "../utils/httpClient.ts";
import { Visitor } from "../visitor/Visitor.ts";

export abstract class DecisionManager implements IDecisionManager {
  protected _config: FlagshipConfig;
  protected _panic = false;
  protected _onStatusChangedListener = null;
  protected _httpClient: IHttpClient;

  public get config() {
    return this._config;
  }

  protected set panic(v: boolean) {
    this._panic = v;
  }

  public constructor(httpClient: IHttpClient, config: FlagshipConfig) {
    this._config = config;
    this._httpClient = httpClient;
  }

  abstract getCampaignsModificationsAsync(
    visitor: Visitor,
  ): Promise<Map<string, Modification>>;

  public isPanic(): boolean {
    return this._panic;
  }
}
