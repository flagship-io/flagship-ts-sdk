import { IBucketingConfig } from '../config/IBucketingConfig.ts'
import { IDecisionApiConfig } from '../config/IDecisionApiConfig.ts'
import { IEdgeConfig } from '../config/IEdgeConfig.ts'
import { Visitor } from '../visitor/Visitor.ts'
import { FSSdkStatus } from '../enum/FSSdkStatus.ts'
import { DecisionMode, FlagshipConfig, type IFlagshipConfig, BucketingConfig, DecisionApiConfig } from '../config/index.ts'
import { ConfigManager, IConfigManager } from '../config/ConfigManager.ts'
import { ApiManager } from '../decision/ApiManager.ts'
import { TrackingManager } from '../api/TrackingManager.ts'
import { FlagshipLogManager } from '../utils/FlagshipLogManager.ts'
import { isBrowser, logDebugSprintf, logError, logInfo, logInfoSprintf, logWarning, sprintf, uuidV4 } from '../utils/utils.ts'
import {
  INITIALIZATION_PARAM_ERROR,
  INITIALIZATION_STARTING,
  NEW_VISITOR_NOT_READY,
  PROCESS_INITIALIZATION,
  PROCESS_NEW_VISITOR,
  SDK_INFO,
  SDK_STARTED_INFO,
  PROCESS_SDK_STATUS,
  SDK_STATUS_CHANGED,
  SAVE_VISITOR_INSTANCE,
  CONSENT_NOT_SPECIFY_WARNING
} from '../enum/index.ts'
import { VisitorDelegate } from '../visitor/VisitorDelegate.ts'

import { BucketingManager } from '../decision/BucketingManager.ts'
import { MurmurHash } from '../utils/MurmurHash.ts'
import { DecisionManager } from '../decision/DecisionManager.ts'
import { HttpClient } from '../utils/HttpClient.ts'
import { NewVisitor } from '../types.ts'
import { DefaultHitCache } from '../cache/DefaultHitCache.ts'
import { DefaultVisitorCache } from '../cache/DefaultVisitorCache.ts'
import { EdgeManager } from '../decision/EdgeManager.ts'
import { EdgeConfig } from '../config/EdgeConfig.ts'
import { VisitorAbstract } from '../visitor/VisitorAbstract.ts'
import { launchQaAssistant } from '../qaAssistant/index.ts'
import { ISdkManager } from './ISdkManager.ts'
import { BucketingSdkManager } from './BucketingSdkManager.ts'
import { EdgeSdkManager } from './EdgeSdkManager.ts'
import { ApiSdkManager } from './ApiSdkManager.ts'
import { ITrackingManager } from '../api/ITrackingManager.ts'
import { EmotionAI as EmotionAINode } from '../emotionAI/EmotionAI.node.ts'
import { EmotionAI as EmotionAIBrowser } from '../emotionAI/EmotionAI.ts'
import { IEmotionAI } from '../emotionAI/IEmotionAI.ts'
import { IVisitorProfileCache } from '../type.local.ts'
import { VisitorProfileCacheNode } from '../visitor/VisitorProfileCacheNode.ts'
import { VisitorProfileCacheBrowser } from '../visitor/VisitorProfileCacheBrowser.ts'

/**
 * The `Flagship` class represents the SDK. It facilitates the initialization process and creation of new visitors.
 */
export class Flagship {
  // eslint-disable-next-line no-use-before-define
  private static _instance: Flagship
  private _configManager!: IConfigManager
  private _config!: IFlagshipConfig
  private _status!: FSSdkStatus
  private _visitorInstance?: Visitor
  private instanceId:string
  private lastInitializationTimestamp!: string
  private _sdkManager : ISdkManager|undefined
  private static visitorProfile:string|null
  private static onSaveVisitorProfile:(visitorProfile:string)=>void

  private set configManager (value: IConfigManager) {
    this._configManager = value
  }

  private get configManager (): IConfigManager {
    return this._configManager
  }

  private constructor () {
    this.instanceId = uuidV4()
    this._status = FSSdkStatus.SDK_NOT_INITIALIZED

    const extendedFlagship = Flagship as {
      setVisitorProfile?: (value: string|null) => void,
      getVisitorProfile?: () => string|null,
      setOnSaveVisitorProfile?: (value: (visitorProfile:string)=>void) => void,
      getOnSaveVisitorProfile?: () => (visitorProfile:string)=>void
    }

    extendedFlagship.setVisitorProfile = function (value: string|null) {
      Flagship.visitorProfile = value
    }
    extendedFlagship.getVisitorProfile = function () {
      return Flagship.visitorProfile
    }
    extendedFlagship.setOnSaveVisitorProfile = function (value: (visitorProfile:string)=>void) {
      Flagship.onSaveVisitorProfile = value
    }
    extendedFlagship.getOnSaveVisitorProfile = function () {
      return Flagship.onSaveVisitorProfile
    }
  }

  protected static getInstance (): Flagship {
    if (!this._instance) {
      this._instance = new this()
    }
    return this._instance
  }

