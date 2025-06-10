import { IBucketingConfig } from '../config/IBucketingConfig';
import { IDecisionApiConfig } from '../config/IDecisionApiConfig';
import { IEdgeConfig } from '../config/IEdgeConfig';
import { Visitor } from '../visitor/Visitor';
import { FSSdkStatus } from '../enum/FSSdkStatus';
import { DecisionMode, FlagshipConfig, type IFlagshipConfig, BucketingConfig, DecisionApiConfig } from '../config/index';
import { ConfigManager, IConfigManager } from '../config/ConfigManager';
import { ApiManager } from '../decision/ApiManager';
import { TrackingManager } from '../api/TrackingManager';
import { FlagshipLogManager } from '../utils/FlagshipLogManager';
import { isBrowser, logDebugSprintf, logError, logInfo, logInfoSprintf, logWarning, onDomReady, sprintf, uuidV4 } from '../utils/utils';
import { INITIALIZATION_PARAM_ERROR,
  INITIALIZATION_STARTING,
  NEW_VISITOR_NOT_READY,
  PROCESS_INITIALIZATION,
  PROCESS_NEW_VISITOR,
  SDK_INFO,
  SDK_STARTED_INFO,
  PROCESS_SDK_STATUS,
  SDK_STATUS_CHANGED,
  SAVE_VISITOR_INSTANCE,
  CONSENT_NOT_SPECIFY_WARNING } from '../enum/index';
import { VisitorDelegate } from '../visitor/VisitorDelegate';

import { BucketingManager } from '../decision/BucketingManager';
import { MurmurHash } from '../utils/MurmurHash';
import { DecisionManager } from '../decision/DecisionManager';
import { HttpClient } from '../utils/HttpClient';
import { ABTastyWebSDKPostMessageType, NewVisitor } from '../types';
import { EdgeManager } from '../decision/EdgeManager';
import { EdgeConfig } from '../config/EdgeConfig';
import { VisitorAbstract } from '../visitor/VisitorAbstract';
import { ISdkManager } from './ISdkManager';
import { BucketingSdkManager } from './BucketingSdkManager';
import { EdgeSdkManager } from './EdgeSdkManager';
import { ApiSdkManager } from './ApiSdkManager';
import { ITrackingManager } from '../api/ITrackingManager';
import { EmotionAI } from '../emotionAI/EmotionAI.node';
import { VisitorProfileCache } from '../visitor/VisitorProfileCache.node';
import { ISharedActionTracking } from '../sharedFeature/ISharedActionTracking';
import { DefaultVisitorCache } from '../cache/DefaultVisitorCache';
import { DefaultHitCache } from '../cache/DefaultHitCache';
import { SharedActionTracking } from '../sharedFeature/SharedActionTracking';
import { SdkApi } from '../sdkApi/v1/SdkApi';
import { VisitorVariationState } from '../type.local.ts';

/**
 * The `Flagship` class represents the SDK. It facilitates the initialization process and creation of new visitors.
 */
export class Flagship {

  private static _instance: Flagship;
  private _configManager!: IConfigManager;
  private _config!: IFlagshipConfig;
  private _status!: FSSdkStatus;
  private _visitorInstance?: Visitor;
  private instanceId: string;
  private lastInitializationTimestamp!: string;
  private _sdkManager: ISdkManager | undefined;
  private static visitorProfile: string | null;
  private static onSaveVisitorProfile: (visitorProfile: string) => void;
  private _sdkApi?: SdkApi;
  private _visitorVariationState: VisitorVariationState;

  private set configManager(value: IConfigManager) {
    this._configManager = value;
  }

  private get configManager(): IConfigManager {
    return this._configManager;
  }

