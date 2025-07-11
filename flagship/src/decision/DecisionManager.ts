import { IDecisionManager } from './IDecisionManager';
import { IFlagshipConfig } from '../config/index';
import { IHttpClient } from '../utils/HttpClient';
import { VisitorAbstract } from '../visitor/VisitorAbstract';
import { BASE_API_URL, EXPOSE_ALL_KEYS, FETCH_FLAGS_PANIC_MODE, FSSdkStatus, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, LogLevel, PROCESS_FETCHING_FLAGS, SDK_INFO, URL_CAMPAIGNS } from '../enum/index';
import { CampaignDTO, FlagDTO, TroubleshootingData, TroubleshootingLabel } from '../types';
import { errorFormat, logDebug } from '../utils/utils';
import { ITrackingManager } from '../api/ITrackingManager';
import { Troubleshooting } from '../hit/Troubleshooting';

type ConstructorParam = {
  httpClient: IHttpClient;
  config: IFlagshipConfig;
  trackingManager: ITrackingManager;
  flagshipInstanceId?: string;
}

export abstract class DecisionManager implements IDecisionManager {
  protected _config: IFlagshipConfig;
  protected _panic = false;
  protected _httpClient: IHttpClient;
  private _statusChangedCallback! : (status: FSSdkStatus)=>void;
  private _troubleshooting? : TroubleshootingData;

  protected _lastBucketingTimestamp?:string;

  private _trackingManager! : ITrackingManager;
  private _flagshipInstanceId! : string;

  public get trackingManager() : ITrackingManager {
    return this._trackingManager;
  }

  public set trackingManager(v : ITrackingManager) {
    this._trackingManager = v;
  }

  public get flagshipInstanceId() : string {
    return this._flagshipInstanceId;
  }

  public set flagshipInstanceId(v : string) {
    this._flagshipInstanceId = v;
  }

  public get lastBucketingTimestamp():string|undefined {
    return this._lastBucketingTimestamp;
  }

  public get troubleshooting() : TroubleshootingData|undefined {
    return this._troubleshooting;
  }

  public set troubleshooting(v : TroubleshootingData|undefined) {
    this._troubleshooting = v;
  }

  public get config():IFlagshipConfig {
    return this._config;
  }


  protected set panic(v: boolean) {
    this.updateFlagshipStatus(v ? FSSdkStatus.SDK_PANIC : FSSdkStatus.SDK_INITIALIZED);
    this._panic = v;
    if (v) {
      logDebug(this.config, FETCH_FLAGS_PANIC_MODE, PROCESS_FETCHING_FLAGS);
    }
  }

  public statusChangedCallback(v : (status: FSSdkStatus)=>void):void {
    this._statusChangedCallback = v;
  }

  public constructor({ httpClient, config, trackingManager, flagshipInstanceId }: ConstructorParam) {
    this._config = config;
    this._httpClient = httpClient;
    this._trackingManager = trackingManager;
    this._flagshipInstanceId = flagshipInstanceId || '';
  }

  protected updateFlagshipStatus(v:FSSdkStatus):void {
    if (typeof this._statusChangedCallback === 'function' && this._statusChangedCallback) {
      this._statusChangedCallback(v);
    }
  }

  public getModifications(campaigns: Array<CampaignDTO>):Map<string, FlagDTO> {
    const modifications = new Map<string, FlagDTO>();
    campaigns.forEach((campaign) => {
      const object = campaign.variation.modifications.value;
      for (const key in object) {
        const value = object[key];
        modifications.set(
          key,
          {
            key,
            campaignId: campaign.id,
            campaignName: campaign.name || '',
            variationGroupId: campaign.variationGroupId,
            variationGroupName: campaign.variationGroupName || '',
            variationId: campaign.variation.id,
            variationName: campaign.variation.name || '',
            isReference: !!campaign.variation.reference,
            campaignType: campaign.type,
            slug: campaign.slug,
            value
          }
        );
      }
    });
    return modifications;
  }

  abstract getCampaignsAsync(visitor: VisitorAbstract): Promise<CampaignDTO[]|null>

  public isPanic(): boolean {
    return this._panic;
  }

  private handleTroubleshootingError(params: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: any,
    visitor: VisitorAbstract,
    requestBody: unknown,
    headers: Record<string, string>,
    url: string,
    now: number
  }): never {
    const { error, visitor, requestBody, headers, url, now } = params;
    const troubleshooting = new Troubleshooting({
      label: TroubleshootingLabel.GET_CAMPAIGNS_ROUTE_RESPONSE_ERROR,
      logLevel: LogLevel.ERROR,
      visitorId: visitor.visitorId,
      flagshipInstanceId: this.flagshipInstanceId,
      anonymousId: visitor.anonymousId,
      visitorSessionId: visitor.instanceId,
      traffic: 100,
      config: this.config,
      visitorContext: visitor.context,
      httpRequestBody: requestBody,
      httpRequestHeaders: headers,
      httpRequestMethod: 'POST',
      httpRequestUrl: url,
      httpResponseBody: error?.message,
      httpResponseHeaders: error?.headers,
      httpResponseCode: error?.statusCode,
      httpResponseTime: Date.now() - now
    });

    this.trackingManager?.addTroubleshootingHit(troubleshooting);

    const errorMessage = errorFormat(error.message || error, {
      url,
      headers,
      body: requestBody,
      duration: Date.now() - now
    });
    throw new Error(errorMessage);
  }


  protected async getDecisionApiCampaignsAsync(visitor: VisitorAbstract): Promise<CampaignDTO[]|null> {
    const headers = {
      [HEADER_X_API_KEY]: `${this.config.apiKey}`,
      [HEADER_X_SDK_CLIENT]: SDK_INFO.name,
      [HEADER_X_SDK_VERSION]: SDK_INFO.version,
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    };

    const requestBody = {
      visitorId: visitor.visitorId,
      anonymousId: visitor.anonymousId,
      trigger_hit: false,
      context: visitor.context,
      visitor_consent: visitor.hasConsented
    };

    const url = `${this.config.decisionApiUrl || BASE_API_URL}${this.config.envId}${URL_CAMPAIGNS}?${EXPOSE_ALL_KEYS}=true&extras[]=accountSettings`;
    const now = Date.now();

    try {
      const response = await this._httpClient.postAsync(url, {
        headers,
        timeout: this.config.timeout,
        body: requestBody,
        nextFetchConfig: this.config.nextFetchConfig
      });

      this.panic = !!response?.body?.panic;
      let campaigns: CampaignDTO[]|null = null;

      if (response?.body?.campaigns) {
        campaigns = response.body.campaigns;
      }

      const troubleshooting = response?.body?.extras?.accountSettings?.troubleshooting;
      if (troubleshooting) {
        this.troubleshooting = {
          startDate: new Date(troubleshooting.startDate),
          endDate: new Date(troubleshooting.endDate),
          timezone: troubleshooting.timezone,
          traffic: troubleshooting.traffic
        };
      }

      return campaigns;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      this.handleTroubleshootingError({
        error,
        visitor,
        requestBody,
        headers,
        url,
        now
      });
    }
  }
}
