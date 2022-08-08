import { Visitor } from '../visitor/Visitor'
import { FlagshipStatus } from '../enum/FlagshipStatus'
import { DecisionMode, FlagshipConfig, IFlagshipConfig } from '../config/FlagshipConfig'
import { DecisionApiConfig } from '../config/DecisionApiConfig'
import { ConfigManager, IConfigManager } from '../config/ConfigManager'
import { ApiManager } from '../decision/ApiManager'
import { TrackingManager } from '../api/TrackingManager'
import { FlagshipLogManager } from '../utils/FlagshipLogManager'
import { isBrowser, logError, logInfo, sprintf } from '../utils/utils'
import {
  BatchStrategy,
  INITIALIZATION_PARAM_ERROR,
  LogLevel,
  NEW_VISITOR_NOT_READY,
  PROCESS_INITIALIZATION,
  PROCESS_NEW_VISITOR,
  SDK_STARTED_INFO
} from '../enum/index'
import { VisitorDelegate } from '../visitor/VisitorDelegate'
import { BucketingConfig } from '../config/index'
import { BucketingManager } from '../decision/BucketingManager'
import { MurmurHash } from '../utils/MurmurHash'
import { DecisionManager } from '../decision/DecisionManager'
import { HttpClient } from '../utils/HttpClient'
import { FlagDTO, NewVisitor, primitive } from '../types'
import { CampaignDTO } from '../decision/api/models'
import { DefaultHitCache } from '../cache/DefaultHitCache'
import { DefaultVisitorCache } from '../cache/DefaultVisitorCache'
import { Monitoring } from '../hit/Monitoring'
import { version as packageVersion } from '../sdkVersion'

export class Flagship {
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
    const statusChanged = this.getConfig().statusChangedCallback

    if (this._status !== status) {
      if (!this.getConfig().isCloudFlareClient) {
        if (status === FlagshipStatus.READY) {
          this.configManager?.trackingManager?.startBatchingLoop()
        } else {
          this.configManager?.trackingManager?.stopBatchingLoop()
        }
      }

      if (this.getConfig() && statusChanged) {
        this._status = status
        statusChanged(status)
        return
      }
    }

    this._status = status
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
    if (config.decisionMode === DecisionMode.BUCKETING || config.isCloudFlareClient) {
      decisionManager = new BucketingManager(httpClient, config, new MurmurHash())
      const bucketingManager = decisionManager as BucketingManager
      decisionManager.statusChangedCallback(setStatus)
      if (!config.isCloudFlareClient) {
        bucketingManager.startPolling()
      }
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
  ): Flagship | null {
    const flagship = this.getInstance()

    config = flagship.buildConfig(config)

    const configCheck = {
      useCustomLogManager: !!config.logManager,
      useCustomCacheManager: !!config.hitCacheImplementation || !!config.visitorCacheImplementation
    }

    config.envId = envId
    config.apiKey = apiKey

    flagship._config = config

    flagship.setStatus(FlagshipStatus.STARTING)

    // check custom logger
    if (!config.logManager) {
      config.logManager = new FlagshipLogManager(config.isCloudFlareClient)
    }

    if (!envId || !apiKey) {
      flagship.setStatus(FlagshipStatus.NOT_INITIALIZED)
      logError(config, INITIALIZATION_PARAM_ERROR, PROCESS_INITIALIZATION)
      return flagship
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!config.hitCacheImplementation && isBrowser()) {
      configCheck.useCustomLogManager = false
      config.hitCacheImplementation = new DefaultHitCache()
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!config.visitorCacheImplementation && isBrowser()) {
      config.visitorCacheImplementation = new DefaultVisitorCache()
    }

    let decisionManager = flagship.configManager?.decisionManager

    if (typeof decisionManager === 'object' && decisionManager instanceof BucketingManager && !config.isCloudFlareClient) {
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
      sprintf(SDK_STARTED_INFO, packageVersion),
      PROCESS_INITIALIZATION
    )

    const initMonitoring = new Monitoring({
      action: 'SDK-INITIALIZATION',
      subComponent: 'Flagship.start',
      logLevel: LogLevel.INFO,
      message: 'Flagship initialized',
      sdkConfigCustomCacheManager: configCheck.useCustomCacheManager,
      sdkConfigCustomLogManager: configCheck.useCustomLogManager,
      sdkConfigMode: config.decisionMode,
      sdkConfigPollingTime: config.pollingInterval?.toString(),
      sdkConfigStatusListener: !!config.statusChangedCallback,
      sdkConfigTimeout: config.timeout?.toString(),
      sdkStatus: FlagshipStatus[flagship.getStatus()],
      sdkConfigTrackingManagerConfigBatchIntervals: config.trackingMangerConfig?.batchIntervals?.toString(),
      sdkConfigTrackingManagerConfigBatchLength: config.trackingMangerConfig?.batchLength?.toString(),
      sdkConfigTrackingManagerConfigStrategy: BatchStrategy[config.trackingMangerConfig?.batchStrategy as BatchStrategy],
      visitorId: '0',
      anonymousId: '',
      config
    })

    trackingManager.addHit(initMonitoring)
    return flagship
  }

