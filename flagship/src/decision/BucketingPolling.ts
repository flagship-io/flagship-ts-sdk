import { BUCKETING_API_URL, BUCKETING_POOLING_STARTED, BUCKETING_POOLING_STOPPED, BUCKETING_STATUS_EVENT, FSSdkStatus, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, LogLevel, POLLING_EVENT_200, POLLING_EVENT_300, POLLING_EVENT_FAILED, PROCESS_BUCKETING, SDK_INFO } from '../enum/index'
import { TroubleshootingData, TroubleshootingLabel } from '../types'
import { IBucketingPolling } from './IBucketingPolling'
import { WeakEventEmitter } from '../utils/WeakEventEmitter'
import { errorFormat, logDebug, logDebugSprintf, logError, logInfo, sprintf } from '../utils/utils'
import { IHttpClient, IHttpResponse } from '../utils/HttpClient'
import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { ITrackingManager } from '../api/ITrackingManager'
import { Troubleshooting } from '../hit/Troubleshooting'
import { BucketingDTO, TroubleshootingDTO } from './api/bucketingDTO'

type BucketingPollingConstructor = {
    httpClient: IHttpClient
    config: IFlagshipConfig
    flagshipInstanceId: string
    trackingManager: ITrackingManager
}

type handlePollingErrorParams = {
    url: string
    headers: Record<string, string>
    now: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: any
}

export class BucketingPolling extends WeakEventEmitter implements IBucketingPolling {
  protected _isPooling: boolean
  protected _isFirstPooling: boolean
  protected _onStatusChanged?: (status: FSSdkStatus) => void
  protected _httpClient: IHttpClient
  protected _config: IFlagshipConfig
  protected _lastModified?: string
  protected _lastBucketingTimestamp?: string
  protected _trackingManager: ITrackingManager
  protected _isPanicMode: boolean
  protected _troubleshootingData?: TroubleshootingData
  protected _flagshipInstanceId: string
  protected _bucketingContent?: BucketingDTO
  protected _bucketingStatus?: number
  protected _intervalID!: NodeJS.Timer

  public constructor ({ httpClient, config, trackingManager, flagshipInstanceId }:BucketingPollingConstructor) {
    super()
    this._isPooling = false
    this._isFirstPooling = true
    this._httpClient = httpClient
    this._config = config
    this._trackingManager = trackingManager
    this._isPanicMode = false
    this._flagshipInstanceId = flagshipInstanceId
    if (config.initialBucketing) {
      this._bucketingContent = config.initialBucketing
    }
  }

  protected updateFlagshipStatus (v:FSSdkStatus):void {
    this._onStatusChanged?.(v)
  }

  public setBucketingStatus (status: number): void {
    this._bucketingStatus = status
    this.emit(BUCKETING_STATUS_EVENT, status)
  }

  protected setPanicMode (v:boolean):void {
    if (this._isPanicMode === v) {
      return
    }
    this._isPanicMode = v
    this.updateFlagshipStatus(v ? FSSdkStatus.SDK_PANIC : FSSdkStatus.SDK_INITIALIZED)
  }

  protected setTroubleshootingData (v?:TroubleshootingDTO):void {
    if (!v || this._isPanicMode) {
      this._troubleshootingData = undefined
      this._trackingManager.troubleshootingData = undefined
      return
    }
    this._troubleshootingData = {
      startDate: new Date(v.startDate),
      endDate: new Date(v.endDate),
      timezone: v.timezone,
      traffic: v.traffic
    }
    this._trackingManager.troubleshootingData = this._troubleshootingData
  }

  protected sendTroubleshootingHit ({
    url,
    headers,
    now,
    response
  }:{
    url: string
    headers: Record<string, string>
    now: number,
    response?: any
  }):void {
    const config = this._config
    const troubleshootingHit = new Troubleshooting({
      visitorId: this._flagshipInstanceId,
      flagshipInstanceId: this._flagshipInstanceId,
      label: TroubleshootingLabel.SDK_BUCKETING_FILE,
      traffic: 0,
      logLevel: LogLevel.INFO,
      config,
      httpRequestHeaders: headers,
      httpRequestMethod: 'POST',
      httpRequestUrl: url,
      httpResponseBody: response?.body,
      httpResponseHeaders: response?.headers,
      httpResponseCode: response?.status,
      httpResponseTime: Date.now() - now
    })
    this._trackingManager.sendTroubleshootingHit(troubleshootingHit)
  }

