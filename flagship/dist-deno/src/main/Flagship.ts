import { Visitor } from '../visitor/Visitor.ts'
import { FlagshipStatus } from '../enum/FlagshipStatus.ts'
import { DecisionMode, FlagshipConfig, IFlagshipConfig } from '../config/FlagshipConfig.ts'
import { DecisionApiConfig } from '../config/DecisionApiConfig.ts'
import { ConfigManager, IConfigManager } from '../config/ConfigManager.ts'
import { ApiManager } from '../decision/ApiManager.ts'
import { TrackingManager } from '../api/TrackingManager.ts'
import { FlagshipLogManager } from '../utils/FlagshipLogManager.ts'
import { isBrowser, logDebugSprintf, logError, logInfo, logInfoSprintf, sprintf } from '../utils/utils.ts'
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
import { BucketingConfig } from '../config/index.ts'
import { BucketingManager } from '../decision/BucketingManager.ts'
import { MurmurHash } from '../utils/MurmurHash.ts'
import { DecisionManager } from '../decision/DecisionManager.ts'
import { HttpClient } from '../utils/HttpClient.ts'
import { FlagDTO, NewVisitor, primitive } from '../types.ts'
import { CampaignDTO } from '../decision/api/models.ts'
import { DefaultHitCache } from '../cache/DefaultHitCache.ts'
import { DefaultVisitorCache } from '../cache/DefaultVisitorCache.ts'

export class Flagship {
  // eslint-disable-next-line no-use-before-define
  private static _instance: Flagship
  private _configManger!: IConfigManager
  private _config!: IFlagshipConfig
  private _status!: FlagshipStatus
  private _visitorInstance?: Visitor

  private set configManager (value: IConfigManager) {
    this._configManger = value
  }

  private get configManager (): IConfigManager {
    return this._configManger
  }

  // eslint-disable-next-line no-useless-constructor
  private constructor () {
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
    const statusChanged = this.getConfig().statusChangedCallback

    logInfoSprintf(this._config, PROCESS_SDK_STATUS, SDK_STATUS_CHANGED, FlagshipStatus[status])

    if (status === FlagshipStatus.READY) {
      this.configManager?.trackingManager?.startBatchingLoop()
    } else {
      this.configManager?.trackingManager?.stopBatchingLoop()
    }

    if (this.getConfig() && statusChanged) {
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

  private buildConfig (config?: IFlagshipConfig | FlagshipConfig): FlagshipConfig {
    if (config instanceof FlagshipConfig) {
      return config
    }
    let newConfig: FlagshipConfig
    if (config?.decisionMode === DecisionMode.BUCKETING) {
      newConfig = new BucketingConfig(config)
    } else {
      newConfig = new DecisionApiConfig(config)
    }
    return newConfig
  }

  private buildDecisionManager (flagship: Flagship, config: FlagshipConfig, httpClient: HttpClient): DecisionManager {
    let decisionManager: DecisionManager
    const setStatus = (status: FlagshipStatus) => {
      flagship.setStatus(status)
    }
    if (config.decisionMode === DecisionMode.BUCKETING) {
      decisionManager = new BucketingManager(httpClient, config, new MurmurHash())
      const bucketingManager = decisionManager as BucketingManager
      decisionManager.statusChangedCallback(setStatus)
      bucketingManager.startPolling()
    } else {
      decisionManager = new ApiManager(
        httpClient,
        config
      )
      decisionManager.statusChangedCallback(setStatus)
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
    config?: IFlagshipConfig | FlagshipConfig
  ): Flagship {
    const flagship = this.getInstance()

    config = flagship.buildConfig(config)

    config.envId = envId
    config.apiKey = apiKey

    flagship._config = config

    flagship.setStatus(FlagshipStatus.STARTING)

    // check custom logger
    if (!config.onLog && !config.logManager) {
      config.logManager = new FlagshipLogManager()
    }

    if (!envId || !apiKey) {
      flagship.setStatus(FlagshipStatus.NOT_INITIALIZED)
      logError(config, INITIALIZATION_PARAM_ERROR, PROCESS_INITIALIZATION)
      return flagship
    }

    logDebugSprintf(config, PROCESS_INITIALIZATION, INITIALIZATION_STARTING, SDK_INFO.version, config.decisionMode, config)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!config.hitCacheImplementation && isBrowser()) {
      config.hitCacheImplementation = new DefaultHitCache()
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!config.visitorCacheImplementation && isBrowser()) {
      config.visitorCacheImplementation = new DefaultVisitorCache()
    }

    let decisionManager = flagship.configManager?.decisionManager

    if (decisionManager instanceof BucketingManager) {
      decisionManager.stopPolling()
    }

    const httpClient = new HttpClient()

    decisionManager = flagship.buildDecisionManager(flagship, config as FlagshipConfig, httpClient)

    let trackingManager = flagship.configManager?.trackingManager
    if (!trackingManager) {
      trackingManager = new TrackingManager(httpClient, config)
    }

    flagship.configManager = new ConfigManager(
      config,
      decisionManager,
      trackingManager
    )

    if (flagship._status === FlagshipStatus.STARTING) {
      flagship.setStatus(FlagshipStatus.READY)
    }

    logInfo(
      config,
      sprintf(SDK_STARTED_INFO, SDK_INFO.version),
      PROCESS_INITIALIZATION
    )
    return flagship
  }

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
  public static newVisitor(params?: NewVisitor): Visitor | null
  public static newVisitor(param1?: NewVisitor | string | null, param2?: Record<string, primitive>): Visitor
  public static newVisitor (param1?: NewVisitor | string | null, param2?: Record<string, primitive>): Visitor {
    let visitorId: string | undefined
    let context: Record<string, primitive>
    let isAuthenticated = false
    let hasConsented = true
    let initialModifications: Map<string, FlagDTO> | FlagDTO[] | undefined
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
      initialModifications = param1?.initialFlagsData || param1?.initialModifications
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
      // this.getInstance().configManager = new ConfigManager()
    }

    const visitorDelegate = new VisitorDelegate({
      visitorId,
      context,
      isAuthenticated,
      hasConsented,
      configManager: this.getInstance().configManager,
      initialModifications,
      initialCampaigns,
      initialFlagsData: initialModifications
    })

    const visitor = new Visitor(visitorDelegate)

    this.getInstance()._visitorInstance = !isNewInstance ? visitor : undefined

    if (!isNewInstance) {
      logDebugSprintf(this.getConfig(), PROCESS_NEW_VISITOR, SAVE_VISITOR_INSTANCE, visitor.visitorId)
    }

    if (this.getConfig().fetchNow) {
      visitor.fetchFlags()
    }
    return visitor
  }
}
