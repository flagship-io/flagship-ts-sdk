import { EAIConfig } from '../type.local.ts'
import { BucketingDTO, TroubleshootingLabel } from '../types.ts'
import { ISdkManager } from './ISdkManager.ts'
import { IFlagshipConfig } from '../config/IFlagshipConfig.ts'
import { IHttpClient, IHttpResponse } from '../utils/HttpClient.ts'
import { ITrackingManager } from '../api/ITrackingManager.ts'
import { BUCKETING_API_URL, BUCKETING_POOLING_STARTED, BUCKETING_POOLING_STOPPED, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, LogLevel, POLLING_EVENT_200, POLLING_EVENT_300, POLLING_EVENT_FAILED, PROCESS_BUCKETING, SDK_INFO } from '../enum/index.ts'
import { errorFormat, logDebug, logDebugSprintf, logError, logInfo, sprintf } from '../utils/utils.ts'

type constructorParam = {
  httpClient: IHttpClient;
  sdkConfig: IFlagshipConfig;
  trackingManager: ITrackingManager;
  flagshipInstanceId: string;
}

export class BucketingSdkManager implements ISdkManager {
  protected _httpClient: IHttpClient
  protected _config: IFlagshipConfig
  protected _trackingManager: ITrackingManager
  protected _intervalID?: NodeJS.Timeout
  protected _lastModified: string
  protected _isPooling!: boolean
  protected _EAIConfig?: EAIConfig
  protected _bucketingContent?: BucketingDTO
  protected _lastBucketingTimestamp!: string
  protected _flagshipInstanceId: string

  public constructor ({ httpClient, sdkConfig, trackingManager, flagshipInstanceId }: constructorParam) {
    this._httpClient = httpClient
    this._config = sdkConfig
    this._trackingManager = trackingManager
    this._bucketingContent = sdkConfig.initialBucketing
    this._flagshipInstanceId = flagshipInstanceId
    this._lastModified = ''
  }

  resetSdk (): void {
    if (this._intervalID) {
      clearInterval(this._intervalID)
    }
    this._isPooling = false
    this._intervalID = undefined
    this._lastModified = ''
    this._bucketingContent = undefined
    this._EAIConfig = undefined
    logInfo(this._config, BUCKETING_POOLING_STOPPED, PROCESS_BUCKETING)
  }

  getBucketingContent (): BucketingDTO | undefined {
    return this._bucketingContent
  }

  async initSdk (): Promise<void> {
    const timeout = this._config.pollingInterval as number * 1000
    logInfo(this._config, BUCKETING_POOLING_STARTED, PROCESS_BUCKETING)
    await this.fetchBucketingFile()
    if (timeout === 0) {
      return
    }
    this._intervalID = setInterval(() => {
      this.fetchBucketingFile()
    }, timeout)
  }

  getEAIConfig (): EAIConfig|undefined {
    return this._EAIConfig
  }

  protected sendTroubleshooting (
    headers: Record<string, string>,
    url: string,
    response: IHttpResponse | undefined,
    now: number
  ) {
    import('../hit/Troubleshooting.ts').then(({ Troubleshooting }) => {
      const troubleshootingHit = new Troubleshooting({
        visitorId: this._flagshipInstanceId,
        flagshipInstanceId: this._flagshipInstanceId,
        label: TroubleshootingLabel.SDK_BUCKETING_FILE,
        traffic: 0,
        logLevel: LogLevel.INFO,
        config: this._config,
        httpRequestHeaders: headers,
        httpRequestMethod: 'POST',
        httpRequestUrl: url,
        httpResponseBody: response?.body,
        httpResponseHeaders: response?.headers,
        httpResponseCode: response?.status,
        httpResponseTime: Date.now() - now
      })
      this._trackingManager.initTroubleshootingHit = troubleshootingHit
    })
  }

  protected sendErrorTroubleshooting (
    headers: Record<string, string>,
    url: string,
    error: { message: string, headers: Record<string, string>, statusCode: number },
    now: number
  ) {
    import('../hit/Troubleshooting.ts').then(({ Troubleshooting }) => {
      const troubleshootingHit = new Troubleshooting({
        visitorId: this._flagshipInstanceId,
        flagshipInstanceId: this._flagshipInstanceId,
        label: TroubleshootingLabel.SDK_BUCKETING_FILE_ERROR,
        traffic: 0,
        logLevel: LogLevel.INFO,
        config: this._config,
        httpRequestHeaders: headers,
        httpRequestMethod: 'POST',
        httpRequestUrl: url,
        httpResponseBody: error?.message,
        httpResponseHeaders: error?.headers,
        httpResponseCode: error?.statusCode,
        httpResponseTime: Date.now() - now
      })
      this._trackingManager.initTroubleshootingHit = troubleshootingHit
    })
  }

  protected handlePollingResponse (params: {response: IHttpResponse, headers: Record<string, string>, url: string, now: number}) {
    const { response } = params
    if (response.status === 200) {
      logDebugSprintf(this._config, PROCESS_BUCKETING, POLLING_EVENT_200, response.body)
      this._bucketingContent = response.body
      this._lastBucketingTimestamp = new Date().toISOString()
      this._EAIConfig = {
        eaiCollectEnabled: !!this._bucketingContent?.accountSettings?.eaiActivationEnabled,
        eaiActivationEnabled: !!this._bucketingContent?.accountSettings?.eaiCollectEnabled
      }
      this.sendTroubleshooting(params.headers, params.url, response, params.now)
    } else if (response.status === 304) {
      logDebug(this._config, POLLING_EVENT_300, PROCESS_BUCKETING)
    }

    const lastModified = response?.headers?.['last-modified']

    if (lastModified) {
      if (this._lastModified !== lastModified && this._config.onBucketingUpdated) {
        this._config.onBucketingUpdated(new Date(lastModified))
      }
      this._lastModified = lastModified
    }

    this._isPooling = false
  }

  protected async fetchBucketingFile () {
    if (this._isPooling) {
      return
    }
    this._isPooling = true

    const url = sprintf(BUCKETING_API_URL, this._config.envId)
    const headers: Record<string, string> = {
      [HEADER_X_SDK_CLIENT]: SDK_INFO.name,
      [HEADER_X_SDK_VERSION]: SDK_INFO.version,
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }
    const now = Date.now()
    try {
      if (this._lastModified) {
        headers['if-modified-since'] = this._lastModified
      }

      const response = await this._httpClient.getAsync(url, {
        headers,
        timeout: this._config.timeout,
        nextFetchConfig: this._config.nextFetchConfig
      })

      this.handlePollingResponse({ response, headers, url, now })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      this._isPooling = false
      logError(this._config, errorFormat(POLLING_EVENT_FAILED, {
        url,
        headers,
        error,
        nextFetchConfig: this._config.nextFetchConfig,
        method: 'GET',
        duration: Date.now() - now
      }), PROCESS_BUCKETING)
      this.sendErrorTroubleshooting(headers, url, error, now)
    }
  }
}
