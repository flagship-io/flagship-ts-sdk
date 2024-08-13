import { IBucketingConfig } from '../config/IBucketingConfig'
import { IDecisionApiConfig } from '../config/IDecisionApiConfig'
import { IEdgeConfig } from '../config/IEdgeConfig'
import { Visitor } from '../visitor/Visitor'
import { FSSdkStatus } from '../enum/FSSdkStatus'
import { DecisionMode, FlagshipConfig, type IFlagshipConfig, BucketingConfig, DecisionApiConfig } from '../config/index'
import { ConfigManager, IConfigManager } from '../config/ConfigManager'
import { ApiManager } from '../decision/ApiManager'
import { TrackingManager } from '../api/TrackingManager'
import { FlagshipLogManager } from '../utils/FlagshipLogManager'
import { isBrowser, logDebugSprintf, logError, logInfo, logInfoSprintf, logWarning, sprintf, uuidV4 } from '../utils/utils'
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
  CONSENT_NOT_SPECIFY_WARNING,
  LogLevel
} from '../enum/index'
import { VisitorDelegate } from '../visitor/VisitorDelegate'

import { BucketingManager } from '../decision/BucketingManager'
import { MurmurHash } from '../utils/MurmurHash'
import { DecisionManager } from '../decision/DecisionManager'
import { HttpClient } from '../utils/HttpClient'
import { NewVisitor, SdkMethod, TroubleshootingLabel } from '../types'
import { DefaultHitCache } from '../cache/DefaultHitCache'
import { DefaultVisitorCache } from '../cache/DefaultVisitorCache'
import { EdgeManager } from '../decision/EdgeManager'
import { EdgeConfig } from '../config/EdgeConfig'
import { VisitorAbstract } from '../visitor/VisitorAbstract'
import { launchQaAssistant } from '../qaAssistant/index'
import { Troubleshooting } from 'src/hit/Troubleshooting'
import { UsageHit } from 'src/hit/UsageHit'

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
  private _troubleshootingStartSdkHit!: Troubleshooting
  private _usageStartSdkHit!: UsageHit

  private set configManager (value: IConfigManager) {
    this._configManager = value
  }

  private get configManager (): IConfigManager {
    return this._configManager
  }

  private constructor () {
    this.instanceId = uuidV4()
    this._status = FSSdkStatus.SDK_NOT_INITIALIZED
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

  private buildDecisionManager (flagship: Flagship, config: FlagshipConfig, httpClient: HttpClient): DecisionManager {
    let decisionManager: DecisionManager
    const setStatus = (status: FSSdkStatus) => {
      flagship.setStatus(status)
    }

    switch (config.decisionMode) {
      case DecisionMode.BUCKETING:
        decisionManager = new BucketingManager(httpClient, config, new MurmurHash())
        decisionManager.statusChangedCallback(setStatus);
        (decisionManager as BucketingManager).startPolling()
        break
      case DecisionMode.BUCKETING_EDGE:
        decisionManager = new EdgeManager(httpClient, config, new MurmurHash())
        decisionManager.statusChangedCallback(setStatus)
        break
      default:
        decisionManager = new ApiManager(
          httpClient,
          config
        )
        decisionManager.statusChangedCallback(setStatus)
        break
    }

    return decisionManager
  }

  private sendVisitorJourneyHitStart (flagship: Flagship) {
    const config = flagship.getConfig()
    const hitCacheImplementation = config.hitCacheImplementation
    const visitorCacheImplementation = config.visitorCacheImplementation
    const sdkConfigUsingCustomHitCache = hitCacheImplementation && !(hitCacheImplementation instanceof DefaultHitCache)
    const sdkConfigUsingCustomVisitorCache = visitorCacheImplementation && !(visitorCacheImplementation instanceof DefaultVisitorCache)

    const troubleshooting = new Troubleshooting({
      label: TroubleshootingLabel.VISITOR_JOURNEY,
      sdkMethod: SdkMethod.FS_START,
      config: flagship.getConfig(),
      logLevel: LogLevel.INFO,
      visitorId: this.instanceId,
      traffic: 0,
      flagshipInstanceId: this.instanceId,
      visitorSessionId: this.instanceId,
      sdkConfigLogLevel: config.logLevel,
      sdkConfigMode: config.decisionMode,
      sdkConfigTimeout: config.timeout,
      sdkConfigPollingInterval: config.pollingInterval,
      sdkConfigTrackingManagerStrategy: config.trackingManagerConfig?.cacheStrategy,
      sdkConfigTrackingManagerBatchIntervals: config.trackingManagerConfig?.batchIntervals,
      sdkConfigTrackingManagerPoolMaxSize: config.trackingManagerConfig?.poolMaxSize,
      sdkConfigFetchNow: config.fetchNow,
      sdkConfigReuseVisitorIds: config.reuseVisitorIds,
      sdkConfigInitialBucketing: config.initialBucketing,
      sdkConfigDecisionApiUrl: config.decisionApiUrl,
      sdkConfigHitDeduplicationTime: config.hitDeduplicationTime,
      sdkConfigUsingOnVisitorExposed: !!config.onVisitorExposed,
      sdkConfigUsingCustomHitCache: !!sdkConfigUsingCustomHitCache,
      sdkConfigUsingCustomVisitorCache: !!sdkConfigUsingCustomVisitorCache,
      sdkConfigFetchThirdPartyData: config.fetchThirdPartyData,
      sdkConfigFetchFlagsBufferingTime: config.fetchFlagsBufferingTime,
      sdkConfigDisableDeveloperUsageTracking: config.disableDeveloperUsageTracking,
      sdkConfigNextFetchConfig: config.nextFetchConfig,
      sdkConfigDisableCache: config.disableCache
    })
    this._troubleshootingStartSdkHit = troubleshooting

    const usage = new UsageHit({
      label: TroubleshootingLabel.VISITOR_JOURNEY,
      sdkMethod: SdkMethod.FS_START,
      config: flagship.getConfig(),
      logLevel: LogLevel.INFO,
      visitorId: this.instanceId,
      flagshipInstanceId: this.instanceId,
      sdkConfigLogLevel: config.logLevel,
      sdkConfigMode: config.decisionMode,
      sdkConfigTimeout: config.timeout,
      sdkConfigPollingInterval: config.pollingInterval,
      sdkConfigTrackingManagerStrategy: config.trackingManagerConfig?.cacheStrategy,
      sdkConfigTrackingManagerBatchIntervals: config.trackingManagerConfig?.batchIntervals,
      sdkConfigTrackingManagerPoolMaxSize: config.trackingManagerConfig?.poolMaxSize,
      sdkConfigFetchNow: config.fetchNow,
      sdkConfigReuseVisitorIds: config.reuseVisitorIds,
      sdkConfigInitialBucketing: config.initialBucketing,
      sdkConfigDecisionApiUrl: config.decisionApiUrl,
      sdkConfigHitDeduplicationTime: config.hitDeduplicationTime,
      sdkConfigUsingOnVisitorExposed: !!config.onVisitorExposed,
      sdkConfigUsingCustomHitCache: !!sdkConfigUsingCustomHitCache,
      sdkConfigUsingCustomVisitorCache: !!sdkConfigUsingCustomVisitorCache,
      sdkConfigFetchThirdPartyData: config.fetchThirdPartyData,
      sdkConfigFetchFlagsBufferingTime: config.fetchFlagsBufferingTime,
      sdkConfigDisableDeveloperUsageTracking: config.disableDeveloperUsageTracking,
      sdkConfigNextFetchConfig: config.nextFetchConfig,
      sdkConfigDisableCache: config.disableCache
    })

    this._usageStartSdkHit = usage
  }

  /**
   * Start the flagship SDK, with a custom configuration implementation
   * @param {string} envId : Environment id provided by Flagship.
   * @param {string} apiKey : Secure api key provided by Flagship.
   * @param {IFlagshipConfig} config : (optional) SDK configuration.
   */
  public static start (
    envId: string,
    apiKey: string,
    config?: IDecisionApiConfig| IBucketingConfig |IEdgeConfig
  ): Flagship {
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

    const httpClient = new HttpClient()

    const decisionManager = flagship.configManager?.decisionManager

    if (decisionManager instanceof BucketingManager && localConfig.decisionMode !== DecisionMode.BUCKETING_EDGE) {
      decisionManager.stopPolling()
    }

    let trackingManager = flagship.configManager?.trackingManager

    if (!trackingManager) {
      trackingManager = new TrackingManager(httpClient, localConfig, flagship.instanceId)
    }

    flagship.configManager = new ConfigManager(
      localConfig,
      decisionManager,
      trackingManager
    )

    flagship.configManager.decisionManager = flagship.buildDecisionManager(flagship, localConfig as FlagshipConfig, httpClient)

    flagship.configManager.decisionManager.trackingManager = trackingManager
    flagship.configManager.decisionManager.flagshipInstanceId = flagship.instanceId

    if (flagship._status !== FSSdkStatus.SDK_INITIALIZING) {
      flagship.setStatus(FSSdkStatus.SDK_INITIALIZED)
    }

    logInfo(
      localConfig,
      sprintf(SDK_STARTED_INFO, SDK_INFO.version, FSSdkStatus[flagship._status]),
      PROCESS_INITIALIZATION
    )

    launchQaAssistant(localConfig)

    flagship.lastInitializationTimestamp = new Date().toISOString()

    flagship.sendVisitorJourneyHitStart(flagship)

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

  /**
   * Creates a new Visitor instance.
   *
   * @param params - The parameters for creating the new Visitor.
   * @returns A new Visitor instance.
   */
  public static newVisitor ({ visitorId, context, isAuthenticated, hasConsented, initialCampaigns, initialFlagsData, shouldSaveInstance, onFetchFlagsStatusChanged }: NewVisitor) {
    const saveInstance = shouldSaveInstance ?? isBrowser()

    if (!this._instance?.configManager) {
      const flagship = this.getInstance()
      const config = new DecisionApiConfig()
      config.logManager = new FlagshipLogManager()
      flagship._config = config
      const httpClient = new HttpClient()
      const trackingManager = new TrackingManager(httpClient, config)
      const decisionManager = new ApiManager(
        httpClient,
        config
      )
      flagship.configManager = new ConfigManager(
        config,
        decisionManager,
        trackingManager
      )
      logError(this.getConfig(), NEW_VISITOR_NOT_READY, PROCESS_NEW_VISITOR)
    }

    if (hasConsented === undefined) {
      logWarning(this.getConfig(), CONSENT_NOT_SPECIFY_WARNING, PROCESS_NEW_VISITOR)
    }

    const instance = this.getInstance()

    const visitorDelegate = new VisitorDelegate({
      visitorId,
      context: context || {},
      isAuthenticated: isAuthenticated ?? false,
      hasConsented: hasConsented ?? false,
      configManager: instance.configManager,
      initialCampaigns,
      initialFlagsData,
      onFetchFlagsStatusChanged,
      sdkInitialData: {
        instanceId: instance.instanceId,
        lastInitializationTimestamp: instance.lastInitializationTimestamp,
        initialCampaigns,
        initialFlagsData,
        troubleshootingStartSdkHit: instance._troubleshootingStartSdkHit,
        usageStartSdkHit: instance._usageStartSdkHit
      }
    })

    const visitor = new Visitor(visitorDelegate)

    this.getInstance()._visitorInstance = saveInstance ? visitor : undefined
    if (saveInstance) {
      logDebugSprintf(this.getConfig(), PROCESS_NEW_VISITOR, SAVE_VISITOR_INSTANCE, visitor.visitorId)
    }

    if (this.getConfig().fetchNow && this.getConfig().decisionMode !== DecisionMode.BUCKETING_EDGE) {
      visitor.fetchFlags()
    }

    return visitor
  }
}
