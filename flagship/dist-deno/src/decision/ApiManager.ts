import {
  BASE_API_URL,
  EXPOSE_ALL_KEYS,
  HEADER_APPLICATION_JSON,
  HEADER_CONTENT_TYPE,
  HEADER_X_API_KEY,
  HEADER_X_SDK_CLIENT,
  HEADER_X_SDK_VERSION,
  SDK_INFO,
  URL_CAMPAIGNS
} from '../enum/index.ts'
import { DecisionManager } from './DecisionManager.ts'
import { CampaignDTO } from './api/models.ts'
import { errorFormat } from '../utils/utils.ts'
import { VisitorAbstract } from '../visitor/VisitorAbstract.ts'

export class ApiManager extends DecisionManager {
  public async getCampaignsAsync (visitor: VisitorAbstract): Promise<CampaignDTO[]|null> {
    const headers = {
      [HEADER_X_API_KEY]: `${this.config.apiKey}`,
      [HEADER_X_SDK_CLIENT]: SDK_INFO.name,
      [HEADER_X_SDK_VERSION]: SDK_INFO.version,
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    const postData = {
      visitorId: visitor.visitorId,
      anonymousId: visitor.anonymousId,
      trigger_hit: false,
      context: visitor.context,
      visitor_consent: visitor.hasConsented
    }

    const url = `${this.config.decisionApiUrl || BASE_API_URL}${this.config.envId}${URL_CAMPAIGNS}?${EXPOSE_ALL_KEYS}=true`
    const now = Date.now()

    return this._httpClient.postAsync(url, {
      headers,
      timeout: this.config.timeout,
      body: postData
    })
      .then(data => {
        this.panic = !!data.body.panic
        let response: CampaignDTO[]|null = null
        if (data.body.campaigns) {
          response = data.body.campaigns
        }
        return response
      })
      .catch(error => {
        throw new Error(errorFormat(error.message || error, {
          url,
          headers,
          body: postData,
          duration: Date.now() - now
        }))
      })
  }
}
