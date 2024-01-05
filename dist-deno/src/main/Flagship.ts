import { IBucketingConfig } from '../config/IBucketingConfig.ts'
import { IDecisionApiConfig } from '../config/IDecisionApiConfig.ts'
import { IEdgeConfig } from '../config/IEdgeConfig.ts'
import { Visitor } from '../visitor/Visitor.ts'
import { FlagshipStatus } from '../enum/FlagshipStatus.ts'
import { DecisionMode, FlagshipConfig, type IFlagshipConfig, BucketingConfig, DecisionApiConfig } from '../config/index.ts'
import { ConfigManager, IConfigManager } from '../config/ConfigManager.ts'
import { ApiManager } from '../decision/ApiManager.ts'
import { TrackingManager } from '../api/TrackingManager.ts'
import { FlagshipLogManager } from '../utils/FlagshipLogManager.ts'
import { isBrowser, logDebugSprintf, logError, logInfo, logInfoSprintf, sprintf, uuidV4 } from '../utils/utils.ts'
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
  SAVE_VISITOR_INSTANCE
} from '../enum/index.ts'
import { VisitorDelegate } from '../visitor/VisitorDelegate.ts'

import { BucketingManager } from '../decision/BucketingManager.ts'
import { MurmurHash } from '../utils/MurmurHash.ts'
import { DecisionManager } from '../decision/DecisionManager.ts'
import { HttpClient } from '../utils/HttpClient.ts'
import { CampaignDTO, FlagDTO, NewVisitor, primitive } from '../types.ts'
import { DefaultHitCache } from '../cache/DefaultHitCache.ts'
import { DefaultVisitorCache } from '../cache/DefaultVisitorCache.ts'
import { EdgeManager } from '../decision/EdgeManager.ts'
import { EdgeConfig } from '../config/EdgeConfig.ts'
import { VisitorAbstract } from '../visitor/VisitorAbstract.ts'
import { launchQaAssistant } from '../qaAssistant.ts'

export class Flagship {
  // eslint-disable-next-line no-use-before-define
  private static _instance: Flagship
  private _configManager!: IConfigManager
  private _config!: IFlagshipConfig
  private _status!: FlagshipStatus
  private _visitorInstance?: Visitor
  private instanceId:string
  private lastInitializationTimestamp!: string

  private set configManager (value: IConfigManager) {
    this._configManager = value
  }

  private get configManager (): IConfigManager {
    return this._configManager
  }

  // eslint-disable-next-line no-useless-constructor
  private constructor () {
    this.instanceId = uuidV4()
    // singleton
  }

  protected static getInstance (): Flagship {
    if (!this._instance) {
      this._instance = new this()
    }
    return this._instance
  }