  protected setStatus (status: FSSdkStatus): void {
    if (this._status === status) {
      return
    }

    this._status = status
    VisitorAbstract.SdkStatus = status

    const statusChanged = this.getConfig()?.onSdkStatusChanged

    logInfoSprintf(this._config, PROCESS_SDK_STATUS, SDK_STATUS_CHANGED, FSSdkStatus[status])

    if (this.getConfig().decisionMode !== DecisionMode.BUCKETING_EDGE) {
      if (status === FSSdkStatus.SDK_INITIALIZED) {
        this.configManager?.trackingManager?.startBatchingLoop()
      }
      if (status === FSSdkStatus.SDK_NOT_INITIALIZED) {
        this.configManager?.trackingManager?.stopBatchingLoop()
      }
    }

    if (statusChanged) {
      statusChanged(status)
    }
  }

  /**
   * Return current status of Flagship SDK.
   */
  public static getStatus (): FSSdkStatus {
    return this.getInstance()._status
  }

  /**
   * Return current status of Flagship SDK.
   */
  public getStatus (): FSSdkStatus {
    return this._status
  }

  /**
   * Return the current config set by the customer and used by the SDK.
   */
  public static getConfig (): IFlagshipConfig {
    return this.getInstance()._config
  }

  /**
   * Return the current config set by the customer and used by the SDK.
   */
  public getConfig (): IFlagshipConfig {
    return this._config
  }

  /**
   * Return the last visitor created if isNewInstance key is false. Return undefined otherwise.
   */
  public getVisitor (): Visitor | undefined {
    return this._visitorInstance
  }

  /**
   * Return the last visitor created if isNewInstance key is false. Return undefined otherwise.
   */
  public static getVisitor (): Visitor | undefined {
    return this.getInstance().getVisitor()
  }

  private buildConfig (config?: IDecisionApiConfig| IBucketingConfig |IEdgeConfig): FlagshipConfig {
    let newConfig: FlagshipConfig
    switch (config?.decisionMode) {
      case DecisionMode.BUCKETING:
        newConfig = new BucketingConfig(config)
        break
      case DecisionMode.BUCKETING_EDGE:
        newConfig = new EdgeConfig(config)
        break
      default:
        newConfig = new DecisionApiConfig(config)
        break
    }
    return newConfig
  }

  private createManagers (
    httpClient: HttpClient,
    sdkConfig: IFlagshipConfig,
    trackingManager: ITrackingManager
  ): { sdkManager: ISdkManager; decisionManager: DecisionManager } {
    let sdkManager: ISdkManager
    switch (sdkConfig.decisionMode) {
      case DecisionMode.BUCKETING:
        sdkManager = new BucketingSdkManager({ httpClient, sdkConfig, trackingManager, flagshipInstanceId: this.instanceId })
        return {
          sdkManager,
          decisionManager: new BucketingManager({
            httpClient,
            config: sdkConfig,
            murmurHash: new MurmurHash(),
            sdkManager
          })
        }
      case DecisionMode.BUCKETING_EDGE:
        sdkManager = new EdgeSdkManager({ httpClient, sdkConfig, trackingManager, flagshipInstanceId: this.instanceId })
        return {
          sdkManager,
          decisionManager: new EdgeManager({
            httpClient,
            config: sdkConfig,
            murmurHash: new MurmurHash(),
            sdkManager
          })
        }
      default:
        return {
          sdkManager: new ApiSdkManager({ httpClient, sdkConfig, trackingManager, flagshipInstanceId: this.instanceId }),
          decisionManager: new ApiManager(httpClient, sdkConfig)
        }
    }
  }

  private async initializeSdk (sdkConfig: IFlagshipConfig): Promise<void> {
    this.setStatus(FSSdkStatus.SDK_INITIALIZING)

    this._sdkManager?.resetSdk()

    const httpClient = new HttpClient()
    const trackingManager = this.configManager?.trackingManager || new TrackingManager(httpClient, sdkConfig, this.instanceId)

    const { sdkManager, decisionManager } = this.createManagers(httpClient, sdkConfig, trackingManager)

    this._sdkManager = sdkManager

    decisionManager.statusChangedCallback(this.setStatus.bind(this))
    decisionManager.flagshipInstanceId = this.instanceId

    this.configManager = new ConfigManager(sdkConfig, decisionManager, trackingManager)

    await this._sdkManager?.initSdk()

    this.setStatus(FSSdkStatus.SDK_INITIALIZED)
  }