  /**
   * Create a new visitor with a context.
   * @param {string} visitorId : Unique visitor identifier.
   * @param {Record<string, primitive>} context : visitor context. e.g: { isVip: true, country: "UK" }.
   * @returns {Visitor} a new visitor instance
   */
  public newVisitor(visitorId?: string | null, context?: Record<string, primitive>): Visitor | null
  public newVisitor(params?: NewVisitor): Visitor | null
  public newVisitor (param1?: NewVisitor | string | null, param2?: Record<string, primitive>): Visitor | null {
    return Flagship.newVisitor(param1, param2)
  }

  /**
   * Create a new visitor with a context.
   * @param {string} visitorId : Unique visitor identifier.
   * @param {Record<string, primitive>} context : visitor context. e.g: { isVip: true, country: "UK" }.
   * @returns {Visitor} a new visitor instance
   */
  public static newVisitor(visitorId?: string | null, context?: Record<string, primitive>): Visitor | null
  /**
   * Create a new visitor with a context.
   * @param {string} visitorId : Unique visitor identifier.
   * @param {Record<string, primitive>} context : visitor context. e.g: { isVip: true, country: "UK" }.
   * @returns {Visitor} a new visitor instance
   */
  public static newVisitor(params?: NewVisitor): Visitor | null
  public static newVisitor(param1?: NewVisitor | string | null, param2?: Record<string, primitive>): Visitor | null
  public static newVisitor (param1?: NewVisitor | string | null, param2?: Record<string, primitive>): Visitor | null {
    let visitorId: string | undefined
    let context: Record<string, primitive>
    let isAuthenticated = false
    let hasConsented = true
    let initialModifications: Map<string, FlagDTO> | FlagDTO[] | undefined
    let initialCampaigns: CampaignDTO[] | undefined
    const isServerSide = !isBrowser()
    let isNewInstance = isServerSide

    if (!this._instance?.configManager) {
      logError(this.getConfig(), NEW_VISITOR_NOT_READY, PROCESS_NEW_VISITOR)
      return null
    }

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

    const visitorDelegate = new VisitorDelegate({
      visitorId,
      context,
      isAuthenticated,
      hasConsented,
      configManager: this.getInstance().configManager,
      initialModifications: initialModifications,
      initialCampaigns: initialCampaigns,
      initialFlagsData: initialModifications
    })

    const visitor = new Visitor(visitorDelegate)

    this.getInstance()._visitorInstance = !isNewInstance ? visitor : undefined

    if (this.getConfig().fetchNow && !this.getConfig().isCloudFlareClient) {
      visitor.fetchFlags()
    }
    return visitor
  }
}
