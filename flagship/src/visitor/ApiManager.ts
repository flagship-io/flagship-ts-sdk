import { IHttpClient } from '../utils/HttpClient'
import { VisitorAbstract } from './VisitorAbstract'
import { BASE_API_URL, EXPOSE_ALL_KEYS, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, SDK_INFO, URL_CAMPAIGNS } from '../enum/FlagshipConstant'
import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { errorFormat, logDebugSprintf } from '../utils/utils'
import { CampaignDTO } from '../types'
import { IBucketingPolling } from '../decision/IBucketingPolling'
import { IDecisionManager } from './IDecisionManager'

/**
 * It handles fetching campaigns for a visitor by making API calls.
 */
export class ApiManager implements IDecisionManager {
  /**
   * Handles the polling mechanism for bucketing.
   */
  protected bucketingPolling: IBucketingPolling

  /**
   * HTTP client used for making API requests.
   */
  protected httpClient: IHttpClient

  /**
   * Configuration object for Flagship settings.
   */
  protected config: IFlagshipConfig

  /**
   * Controller to manage the abortion of ongoing API requests.
   */
  protected currentAbortController: AbortController | null

  /**
   * Stores the fetched campaign data.
   */
  protected data: any

  /**
   * Stores any errors encountered during API requests.
   */
  protected error: any

  /**
   * Constructs an instance of ApiManager.
   * @param bucketingPolling - The bucketing polling interface.
   * @param httpClient - The HTTP client for making API requests.
   * @param config - The Flagship configuration object.
   */
  constructor (bucketingPolling: IBucketingPolling, httpClient: IHttpClient, config: IFlagshipConfig) {
    this.bucketingPolling = bucketingPolling
    this.httpClient = httpClient
    this.config = config
    this.currentAbortController = null
    this.data = null
    this.error = null
  }

  /**
   * Fetches campaign data for the specified visitor.
   * @param visitor - The visitor for whom to fetch data.
   */
  private async fetchData (visitor: VisitorAbstract) {
    if (this.currentAbortController) {
      // Abort any existing request if a new one is initiated
      this.currentAbortController.abort('new-request')
    }

    // Initialize a new AbortController for the current request
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
      // Reset data and error before making a new request
      this.data = null
      this.error = null

      // Make the API call to fetch campaigns
      const response = await this.httpClient.postAsync(url, {
        headers,
        timeout: this.config.timeout,
        body: requestBody,
        nextFetchConfig: this.config.nextFetchConfig,
        abortController: this.currentAbortController
      })

      // Store the fetched data
      this.data = response?.body?.campaigns
    } catch (error: any) {
      if (error === 'new-request') {
        // Log if the request was aborted due to a new request
        logDebugSprintf(this.config, 'getCampaignsAsync', 'Request aborted')
        return
      }
      // Format and store the error message
      const errorMessage = errorFormat(error.message || error, {
        url,
        headers,
        body: requestBody,
        duration: Date.now() - now
      })
      this.error = new Error(errorMessage)
    } finally {
      // Reset the AbortController after the request is completed
      this.currentAbortController = null
    }
  }

  /**
   * Asynchronously gets campaigns for the given visitor.
   * @param visitor - The visitor for whom to get campaigns.
   * @returns A promise that resolves to an array of CampaignDTO.
   */
  public async getCampaignsAsync (visitor: VisitorAbstract): Promise<CampaignDTO[]> {
    return new Promise((resolve, reject) => {
      // Initiate data fetching
      this.fetchData(visitor)
      const intervalId = setInterval(() => {
        if (this.data) {
          // Resolve the promise when data is available
          resolve(this.data)
          clearInterval(intervalId)
        }
        if (this.error) {
          // Reject the promise if an error occurred
          reject(this.error)
          clearInterval(intervalId)
        }
      }, 100)
    })
  }
}
