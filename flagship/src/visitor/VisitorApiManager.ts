import { IHttpClient } from '../utils/HttpClient'
import { IDecisionManager } from '../decision/IDecisionManager'
import { VisitorAbstract } from './VisitorAbstract'
import { BASE_API_URL, EXPOSE_ALL_KEYS, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, SDK_INFO, URL_CAMPAIGNS } from '../enum/FlagshipConstant'
import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { errorFormat, logDebugSprintf } from '../utils/utils'
import { CampaignDTO } from '../types'

/**
 * This class is a decorator of DecisionManager to manage the visitor API
 */
export class VisitorApiManager {
  protected apiManager: IDecisionManager
  protected httpClient: IHttpClient
  protected config: IFlagshipConfig
  protected currentAbortController :AbortController|null
  protected data:any
  protected error:any

  constructor (apiManager: IDecisionManager, httpClient: IHttpClient, config: IFlagshipConfig) {
    this.apiManager = apiManager
    this.httpClient = httpClient
    this.config = config
    this.currentAbortController = null
    this.data = null
    this.error = null
  }

  private async fetchData (visitor: VisitorAbstract) {
    if (this.currentAbortController) {
      this.currentAbortController.abort('new-request')
    }

    // Create a new AbortController for the current request
    this.currentAbortController = new AbortController()

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
      this.data = null
      this.error = null

      const response = await this.httpClient.postAsync(url, {
        headers,
        timeout: this.config.timeout,
        body: requestBody,
        nextFetchConfig: this.config.nextFetchConfig,
        abortController: this.currentAbortController
      })

      //   this.panic = !!response?.body?.panic

      this.data = response?.body?.campaigns

      //   const troubleshooting = response?.body?.extras?.accountSettings?.troubleshooting
      //   if (troubleshooting) {
      //     this.troubleshooting = {
      //       startDate: new Date(troubleshooting.startDate),
      //       endDate: new Date(troubleshooting.endDate),
      //       timezone: troubleshooting.timezone,
      //       traffic: troubleshooting.traffic
      //     }
      //   }
    } catch (error:any) {
      if (error === 'new-request') {
        logDebugSprintf(this.config, 'getCampaignsAsync', 'Request aborted')
        return
      }
      const errorMessage = errorFormat(error.message || error, {
        url,
        headers,
        body: requestBody,
        duration: Date.now() - now
      })
      this.error = new Error(errorMessage)
    } finally {
      this.currentAbortController = null
    }
  }

  public async getCampaignsAsync (visitor: VisitorAbstract): Promise<CampaignDTO[]> {
    return new Promise((resolve, reject) => {
      this.fetchData(visitor)
      const intervalId = setInterval(() => {
        if (this.data) {
          resolve(this.data)
          clearInterval(intervalId)
        }
        if (this.error) {
          reject(this.error)
          clearInterval(intervalId)
        }
      }, 100)
    })
  }
}
