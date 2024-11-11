import { EAIConfig } from '../type.local'
import { BucketingDTO } from '../types'
import { ISdkManager } from './ISdkManager'
import { ITrackingManager } from '../api/ITrackingManager'
import { IHttpClient } from '../utils/HttpClient'
import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { CDN_ACCOUNT_SETTINGS_URL } from '../enum/FlagshipConstant'
import { logErrorSprintf, sprintf } from '../utils/utils'

type constructorParam = {
  httpClient: IHttpClient;
  sdkConfig: IFlagshipConfig;
  trackingManager: ITrackingManager;
}

export class ApiSdkManager implements ISdkManager {
  protected _httpClient: IHttpClient
  protected _config: IFlagshipConfig
  protected _trackingManager: ITrackingManager
  protected _EAIConfig?: EAIConfig

  public constructor ({ httpClient, sdkConfig, trackingManager }: constructorParam) {
    this._httpClient = httpClient
    this._config = sdkConfig
    this._trackingManager = trackingManager
  }

  resetSdk (): void {
    this._EAIConfig = undefined
  }

  getBucketingContent (): BucketingDTO | undefined {
    return undefined
  }

  async initSdk (): Promise<void> {
    try {
      const url = sprintf(CDN_ACCOUNT_SETTINGS_URL, this._config.envId)
      const response = await this._httpClient.getAsync(url)
      this._EAIConfig = response.body
    } catch (error:any) {
      logErrorSprintf(this._config, 'Error while fetching EAI config: {0}', error?.message || error)
    }
  }

  getEAIConfig (): EAIConfig|undefined {
    return this._EAIConfig as EAIConfig
  }
}
