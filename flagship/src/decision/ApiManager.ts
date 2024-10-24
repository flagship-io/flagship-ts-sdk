
import { CampaignDTO } from '../types'
import { VisitorAbstract } from '../visitor/VisitorAbstract'
import { IDecisionManager } from './IDecisionManager'
import { IBucketingPolling } from '../polling/IBucketingPolling'
import { IHttpClient } from '../utils/HttpClient'
import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { BASE_API_URL, EXPOSE_ALL_KEYS, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, SDK_INFO, URL_CAMPAIGNS } from '../enum/FlagshipConstant'
import { errorFormat } from '../utils/utils'
export class ApiManager implements IDecisionManager {
  protected bucketingPolling: IBucketingPolling
  protected httpClient: IHttpClient
  protected config: IFlagshipConfig

  constructor (bucketingPolling: IBucketingPolling, httpClient: IHttpClient, config: IFlagshipConfig) {
    this.bucketingPolling = bucketingPolling
    this.httpClient = httpClient
    this.config = config
  }

  async getCampaignsAsync (visitor: VisitorAbstract): Promise<CampaignDTO[]> {
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
      const response = await this.httpClient.postAsync(url, {
        headers,
        timeout: this.config.timeout,
        body: requestBody,
        nextFetchConfig: this.config.nextFetchConfig
      })
      return response?.body?.campaigns
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