  private constructor() {
    this.instanceId = uuidV4();
    this._status = FSSdkStatus.SDK_NOT_INITIALIZED;

    const extendedFlagship = Flagship as {
      setVisitorProfile?: (value: string | null) => void,
      getVisitorProfile?: () => string | null,
      setOnSaveVisitorProfile?: (value: (visitorProfile: string) => void) => void,
      getOnSaveVisitorProfile?: () => (visitorProfile: string) => void
    };

    extendedFlagship.setVisitorProfile = function (value: string | null): void {
      Flagship.visitorProfile = value;
    };
    extendedFlagship.getVisitorProfile = function (): string | null {
      return Flagship.visitorProfile;
    };
    extendedFlagship.setOnSaveVisitorProfile = function (value: (visitorProfile: string) => void): void {
      Flagship.onSaveVisitorProfile = value;
    };
    extendedFlagship.getOnSaveVisitorProfile = function (): (visitorProfile: string) => void {
      return Flagship.onSaveVisitorProfile;
    };
    this._visitorVariationState = {};
  }

  protected static getInstance(): Flagship {
    if (!this._instance) {
      this._instance = new this();
    }
    return this._instance;
  }

  protected setStatus(status: FSSdkStatus): void {
    if (this._status === status) {
      return;
    }

    this._status = status;
    VisitorAbstract.SdkStatus = status;

    const statusChanged = this.getConfig()?.onSdkStatusChanged;

    logInfoSprintf(this._config, PROCESS_SDK_STATUS, SDK_STATUS_CHANGED, FSSdkStatus[status]);

    if (this.getConfig().decisionMode !== DecisionMode.BUCKETING_EDGE) {
      if (status === FSSdkStatus.SDK_INITIALIZED) {
        this.configManager?.trackingManager?.startBatchingLoop();
      }
      if (status === FSSdkStatus.SDK_NOT_INITIALIZED) {
        this.configManager?.trackingManager?.stopBatchingLoop();
      }
    }

    if (statusChanged) {
      statusChanged(status);
    }
  }

  /**
   * Return current status of Flagship SDK.
   */
  public static getStatus(): FSSdkStatus {
    return this.getInstance()._status;
  }

  /**
   * Return current status of Flagship SDK.
   */
  public getStatus(): FSSdkStatus {
    return this._status;
  }

  /**
   * Return the current config set by the customer and used by the SDK.
   */
  public static getConfig(): IFlagshipConfig {
    return this.getInstance()._config;
  }

  /**
   * Return the current config set by the customer and used by the SDK.
   */
  public getConfig(): IFlagshipConfig {
    return this._config;
  }

  /**
   * Return the last visitor created if isNewInstance key is false. Return undefined otherwise.
   */
  public getVisitor(): Visitor | undefined {
    return this._visitorInstance;
  }

  /**
   * Return the last visitor created if isNewInstance key is false. Return undefined otherwise.
   */
  public static getVisitor(): Visitor | undefined {
    return this.getInstance().getVisitor();
  }

  private buildConfig(config?: IDecisionApiConfig | IBucketingConfig | IEdgeConfig): FlagshipConfig {
    let newConfig: FlagshipConfig;
    switch (config?.decisionMode) {
      case DecisionMode.BUCKETING:
        newConfig = new BucketingConfig(config);
        break;
      case DecisionMode.BUCKETING_EDGE:
        newConfig = new EdgeConfig(config);
        break;
      default:
        newConfig = new DecisionApiConfig(config);
        break;
    }
    return newConfig;
  }

  private createManagers(
    httpClient: HttpClient,
    sdkConfig: IFlagshipConfig,
    trackingManager: ITrackingManager
  ): { sdkManager: ISdkManager; decisionManager: DecisionManager } {
    let sdkManager: ISdkManager;
    switch (sdkConfig.decisionMode) {
      case DecisionMode.BUCKETING:
        sdkManager = new BucketingSdkManager({
          httpClient,
          sdkConfig,
          trackingManager,
          flagshipInstanceId: this.instanceId
        });
        return {
          sdkManager,
          decisionManager: new BucketingManager({
            httpClient,
            config: sdkConfig,
            murmurHash: new MurmurHash(),
            sdkManager,
            trackingManager,
            flagshipInstanceId: this.instanceId
          })
        };
      case DecisionMode.BUCKETING_EDGE:
        sdkManager = new EdgeSdkManager({
          httpClient,
          sdkConfig,
          trackingManager,
          flagshipInstanceId: this.instanceId
        });
        return {
          sdkManager,
          decisionManager: new EdgeManager({
            httpClient,
            config: sdkConfig,
            murmurHash: new MurmurHash(),
            sdkManager,
            trackingManager,
            flagshipInstanceId: this.instanceId
          })
        };
      default:
        sdkManager = new ApiSdkManager({
          httpClient,
          sdkConfig,
          trackingManager,
          flagshipInstanceId: this.instanceId
        });
        return {
          sdkManager,
          decisionManager: new ApiManager({
            trackingManager,
            httpClient,
            config: sdkConfig,
            flagshipInstanceId: this.instanceId
          })
        };
    }
  }