  protected handlePollingError ({ url, headers, now, error }:handlePollingErrorParams):void {
    const config = this._config
    this._isPooling = false
    logError(config, errorFormat(POLLING_EVENT_FAILED, {
      url,
      headers,
      nextFetchConfig: config.nextFetchConfig,
      method: 'GET',
      duration: Date.now() - now,
      error: error?.message || error
    }), PROCESS_BUCKETING)

    if (this._isFirstPooling) {
      this.updateFlagshipStatus(FSSdkStatus.SDK_NOT_INITIALIZED)
    }
    //   if (typeof config.onBucketingFail === 'function') {
    //     config.onBucketingFail(new Error(error))
    //   }
    this.sendTroubleshootingHit({ url, headers, now, response: error })
  }

  private handlePollingResponse (params: {response: IHttpResponse, headers: Record<string, string>, url: string, now: number}) {
    const { response, headers, url, now } = params
    const config = this._config
    if (response.status === 200) {
      logDebugSprintf(config, PROCESS_BUCKETING, POLLING_EVENT_200, response.body)
      this._bucketingContent = response.body
      this.setPanicMode(!!this._bucketingContent?.panic)
      this.setTroubleshootingData(this._bucketingContent?.accountSettings?.troubleshooting)
      this._lastBucketingTimestamp = new Date().toISOString()
      this.sendTroubleshootingHit({ url, headers, now, response })
    } else if (response.status === 304) {
      logDebug(config, POLLING_EVENT_300, PROCESS_BUCKETING)
    }

    this.setBucketingStatus(response.status)

    if (response.headers && response.headers['last-modified']) {
      const lastModified = response.headers['last-modified']

      //   if (this._lastModified !== lastModified && this.config.onBucketingUpdated) {
      //     config.onBucketingUpdated(new Date(lastModified))
      //   }
      this._lastModified = lastModified
    }

    if (this._isFirstPooling) {
      this._isFirstPooling = false
    }

    // if (typeof this.config.onBucketingSuccess === 'function') {
    //   this.config.onBucketingSuccess({ status: response.status, payload: this._bucketingContent })
    // }

    this._isPooling = false
  }

  private async polling () {
    if (this._isPooling) {
      return
    }
    const config = this._config
    this._isPooling = true
    if (this._isFirstPooling) {
      this.updateFlagshipStatus(FSSdkStatus.SDK_INITIALIZING)
    }
    const url = sprintf(BUCKETING_API_URL, config.envId)

    // const headerApp:string = config.decisionMode === DecisionMode.DECISION_API ? SDK_API_POLLING : SDK_BUCKETING_POLLING
    const headers: Record<string, string> = {
    //   [HEADER_X_APP]: headerApp,
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
        timeout: config.timeout,
        nextFetchConfig: config.nextFetchConfig
      })

      this.handlePollingResponse({ response, headers, url, now })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      this._isPooling = false
      this.handlePollingError({ url, headers, now, error })
    }
  }

  async startPolling (): Promise<void> {
    const config = this._config
    const timeout = config.pollingInterval as number * 1000
    logInfo(config, BUCKETING_POOLING_STARTED, PROCESS_BUCKETING)
    await this.polling()
    if (timeout === 0) {
      return
    }
    this._intervalID = setInterval(() => {
      this.polling()
    }, timeout)
  }

  stopPolling (): void {
    clearInterval(this._intervalID)
    this._isPooling = false
    logInfo(this._config, BUCKETING_POOLING_STOPPED, PROCESS_BUCKETING)
  }

  bucketingStatus (): number | undefined {
    return this._bucketingStatus
  }

  getLastPollingTimestamp (): string | undefined {
    return this._lastBucketingTimestamp
  }

  getTroubleshootingData (): TroubleshootingData | undefined {
    return this._troubleshootingData
  }

  onStatusChanged (func: (status: FSSdkStatus) => void): void {
    this._onStatusChanged = func
  }

  isPanicMode (): boolean {
    return this._isPanicMode
  }

  getBucketingContent (): BucketingDTO | undefined {
    return this._bucketingContent
  }
}
