import { IDecisionManager } from './IDecisionManager'
import { DecisionMode, IFlagshipConfig } from '../config/index'
import { IHttpClient, IHttpResponse } from '../utils/HttpClient'
import { VisitorAbstract } from '../visitor/VisitorAbstract'
import { BASE_API_URL, BUCKETING_API_URL, BUCKETING_POOLING_STARTED, BUCKETING_POOLING_STOPPED, BUCKETING_STATUS_EVENT, EXPOSE_ALL_KEYS, FETCH_FLAGS_PANIC_MODE, FSSdkStatus, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_APP, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, LogLevel, POLLING_EVENT_200, POLLING_EVENT_300, POLLING_EVENT_FAILED, PROCESS_BUCKETING, PROCESS_FETCHING_FLAGS, SDK_API_POLLING, SDK_BUCKETING_POLLING, SDK_INFO, URL_CAMPAIGNS } from '../enum/index'
import { CampaignDTO, FlagDTO, TroubleshootingData, TroubleshootingLabel } from '../types'
import { errorFormat, logDebug, logDebugSprintf, logError, logInfo, sprintf } from '../utils/utils'
import { Troubleshooting } from '../hit/Troubleshooting'
import { ITrackingManager } from '../api/ITrackingManager'
import { BucketingDTO } from './api/bucketingDTO'
import { WeakEventEmitter } from '../utils/WeakEventEmitter'

