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
  URL_CAMPAIGNS
} from '../enum/index'
import { DecisionManager } from './DecisionManager'
import { CampaignDTO } from './api/models'
import { logError } from '../utils/utils'
import { VisitorAbstract } from '../visitor/VisitorAbstract'

export class ApiManager extends DecisionManager {
  public async getCampaignsAsync (visitor: VisitorAbstract):Promise<CampaignDTO[]> {
    return new Promise((resolve, reject) => {
      const headers = {
        [HEADER_X_API_KEY]: `${this.config.apiKey}`,
        [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE,
        [HEADER_X_SDK_VERSION]: SDK_VERSION,
        [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
      }

      const postData = {
        visitorId: visitor.visitorId,
        trigger_hit: false,
        context: visitor.context
      }

      const url = `${BASE_API_URL}${this.config.envId}${URL_CAMPAIGNS}?${EXPOSE_ALL_KEYS}=true`

      this._httpClient.postAsync(url, {
        headers,
        timeout: this.config.timeout,
        body: postData
      })
        .then(data => {
          this.panic = false
          if (data.body.panic) {
            this.panic = true
          }
          let response:CampaignDTO[] = []
          if (data.body.campaigns) {
            response = data.body.campaigns
          }
          resolve(response)
        })
        .catch(error => {
          logError(this.config, JSON.stringify(error), PROCESS_GET_CAMPAIGNS)
          reject(error)
        })
    })
  }
}
