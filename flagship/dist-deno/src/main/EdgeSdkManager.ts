import { BucketingDTO } from '../types.ts';
import { ISdkManager } from './ISdkManager.ts';
import { EAIConfig } from '../type.local.ts';
import { ITrackingManager } from '../api/ITrackingManager.ts';
import { IHttpClient } from '../utils/HttpClient.ts';
import { IFlagshipConfig } from '../config/IFlagshipConfig.ts';

type constructorParam = {
  httpClient: IHttpClient;
  sdkConfig: IFlagshipConfig;
  trackingManager: ITrackingManager;
  flagshipInstanceId: string;
}

export class EdgeSdkManager implements ISdkManager {
  protected _httpClient: IHttpClient;
  protected _config: IFlagshipConfig;
  protected _trackingManager: ITrackingManager;
  protected _bucketingContent?: BucketingDTO;
  protected _flagshipInstanceId: string;

  public constructor({ httpClient, sdkConfig, trackingManager, flagshipInstanceId }: constructorParam) {
    this._httpClient = httpClient;
    this._config = sdkConfig;
    this._trackingManager = trackingManager;
    this._bucketingContent = sdkConfig.initialBucketing;
    this._flagshipInstanceId = flagshipInstanceId;
  }

  resetSdk(): void {
    //
  }

  getBucketingContent(): BucketingDTO | undefined {
    return this._bucketingContent;
  }

  async initSdk(): Promise<void> {
    //
  }

  getEAIConfig(): EAIConfig|undefined {
    return undefined;
  }
}
