import { Visitor } from '../visitor/Visitor'
import { FlagshipStatus } from '../enum/FlagshipStatus'
import { FlagshipConfig, IFlagshipConfig } from '../config/FlagshipConfig'
import { DecisionApiConfig } from '../config/DecisionApiConfig'
import { ConfigManager, IConfigManager } from '../config/ConfigManager'
import { ApiManager } from '../decision/ApiManager'
import { TrackingManager } from '../api/TrackingManager'
import { HttpClient } from '../utils/NodeHttpClient'
import { FlagshipLogManager } from '../utils/FlagshipLogManager'
import { logError, logInfo, sprintf } from '../utils/utils'
import {
  INITIALIZATION_PARAM_ERROR,
  PROCESS_INITIALIZATION,
  SDK_STARTED_INFO,
  SDK_VERSION
} from '../enum/index'

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
    const apiKey = this._instance.config.apiKey
    const envId = this._instance.config.envId
    return (
      this._instance &&
      apiKey !== null &&
      apiKey !== '' &&
      envId != null &&
      envId !== ''
    )
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
      config = new DecisionApiConfig(config)
    }

    config.envId = envId
    config.apiKey = apiKey

    flagship._config = config

    flagship.setStatus(FlagshipStatus.NOT_READY)

    // check custom logger
    if (!config.logManager) {
      config.logManager = new FlagshipLogManager()
    }

    if (!envId || envId === '' || !apiKey || apiKey === '') {
      logError(config, INITIALIZATION_PARAM_ERROR, PROCESS_INITIALIZATION)
      return
    }

    const decisionManager = new ApiManager(
      new HttpClient(),
      flagship.config
    )
    const trackingManager = new TrackingManager(new HttpClient(), config)
    flagship.configManager = new ConfigManager(
      config,
      decisionManager,
      trackingManager
    )

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
   * @param {string} visitorId : Unique visitor identifier.
   * @param {Record<string, string | number | boolean>} context : visitor context. e.g: { isVip: true, country: "UK" }.
   * @returns {Visitor} a new visitor instance
   */
  public static newVisitor (
    visitorId: string|null,
    context: Record<string, string | number | boolean> = {}
  ): Visitor | null {
    if (!this.isReady()) {
      return null
    }

    const visitor = new Visitor(visitorId, context, this.getInstance().configManager)

    if (this.getConfig().fetchNow) {
      visitor.synchronizeModifications()
    }
    return visitor
  }
}
