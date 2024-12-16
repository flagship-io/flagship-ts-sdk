import { EAIConfig } from '../type.local'
import { AccountSettings, BucketingDTO, TroubleshootingLabel } from '../types'
import { ISdkManager } from './ISdkManager'
import { ITrackingManager } from '../api/ITrackingManager'
import { IHttpClient, IHttpResponse } from '../utils/HttpClient'
import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { CDN_ACCOUNT_SETTINGS_URL } from '../enum/FlagshipConstant'
import { logErrorSprintf, sprintf } from '../utils/utils'
import { Troubleshooting } from '../hit/Troubleshooting'
import { LogLevel } from '../enum/LogLevel'

type constructorParam = {
  httpClient: IHttpClient;
  sdkConfig: IFlagshipConfig;
  trackingManager: ITrackingManager;
  flagshipInstanceId: string;
}

export class ApiSdkManager implements ISdkManager {
  protected _httpClient: IHttpClient
  protected _config: IFlagshipConfig
  protected _trackingManager: ITrackingManager
  protected _EAIConfig?: EAIConfig
  protected _flagshipInstanceId: string

  public constructor ({ httpClient, sdkConfig, trackingManager, flagshipInstanceId }: constructorParam) {
    this._httpClient = httpClient
    this._config = sdkConfig
    this._trackingManager = trackingManager
    this._flagshipInstanceId = flagshipInstanceId
  }

  resetSdk (): void {
    this._EAIConfig = undefined
  }

  getBucketingContent (): BucketingDTO | undefined {
    return undefined
  }

  protected sendTroubleshooting (accountSettings:AccountSettings,
    url: string,
    response: IHttpResponse | undefined,
    now: number) {
    const troubleshooting = new Troubleshooting({
      flagshipInstanceId: this._flagshipInstanceId,
      label: TroubleshootingLabel.ACCOUNT_SETTINGS,
      logLevel: LogLevel.DEBUG,
      visitorId: this._flagshipInstanceId,
      config: this._config,
      accountSettings,
      traffic: 0,
      httpRequestMethod: 'POST',
      httpRequestUrl: url,
      httpResponseHeaders: response?.headers,
      httpResponseCode: response?.status,
      httpResponseTime: Date.now() - now
    })

    this._trackingManager.initTroubleshootingHit = troubleshooting
  }

  protected sendErrorTroubleshooting (
    url: string,
    error: { message: string, headers: Record<string, string>, statusCode: number },
    now: number
  ) {
    const troubleshootingHit = new Troubleshooting({
      visitorId: this._flagshipInstanceId,
      flagshipInstanceId: this._flagshipInstanceId,
      label: TroubleshootingLabel.SDK_BUCKETING_FILE_ERROR,
      traffic: 0,
      logLevel: LogLevel.INFO,
      config: this._config,
      httpRequestMethod: 'POST',
      httpRequestUrl: url,
      httpResponseBody: error?.message,
      httpResponseHeaders: error?.headers,
      httpResponseCode: error?.statusCode,
      httpResponseTime: Date.now() - now
    })
    this._trackingManager.initTroubleshootingHit = troubleshootingHit
  }

  async initSdk (): Promise<void> {
    const now = Date.now()
    const url = sprintf(CDN_ACCOUNT_SETTINGS_URL, this._config.envId)
    try {
      const response = await this._httpClient.getAsync(url)
      this._EAIConfig = response.body.accountSettings
      this.sendTroubleshooting(response.body.accountSettings, url, response, now)
    } catch (error:any) {
      logErrorSprintf(this._config, 'Error while fetching EAI config: {0}', error?.message || error)
      this.sendErrorTroubleshooting(url, error, now)
    }
  }

  getEAIConfig (): EAIConfig|undefined {
    return this._EAIConfig as EAIConfig
  }
}