export abstract class DecisionManager extends WeakEventEmitter implements IDecisionManager {
  protected _bucketingContent?: BucketingDTO
  protected _config: IFlagshipConfig
  protected _panic = false
  protected _httpClient: IHttpClient
  private _statusChangedCallback! : (status: FSSdkStatus)=>void
  private _troubleshooting? : TroubleshootingData
  private _lastModified!: string
  private _isPooling!: boolean
  private _isFirstPooling: boolean
  private _intervalID!: NodeJS.Timer
  protected _bucketingStatus?: number

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
    this.updateFlagshipStatus(v ? FSSdkStatus.SDK_PANIC : FSSdkStatus.SDK_INITIALIZED)
    this._panic = v
    if (v) {
      logDebug(this.config, FETCH_FLAGS_PANIC_MODE, PROCESS_FETCHING_FLAGS)
    }
  }

  public statusChangedCallback (v : (status: FSSdkStatus)=>void):void {
    this._statusChangedCallback = v
  }

  public constructor (httpClient: IHttpClient, config: IFlagshipConfig) {
    super()
    this._config = config
    this._httpClient = httpClient
    this._isFirstPooling = true
  }

  protected updateFlagshipStatus (v:FSSdkStatus):void {
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
      const troubleshooting = new Troubleshooting({
        label: TroubleshootingLabel.GET_CAMPAIGNS_ROUTE_RESPONSE_ERROR,
        logLevel: LogLevel.ERROR,
        visitorId: visitor.visitorId,
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
      })

      await this.trackingManager.addTroubleshootingHit(troubleshooting)

      const errorMessage = errorFormat(error.message || error, {
        url,
        headers,
        body: requestBody,
        duration: Date.now() - now
      })
      throw new Error(errorMessage)
    }
  }

  public bucketingStatus (): number|undefined {
    return this._bucketingStatus
  }

  public setBucketingStatus (status: number): void {
    this._bucketingStatus = status
    this.emit(BUCKETING_STATUS_EVENT, status)
  }

  private finishLoop (params: {response: IHttpResponse, headers: Record<string, string>, url: string, now: number}) {
    const { response, headers, url, now } = params
    if (response.status === 200) {
      logDebugSprintf(this.config, PROCESS_BUCKETING, POLLING_EVENT_200, response.body)
      this._bucketingContent = response.body
      this._lastBucketingTimestamp = new Date().toISOString()
      const troubleshootingHit = new Troubleshooting({
        visitorId: this.flagshipInstanceId,
        flagshipInstanceId: this.flagshipInstanceId,
        label: TroubleshootingLabel.SDK_BUCKETING_FILE,
        traffic: 0,
        logLevel: LogLevel.INFO,
        config: this.config,
        httpRequestHeaders: headers,
        httpRequestMethod: 'POST',
        httpRequestUrl: url,
        httpResponseBody: response?.body,
        httpResponseHeaders: response?.headers,
        httpResponseCode: response?.status,
        httpResponseTime: Date.now() - now
      })
      this.trackingManager.sendTroubleshootingHit(troubleshootingHit)
    } else if (response.status === 304) {
      logDebug(this.config, POLLING_EVENT_300, PROCESS_BUCKETING)
    }

    this.setBucketingStatus(response.status)

    if (response.headers && response.headers['last-modified']) {
      const lastModified = response.headers['last-modified']

      if (this._lastModified !== lastModified && this.config.onBucketingUpdated) {
        this.config.onBucketingUpdated(new Date(lastModified))
      }
      this._lastModified = lastModified
    }

    if (this._isFirstPooling) {
      this._isFirstPooling = false
      this.updateFlagshipStatus(FSSdkStatus.SDK_INITIALIZED)
    }

    if (typeof this.config.onBucketingSuccess === 'function') {
      this.config.onBucketingSuccess({ status: response.status, payload: this._bucketingContent })
    }

    this._isPooling = false
  }

  async startPolling (): Promise<void> {
    const timeout = this.config.pollingInterval as number * 1000
    logInfo(this.config, BUCKETING_POOLING_STARTED, PROCESS_BUCKETING)
    await this.polling()
    if (timeout === 0) {
      return
    }
    this._intervalID = setInterval(() => {
      this.polling()
    }, timeout)
  }

  private async polling () {
    if (this._isPooling) {
      return
    }
    this._isPooling = true
    if (this._isFirstPooling) {
      this.updateFlagshipStatus(FSSdkStatus.SDK_INITIALIZING)
    }
    const url = sprintf(BUCKETING_API_URL, this.config.envId)

    const headerApp:string = this.config.decisionMode === DecisionMode.DECISION_API ? SDK_API_POLLING : SDK_BUCKETING_POLLING
    const headers: Record<string, string> = {
      [HEADER_X_APP]: headerApp,
      [HEADER_X_SDK_CLIENT]: SDK_INFO.name,
      [HEADER_X_SDK_VERSION]: SDK_INFO.version,
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }
    const now = Date.now()
    try {
      if (this._lastModified) {
        headers['if-modified-since'] = this._lastModified
      }

      const sendRequestAsync = this.config.decisionMode === DecisionMode.DECISION_API
        ? this._httpClient.getAsync.bind(this._httpClient)
        : this._httpClient.getAsync.bind(this._httpClient)

      const response = await sendRequestAsync(url, {
        headers,
        timeout: this.config.timeout,
        nextFetchConfig: this.config.nextFetchConfig
      })

      this.finishLoop({ response, headers, url, now })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      this._isPooling = false
      logError(this.config, errorFormat(POLLING_EVENT_FAILED, {
        url,
        headers,
        nextFetchConfig: this.config.nextFetchConfig,
        method: 'GET',
        duration: Date.now() - now,
        error: error?.message || error
      }), PROCESS_BUCKETING)
      if (this._isFirstPooling) {
        this.updateFlagshipStatus(FSSdkStatus.SDK_NOT_INITIALIZED)
      }
      if (typeof this.config.onBucketingFail === 'function') {
        this.config.onBucketingFail(new Error(error))
      }
      const troubleshootingHit = new Troubleshooting({
        visitorId: this.flagshipInstanceId,
        flagshipInstanceId: this.flagshipInstanceId,
        label: TroubleshootingLabel.SDK_BUCKETING_FILE_ERROR,
        traffic: 0,
        logLevel: LogLevel.INFO,
        config: this.config,
        httpRequestHeaders: headers,
        httpRequestMethod: 'GET',
        httpRequestUrl: url,
        httpResponseBody: error?.message,
        httpResponseHeaders: error?.headers,
        httpResponseCode: error?.statusCode,
        httpResponseTime: Date.now() - now
      })
      this.trackingManager.sendTroubleshootingHit(troubleshootingHit)
    }
  }

  public stopPolling (): void {
    clearInterval(this._intervalID)
    this._isPooling = false
    logInfo(this.config, BUCKETING_POOLING_STOPPED, PROCESS_BUCKETING)
  }
}