  private buildSdkApi(sharedActionTracking: ISharedActionTracking, sdkConfig: IFlagshipConfig): void {
    if (__fsWebpackIsBrowser__) {
      this._sdkApi = new SdkApi({ sharedActionTracking });
      window.ABTastyWebSdk = {
        envId: sdkConfig.envId,
        internal: this._sdkApi.getApiV1()
      };
    }
  }

  private sendInitializedPostMessage(): void {
    if (__fsWebpackIsBrowser__) {
      onDomReady(() => {
        window.postMessage({ action: ABTastyWebSDKPostMessageType.AB_TASTY_WEB_SDK_INITIALIZED }, '*');
      });
    }
  }

  private async initializeSdk(sdkConfig: IFlagshipConfig): Promise<void> {
    this.setStatus(FSSdkStatus.SDK_INITIALIZING);

    this._sdkManager?.resetSdk();

    let sharedActionTracking = this.configManager?.sharedActionTracking;
    if (__fsWebpackIsBrowser__) {
      if (!sharedActionTracking && isBrowser()) {
        sharedActionTracking = new SharedActionTracking({ sdkConfig });
        this.buildSdkApi(sharedActionTracking, sdkConfig);
      }
    }

    const httpClient = new HttpClient();
    const trackingManager = this.configManager?.trackingManager || new TrackingManager(httpClient, sdkConfig,
      this.instanceId, sharedActionTracking);

    const { sdkManager, decisionManager } = this.createManagers(httpClient, sdkConfig, trackingManager);

    this._sdkManager = sdkManager;

    decisionManager.statusChangedCallback(this.setStatus.bind(this));
    decisionManager.flagshipInstanceId = this.instanceId;

    this.configManager = new ConfigManager(sdkConfig, decisionManager, trackingManager, sharedActionTracking);

    await this._sdkManager?.initSdk();

    this.setStatus(FSSdkStatus.SDK_INITIALIZED);
  }

  /**
   * Start the flagship SDK, with a custom configuration implementation
   * @param {string} envId : Environment id provided by Flagship.
   * @param {string} apiKey : Secure api key provided by Flagship.
   * @param {IFlagshipConfig} config : (optional) SDK configuration.
   */
  public static async start(
    envId: string,
    apiKey: string,
    config?: IDecisionApiConfig | IBucketingConfig | IEdgeConfig
  ): Promise<Flagship> {
    const flagship = this.getInstance();

    const localConfig = flagship.buildConfig(config);

    localConfig.envId = envId;
    localConfig.apiKey = apiKey;

    flagship._config = localConfig;

    // check custom logger
    if (!localConfig.onLog && !localConfig.logManager) {
      localConfig.logManager = new FlagshipLogManager();
    }

    if (!envId || !apiKey) {
      flagship.setStatus(FSSdkStatus.SDK_NOT_INITIALIZED);
      logError(localConfig, INITIALIZATION_PARAM_ERROR, PROCESS_INITIALIZATION);
      return flagship;
    }

    logDebugSprintf(localConfig, PROCESS_INITIALIZATION, INITIALIZATION_STARTING, SDK_INFO.version, localConfig.decisionMode, localConfig);

    if (__fsWebpackIsBrowser__) {
      if (!localConfig.hitCacheImplementation && isBrowser()) {
        localConfig.hitCacheImplementation = new DefaultHitCache();
      }

      if (!localConfig.visitorCacheImplementation && isBrowser()) {
        localConfig.visitorCacheImplementation = new DefaultVisitorCache();
      }
    }

    await flagship.initializeSdk(localConfig);

    logInfo(
      localConfig,
      sprintf(SDK_STARTED_INFO, SDK_INFO.version, FSSdkStatus[flagship._status]),
      PROCESS_INITIALIZATION
    );

    if (__fsWebpackIsBrowser__) {
      import('../qaAssistant/index.ts').then((qaAssistant) => {
        qaAssistant.launchQaAssistant(localConfig, flagship._visitorVariationState);
      });
    }

    flagship.lastInitializationTimestamp = new Date().toISOString();

    flagship.sendInitializedPostMessage();

    return flagship;
  }