  /**
   * Start the flagship SDK, with a custom configuration implementation
   * @param {string} envId : Environment id provided by Flagship.
   * @param {string} apiKey : Secure api key provided by Flagship.
   * @param {IFlagshipConfig} config : (optional) SDK configuration.
   */
  public static async start (
    envId: string,
    apiKey: string,
    config?: IDecisionApiConfig| IBucketingConfig |IEdgeConfig
  ): Promise<Flagship> {
    const flagship = this.getInstance()

    const localConfig = flagship.buildConfig(config)

    localConfig.envId = envId
    localConfig.apiKey = apiKey

    flagship._config = localConfig

    // check custom logger
    if (!localConfig.onLog && !localConfig.logManager) {
      localConfig.logManager = new FlagshipLogManager()
    }

    if (!envId || !apiKey) {
      flagship.setStatus(FSSdkStatus.SDK_NOT_INITIALIZED)
      logError(localConfig, INITIALIZATION_PARAM_ERROR, PROCESS_INITIALIZATION)
      return flagship
    }

    logDebugSprintf(localConfig, PROCESS_INITIALIZATION, INITIALIZATION_STARTING, SDK_INFO.version, localConfig.decisionMode, localConfig)

    if (!localConfig.hitCacheImplementation && isBrowser()) {
      localConfig.hitCacheImplementation = new DefaultHitCache()
    }

    if (!localConfig.visitorCacheImplementation && isBrowser()) {
      localConfig.visitorCacheImplementation = new DefaultVisitorCache()
    }

    await flagship.initializeSdk(localConfig)

    logInfo(
      localConfig,
      sprintf(SDK_STARTED_INFO, SDK_INFO.version, FSSdkStatus[flagship._status]),
      PROCESS_INITIALIZATION
    )

    launchQaAssistant(localConfig)

    flagship.lastInitializationTimestamp = new Date().toISOString()

    return flagship
  }

  /**
   * When called, it will batch and send all hits that are in the pool before the application is closed
   */
  public async close () {
    await Flagship.close()
  }

  /**
   * When called, it will batch and send all hits that are in the pool before the application is closed
   */
  public static async close () {
    await this._instance?.configManager?.trackingManager?.sendBatch()
  }

  /**
   * Creates a new Visitor instance.
   *
   * @param params - The parameters for creating the new Visitor.
   * @returns A new Visitor instance.
   */
  public newVisitor (params: NewVisitor) {
    return Flagship.newVisitor(params)
  }

  private initializeConfigManager (): void {
    const config = new DecisionApiConfig()
    config.logManager = new FlagshipLogManager()
    const httpClient = new HttpClient()
    const trackingManager = new TrackingManager(httpClient, config)
    const decisionManager = new ApiManager(httpClient, config)
    this._config = config
    this.configManager = new ConfigManager(config, decisionManager, trackingManager)
  }

  /**
   * Creates a new Visitor instance.
   *
   * @param params - The parameters for creating the new Visitor.
   * @returns A new Visitor instance.
   */
  public static newVisitor ({ visitorId, context, isAuthenticated, hasConsented, initialCampaigns, initialFlagsData, shouldSaveInstance, onFetchFlagsStatusChanged }: NewVisitor) {
    const saveInstance = shouldSaveInstance ?? isBrowser()
    const flagship = this.getInstance()

    if (!flagship.configManager) {
      flagship.initializeConfigManager()
      logError(flagship.getConfig(), NEW_VISITOR_NOT_READY, PROCESS_NEW_VISITOR)
    }

    const sdkConfig = flagship.getConfig()

    if (hasConsented === undefined) {
      logWarning(sdkConfig, CONSENT_NOT_SPECIFY_WARNING, PROCESS_NEW_VISITOR)
    }

    let emotionAi:IEmotionAI
    let visitorProfileCache:IVisitorProfileCache

    if (!isBrowser()) {
      emotionAi = new EmotionAINode({
        sdkConfig,
        httpClient: new HttpClient(),
        eAIConfig: flagship._sdkManager?.getEAIConfig()
      })
      visitorProfileCache = new VisitorProfileCacheNode(sdkConfig)
    } else {
      emotionAi = new EmotionAIBrowser({
        sdkConfig,
        httpClient: new HttpClient(),
        eAIConfig: flagship._sdkManager?.getEAIConfig()
      })
      visitorProfileCache = new VisitorProfileCacheBrowser(sdkConfig)
    }

    const visitorDelegate = new VisitorDelegate({
      visitorId,
      context: context || {},
      isAuthenticated: isAuthenticated ?? false,
      hasConsented: hasConsented ?? false,
      configManager: this.getInstance().configManager,
      initialCampaigns,
      initialFlagsData,
      onFetchFlagsStatusChanged,
      emotionAi,
      visitorProfileCache,
      monitoringData: {
        instanceId: this.getInstance().instanceId,
        lastInitializationTimestamp: this.getInstance().lastInitializationTimestamp,
        initialCampaigns,
        initialFlagsData
      },
      murmurHash: new MurmurHash()
    })

    const visitor = new Visitor(visitorDelegate)
    this.getInstance()._visitorInstance = saveInstance ? visitor : undefined

    if (saveInstance) {
      logDebugSprintf(sdkConfig, PROCESS_NEW_VISITOR, SAVE_VISITOR_INSTANCE, visitor.visitorId)
    }

    if (sdkConfig.fetchNow && sdkConfig.decisionMode !== DecisionMode.BUCKETING_EDGE) {
      visitor.fetchFlags()
    }

    return visitor
  }
}