  protected setStatus (status: FlagshipStatus): void {
    if (this._status === status) {
      return
    }

    this._status = status
    VisitorAbstract.SdkStatus = status

    const statusChanged = this.getConfig()?.statusChangedCallback

    logInfoSprintf(this._config, PROCESS_SDK_STATUS, SDK_STATUS_CHANGED, FlagshipStatus[status])

    if (this.getConfig().decisionMode !== DecisionMode.BUCKETING_EDGE) {
      if (status === FlagshipStatus.READY) {
        this.configManager?.trackingManager?.startBatchingLoop()
      }
      if (status === FlagshipStatus.NOT_INITIALIZED) {
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
  public static getStatus (): FlagshipStatus {
    return this.getInstance()._status
  }

  /**
   * Return current status of Flagship SDK.
   */
  public getStatus (): FlagshipStatus {
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
    const setStatus = (status: FlagshipStatus) => {
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

    flagship.setStatus(FlagshipStatus.STARTING)

    // check custom logger
    if (!localConfig.onLog && !localConfig.logManager) {
      localConfig.logManager = new FlagshipLogManager()
    }

    if (!envId || !apiKey) {
      flagship.setStatus(FlagshipStatus.NOT_INITIALIZED)
      logError(localConfig, INITIALIZATION_PARAM_ERROR, PROCESS_INITIALIZATION)
      return flagship
    }

    logDebugSprintf(localConfig, PROCESS_INITIALIZATION, INITIALIZATION_STARTING, SDK_INFO.version, localConfig.decisionMode, localConfig)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!localConfig.hitCacheImplementation && isBrowser()) {
      localConfig.hitCacheImplementation = new DefaultHitCache()
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    if (flagship._status === FlagshipStatus.STARTING) {
      flagship.setStatus(FlagshipStatus.READY)
    }

    logInfo(
      localConfig,
      sprintf(SDK_STARTED_INFO, SDK_INFO.version, FlagshipStatus[flagship._status]),
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
   * Create a new visitor with a context.
   * @param {string} visitorId : Unique visitor identifier.
   * @param {Record<string, primitive>} context : visitor context. e.g: { isVip: true, country: "UK" }.
   * @returns {Visitor} a new visitor instance
   */
  public newVisitor(visitorId?: string | null, context?: Record<string, primitive>): Visitor
  public newVisitor(params?: NewVisitor): Visitor
  public newVisitor (param1?: NewVisitor | string | null, param2?: Record<string, primitive>): Visitor {
    return Flagship.newVisitor(param1, param2)
  }

  /**
   * Create a new visitor with a context.
   * @param {string} visitorId : Unique visitor identifier.
   * @param {Record<string, primitive>} context : visitor context. e.g: { isVip: true, country: "UK" }.
   * @returns {Visitor} a new visitor instance
   */
  public static newVisitor(visitorId?: string | null, context?: Record<string, primitive>): Visitor
  /**
   * Create a new visitor with a context.
   * @param {string} visitorId : Unique visitor identifier.
   * @param {Record<string, primitive>} context : visitor context. e.g: { isVip: true, country: "UK" }.
   * @returns {Visitor} a new visitor instance
   */
  public static newVisitor(params?: NewVisitor): Visitor
  public static newVisitor(param1?: NewVisitor | string | null, param2?: Record<string, primitive>): Visitor
  // eslint-disable-next-line complexity
  public static newVisitor (param1?: NewVisitor | string | null, param2?: Record<string, primitive>): Visitor {
    let visitorId: string | undefined
    let context: Record<string, primitive>
    let isAuthenticated = false
    let hasConsented = true
    let initialFlagsData: Map<string, FlagDTO> | FlagDTO[] | undefined
    let initialCampaigns: CampaignDTO[] | undefined
    const isServerSide = !isBrowser()
    let isNewInstance = isServerSide

    if (typeof param1 === 'string' || param1 === null) {
      visitorId = param1 || undefined
      context = param2 || {}
    } else {
      visitorId = param1?.visitorId
      context = param1?.context || {}
      isAuthenticated = !!param1?.isAuthenticated
      hasConsented = param1?.hasConsented ?? true
      initialFlagsData = param1?.initialFlagsData || param1?.initialModifications
      initialCampaigns = param1?.initialCampaigns
      isNewInstance = param1?.isNewInstance ?? isNewInstance
    }

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

    const visitorDelegate = new VisitorDelegate({
      visitorId,
      context,
      isAuthenticated,
      hasConsented,
      configManager: this.getInstance().configManager,
      initialModifications: initialFlagsData,
      initialCampaigns,
      initialFlagsData,
      monitoringData: {
        instanceId: this.getInstance().instanceId,
        lastInitializationTimestamp: this.getInstance().lastInitializationTimestamp,
        initialCampaigns,
        initialFlagsData
      }
    })

    const visitor = new Visitor(visitorDelegate)

    this.getInstance()._visitorInstance = !isNewInstance ? visitor : undefined
    if (!isNewInstance) {
      logDebugSprintf(this.getConfig(), PROCESS_NEW_VISITOR, SAVE_VISITOR_INSTANCE, visitor.visitorId)
    }

    if (this.getConfig().fetchNow && this.getConfig().decisionMode !== DecisionMode.BUCKETING_EDGE) {
      visitor.fetchFlags()
    }

    return visitor
  }
}
