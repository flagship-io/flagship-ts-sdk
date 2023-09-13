import { IDecisionManager } from './IDecisionManager'
import { IFlagshipConfig } from '../config/index'
import { IHttpClient } from '../utils/HttpClient'
import { CampaignDTO } from './api/models'
import { VisitorAbstract } from '../visitor/VisitorAbstract'
import { BASE_API_URL, EXPOSE_ALL_KEYS, FETCH_FLAGS_PANIC_MODE, FlagshipStatus, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, LogLevel, PROCESS_FETCHING_FLAGS, SDK_INFO, URL_CAMPAIGNS } from '../enum/index'
import { FlagDTO, TroubleshootingData } from '../types'
import { errorFormat, logDebug } from '../utils/utils'
import { Troubleshooting } from '../hit/Troubleshooting'
import { ITrackingManager } from '../api/ITrackingManager'

export abstract class DecisionManager implements IDecisionManager {
  protected _config: IFlagshipConfig
  protected _panic = false
  protected _httpClient: IHttpClient
  private _statusChangedCallback! : (status: FlagshipStatus)=>void
  private _troubleshooting? : TroubleshootingData

  protected _lastBucketingTimestamp?:string

  private _trackingManager! : ITrackingManager
  private _flagshipInstanceId! : string

  public get trackingManager () : ITrackingManager {
    return this._trackingManager
  }

  public set trackingManager (v : ITrackingManager) {
    this._trackingManager = v
  }

  public get flagshipInstanceId () : string {
    return this._flagshipInstanceId
  }

  public set flagshipInstanceId (v : string) {
    this._flagshipInstanceId = v
  }

  public get lastBucketingTimestamp ():string|undefined {
    return this._lastBucketingTimestamp
  }

  public get troubleshooting () : TroubleshootingData|undefined {
    return this._troubleshooting
  }

  public set troubleshooting (v : TroubleshootingData|undefined) {
    this._troubleshooting = v
  }

  public get config ():IFlagshipConfig {
    return this._config
  }

  // eslint-disable-next-line accessor-pairs
  protected set panic (v: boolean) {
    this.updateFlagshipStatus(v ? FlagshipStatus.READY_PANIC_ON : FlagshipStatus.READY)
    this._panic = v
    if (v) {
      logDebug(this.config, FETCH_FLAGS_PANIC_MODE, PROCESS_FETCHING_FLAGS)
    }
  }

  public statusChangedCallback (v : (status: FlagshipStatus)=>void):void {
    this._statusChangedCallback = v
  }

  public constructor (httpClient: IHttpClient, config: IFlagshipConfig) {
    this._config = config
    this._httpClient = httpClient
  }

  protected updateFlagshipStatus (v:FlagshipStatus):void {
    if (typeof this._statusChangedCallback === 'function' && this._statusChangedCallback) {
      this._statusChangedCallback(v)
    }
  }

  public getModifications (campaigns: Array<CampaignDTO>):Map<string, FlagDTO> {
    const modifications = new Map<string, FlagDTO>()
    campaigns.forEach((campaign) => {
      const object = campaign.variation.modifications.value
      for (const key in object) {
        const value = object[key]
        modifications.set(
          key,
          {
            key,
            campaignId: campaign.id,
            variationGroupId: campaign.variationGroupId,
            variationId: campaign.variation.id,
            isReference: !!campaign.variation.reference,
            campaignType: campaign.type,
            slug: campaign.slug,
            value
          }
        )
      }
    })
    return modifications
  }

  abstract getCampaignsAsync(visitor: VisitorAbstract): Promise<CampaignDTO[]|null>

  public isPanic (): boolean {
    return this._panic
  }

  protected async getDecisionApiCampaignsAsync (visitor: VisitorAbstract): Promise<CampaignDTO[]|null> {
    const headers = {
      [HEADER_X_API_KEY]: `${this.config.apiKey}`,
      [HEADER_X_SDK_CLIENT]: SDK_INFO.name,
      [HEADER_X_SDK_VERSION]: SDK_INFO.version,
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    const requestBody = {
      visitorId: visitor.visitorId,
      anonymousId: visitor.anonymousId,
      trigger_hit: false,
      context: visitor.context,
      visitor_consent: visitor.hasConsented
    }

    const url = `${this.config.decisionApiUrl || BASE_API_URL}${this.config.envId}${URL_CAMPAIGNS}?${EXPOSE_ALL_KEYS}=true&extras[]=accountSettings`
    const now = Date.now()

    try {
      const response = await this._httpClient.postAsync(url, {
        headers,
        timeout: this.config.timeout,
        body: requestBody,
        nextFetchConfig: this.config.nextFetchConfig
      })

      this.panic = !!response?.body?.panic
      let campaigns: CampaignDTO[]|null = null

      if (response?.body?.campaigns) {
        campaigns = response.body.campaigns
      }

      const troubleshooting = response?.body?.extras?.accountSettings?.troubleshooting
      if (troubleshooting) {
        this.troubleshooting = {
          startDate: new Date(troubleshooting.startDate),
          endDate: new Date(troubleshooting.endDate),
          timezone: troubleshooting.timezone,
          traffic: troubleshooting.traffic
        }
      }

      return campaigns
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      const monitoringHttpResponse = new Troubleshooting({
        label: 'GET-CAMPAIGNS-ROUTE-RESPONSE-ERROR',
        logLevel: LogLevel.ERROR,
        visitorId: visitor.visitorId,
        anonymousId: visitor.anonymousId,
        visitorInstanceId: visitor.instanceId,
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
      })

      await visitor.sendMonitoringHit(monitoringHttpResponse)

      const errorMessage = errorFormat(error.message || error, {
        url,
        headers,
        body: requestBody,
        duration: Date.now() - now
      })
      throw new Error(errorMessage)
    }
  }
}
