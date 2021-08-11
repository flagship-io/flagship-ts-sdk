import { Visitor } from '../visitor/Visitor.ts'
import { FlagshipStatus } from '../enum/FlagshipStatus.ts'
import { DecisionMode, FlagshipConfig, IFlagshipConfig } from '../config/FlagshipConfig.ts'
import { DecisionApiConfig } from '../config/DecisionApiConfig.ts'
import { ConfigManager, IConfigManager } from '../config/ConfigManager.ts'
import { ApiManager } from '../decision/ApiManager.ts'
import { TrackingManager } from '../api/TrackingManager.ts'
import { HttpClient } from '../utils/DenoHttpClient.ts'
import { FlagshipLogManager } from '../utils/FlagshipLogManager.ts'
import { logError, logInfo, sprintf } from '../utils/utils.ts'
import {
  INITIALIZATION_PARAM_ERROR,
  PROCESS_INITIALIZATION,
  SDK_STARTED_INFO,
  SDK_VERSION
} from '../enum/index.ts'
import { VisitorDelegate } from '../visitor/VisitorDelegate.ts'
import { BucketingConfig } from '../config/index.ts'
import { BucketingManager } from '../decision/BucketingManager.ts'
import { MurmurHash } from '../utils/MurmurHash.ts'
import { primitive } from '../types.ts'

export interface INewVisitor{
  /**
   * Unique visitor identifier.
   */
  visitorId?:string
  isAuthenticated?: boolean
  /**
   * visitor context
   */
  context?: Record<string, primitive>
}

export class Flagship {
  private static _instance: Flagship;
  private _configManger!: IConfigManager;
  private _config!: IFlagshipConfig;
  private _status!: FlagshipStatus;

  get config (): IFlagshipConfig {
    return this._config
  }

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

  /**
   * Return true if the SDK is properly initialized, otherwise return false
   */
  private static isReady (): boolean {
    const apiKey = this._instance?.config?.apiKey
    const envId = this._instance?.config?.envId
    return (!!this._instance && !!apiKey && !!envId)
  }

  protected setStatus (status: FlagshipStatus): void {
    const statusChanged = this.config.statusChangedCallback
    if (this.config && statusChanged && this._status !== status) {
      statusChanged(status)
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
   * Return the current config set by the customer and used by the SDK.
   */
  public static getConfig (): IFlagshipConfig {
    return this.getInstance()._config
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
    config?: IFlagshipConfig| FlagshipConfig
  ): void {
    const flagship = this.getInstance()

    if (!(config instanceof FlagshipConfig)) {
      if (config?.decisionMode === DecisionMode.BUCKETING) {
        config = new BucketingConfig(config)
      } else {
        config = new DecisionApiConfig(config)
      }
    }

    config.envId = envId
    config.apiKey = apiKey

    flagship._config = config

    flagship.setStatus(FlagshipStatus.NOT_INITIALIZED)

    // check custom logger
    if (!config.logManager) {
      config.logManager = new FlagshipLogManager()
    }

    if (!envId || envId === '' || !apiKey || apiKey === '') {
      logError(config, INITIALIZATION_PARAM_ERROR, PROCESS_INITIALIZATION)
      return
    }

    let decisionManager = flagship.configManager?.decisionManager

    if (typeof decisionManager === 'object' && decisionManager instanceof BucketingManager) {
      decisionManager.stopPolling()
    }

    const httpClient = new HttpClient()

    if (config.decisionMode === DecisionMode.BUCKETING) {
      decisionManager = new BucketingManager(httpClient, config, new MurmurHash())
      const bucketingManager = decisionManager as BucketingManager
      bucketingManager.startPolling()
    } else {
      decisionManager = new ApiManager(
        httpClient,
        config
      )
    }

    const trackingManager = new TrackingManager(httpClient, config)

    if (flagship.configManager) {
      flagship.configManager.config = config
      flagship.configManager.decisionManager = decisionManager
      flagship.configManager.trackingManager = trackingManager
    } else {
      flagship.configManager = new ConfigManager(
        config,
        decisionManager,
        trackingManager
      )
    }

    if (this.isReady()) {
      flagship.setStatus(FlagshipStatus.READY)
      logInfo(
        config,
        sprintf(SDK_STARTED_INFO, SDK_VERSION),
        PROCESS_INITIALIZATION
      )
    }
  }

  /**
   * Create a new visitor with a context.
   * @param {INewVisitor} params
   * @returns {Visitor} a new visitor instance
   */

  public static newVisitor (params:INewVisitor): Visitor | null

  /**
   * Create a new visitor with a context.
   * @param {string} visitorId : Unique visitor identifier.
   * @param {Record<string, primitive>} context : visitor context. e.g: { isVip: true, country: "UK" }.
   * @returns {Visitor} a new visitor instance
   */
  public static newVisitor (visitorId: string|null, context?: Record<string, primitive>): Visitor | null

  public static newVisitor (params:string|INewVisitor|null, params2?:Record<string, primitive>): Visitor | null {
    if (!this.isReady()) {
      return null
    }

    let visitorId:string|null
    let context:Record<string, primitive>
    let isAuthenticated = false

    if (typeof params === 'string' || params === null) {
      visitorId = params
      context = params2 || {}
    } else {
      visitorId = params.visitorId || null
      context = params.context || {}
      isAuthenticated = params.isAuthenticated ?? false
    }

    const visitorDelegate = new VisitorDelegate({
      visitorId,
      context,
      isAuthenticated,
      configManager: this.getInstance().configManager
    })

    const visitor = new Visitor(visitorDelegate)

    if (this.getConfig().fetchNow) {
      visitor.synchronizeModifications()
    }
    return visitor
  }
}