  /**
   * When called, it will batch and send all hits that are in the pool before the application is closed
   */
  public async close(): Promise<void> {
    await Flagship.close();
  }

  /**
   * When called, it will batch and send all hits that are in the pool before the application is closed
   */
  public static async close(): Promise<void> {
    await this._instance?.configManager?.trackingManager?.sendBatch();
  }

  /**
   * Creates a new Visitor instance.
   *
   * @param params - The parameters for creating the new Visitor.
   * @returns A new Visitor instance.
   */
  public newVisitor(params: NewVisitor): Visitor {
    return Flagship.newVisitor(params);
  }

  private initializeConfigManager(): void {
    const config = new DecisionApiConfig();
    config.logManager = new FlagshipLogManager();
    const httpClient = new HttpClient();
    const trackingManager = new TrackingManager(httpClient, config);
    const decisionManager = new ApiManager({
      httpClient,
      config,
      trackingManager
    });
    this._config = config;
    this.configManager = new ConfigManager(config, decisionManager, trackingManager);
  }

  /**
   * Creates a new Visitor instance.
   *
   * @param params - The parameters for creating the new Visitor.
   * @returns A new Visitor instance.
   */
  public static newVisitor({ visitorId, context, isAuthenticated, hasConsented, initialCampaigns, initialFlagsData, shouldSaveInstance, onFlagsStatusChanged }: NewVisitor): Visitor {
    const saveInstance = shouldSaveInstance ?? isBrowser();
    const flagship = this.getInstance();

    if (!flagship.configManager) {
      flagship.initializeConfigManager();
      logError(flagship.getConfig(), NEW_VISITOR_NOT_READY, PROCESS_NEW_VISITOR);
    }

    const sdkConfig = flagship.getConfig();
    const configManager = flagship.configManager;

    if (hasConsented === undefined) {
      logWarning(sdkConfig, CONSENT_NOT_SPECIFY_WARNING, PROCESS_NEW_VISITOR);
    }

    const emotionAi = new EmotionAI({
      sdkConfig,
      httpClient: new HttpClient(),
      eAIConfig: flagship._sdkManager?.getEAIConfig()
    });
    const visitorProfileCache = new VisitorProfileCache(sdkConfig);

    const visitorDelegate = new VisitorDelegate({
      visitorId,
      context: context || {},
      isAuthenticated: isAuthenticated ?? false,
      hasConsented: hasConsented ?? false,
      configManager,
      initialCampaigns,
      initialFlagsData,
      onFlagsStatusChanged,
      emotionAi,
      visitorProfileCache,
      monitoringData: {
        instanceId: this.getInstance().instanceId,
        lastInitializationTimestamp: this.getInstance().lastInitializationTimestamp,
        initialCampaigns,
        initialFlagsData
      },
      murmurHash: new MurmurHash(),
      visitorVariationState: flagship._visitorVariationState
    });

    if (__fsWebpackIsBrowser__) {
      onDomReady(() => {
        if (isBrowser()) {
          flagship._sdkApi?.setVisitor(visitorDelegate);
          if (configManager.sharedActionTracking) {
            configManager.sharedActionTracking.initialize(visitorDelegate);
          }
        }
      });
    }

    const visitor = new Visitor(visitorDelegate);
    this.getInstance()._visitorInstance = saveInstance ? visitor : undefined;

    if (saveInstance) {
      logDebugSprintf(sdkConfig, PROCESS_NEW_VISITOR, SAVE_VISITOR_INSTANCE, visitor.visitorId);
    }

    if (sdkConfig.fetchNow && sdkConfig.decisionMode !== DecisionMode.BUCKETING_EDGE) {
      visitor.fetchFlags();
    }

    return visitor;
  }
}
