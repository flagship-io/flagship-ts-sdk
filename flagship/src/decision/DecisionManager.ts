import { IDecisionManager } from './IDecisionManager'
import { IFlagshipConfig } from '../config/index'
import { IHttpClient } from '../utils/HttpClient'
import { CampaignDTO } from './api/models'
import { VisitorAbstract } from '../visitor/VisitorAbstract'
import { BASE_API_URL, EXPOSE_ALL_KEYS, FETCH_FLAGS_PANIC_MODE, FlagshipStatus, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, PROCESS_FETCHING_FLAGS, SDK_INFO, URL_CAMPAIGNS } from '../enum/index'
import { FlagDTO } from '../types'
import { errorFormat, logDebug } from '../utils/utils'

export abstract class DecisionManager implements IDecisionManager {
  protected _config: IFlagshipConfig
  protected _panic = false
  protected _httpClient: IHttpClient
  private _statusChangedCallback! : (status: FlagshipStatus)=>void

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
            campaignName: campaign.name,
            variationGroupId: campaign.variationGroupId,
            variationGroupName: campaign.variationGroupName,
            variationId: campaign.variation.id,
            variationName: campaign.variation.name,
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

    const url = `${this.config.decisionApiUrl || BASE_API_URL}${this.config.envId}${URL_CAMPAIGNS}?${EXPOSE_ALL_KEYS}=true`
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
      return campaigns
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
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
