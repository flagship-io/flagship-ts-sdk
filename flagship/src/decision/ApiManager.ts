import {
  BASE_API_URL,
  EXPOSE_ALL_KEYS,
  HEADER_APPLICATION_JSON,
  HEADER_CONTENT_TYPE,
  HEADER_X_API_KEY,
  HEADER_X_SDK_CLIENT,
  HEADER_X_SDK_VERSION,
  PROCESS_GET_CAMPAIGNS,
  SDK_LANGUAGE,
  SDK_VERSION,
  SEND_CONTEXT_EVENT,
  URL_CAMPAIGNS
} from '../enum/index'
import { DecisionManager } from './DecisionManager'
import { CampaignDTO } from './api/models'
import { logError } from '../utils/utils'
import { VisitorAbstract } from '../visitor/VisitorAbstract'

export class ApiManager extends DecisionManager {
  public async getCampaignsAsync (visitor: VisitorAbstract): Promise<CampaignDTO[]> {
    const headers = {
      [HEADER_X_API_KEY]: `${this.config.apiKey}`,
      [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE.name,
      [HEADER_X_SDK_VERSION]: SDK_VERSION,
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    const postData = {
      visitorId: visitor.visitorId,
      anonymousId: visitor.anonymousId,
      trigger_hit: false,
      context: visitor.context
    }

    let url = `${this.config.decisionApiUrl || BASE_API_URL}${this.config.envId}${URL_CAMPAIGNS}?${EXPOSE_ALL_KEYS}=true`
    if (!visitor.hasConsented) {
      url += `&${SEND_CONTEXT_EVENT}=false`
    }

    return this._httpClient.postAsync(url, {
      headers,
      timeout: this.config.timeout,
      body: postData
    })
      .then(data => {
        this.panic = !!data.body.panic
        let response: CampaignDTO[] = []
        if (data.body.campaigns) {
          response = data.body.campaigns
        }
        return response
      })
      .catch(error => {
        logError(this.config, error.message || error, PROCESS_GET_CAMPAIGNS)
        return []
      })
  }
}
