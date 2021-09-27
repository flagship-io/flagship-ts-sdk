import { Visitor } from '../visitor/Visitor'
import { FlagshipStatus } from '../enum/FlagshipStatus'
import { DecisionMode, FlagshipConfig, IFlagshipConfig } from '../config/FlagshipConfig'
import { DecisionApiConfig } from '../config/DecisionApiConfig'
import { ConfigManager, IConfigManager } from '../config/ConfigManager'
import { ApiManager } from '../decision/ApiManager'
import { TrackingManager } from '../api/TrackingManager'
import { FlagshipLogManager } from '../utils/FlagshipLogManager'
import { logError, logInfo, sprintf } from '../utils/utils'
import {
  INITIALIZATION_PARAM_ERROR,
  PROCESS_INITIALIZATION,
  SDK_STARTED_INFO,
  SDK_VERSION
} from '../enum/index'
import { VisitorDelegate } from '../visitor/VisitorDelegate'
import { BucketingConfig } from '../config/index'
import { BucketingManager } from '../decision/BucketingManager'
import { MurmurHash } from '../utils/MurmurHash'
import { primitive } from '../types'
import { DecisionManager } from '../decision/DecisionManager'
import { HttpClient } from '../utils/HttpClient'
import { CampaignDTO } from '../decision/api/models'
import { Modification } from '../model/Modification'

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
  hasConsented?:boolean,

   initialCampaigns?: CampaignDTO[]
   initialModifications?: Map<string, Modification>

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
      this._status = status
      statusChanged(status)
      return
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

  private buildConfig (config?: IFlagshipConfig| FlagshipConfig):FlagshipConfig {
    if (config instanceof FlagshipConfig) {
      return config
    }
    let newConfig:FlagshipConfig
    if (config?.decisionMode === DecisionMode.BUCKETING) {
      newConfig = new BucketingConfig(config)
    } else {
      newConfig = new DecisionApiConfig(config)
    }
    return newConfig
  }

  private buildDecisionManager (flagship:Flagship, config:FlagshipConfig, httpClient:HttpClient) : DecisionManager {
    let decisionManager:DecisionManager
    const setStatus = (status:FlagshipStatus) => {
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
    config?: IFlagshipConfig| FlagshipConfig
  ): void {
    const flagship = this.getInstance()

    config = flagship.buildConfig(config)

    config.envId = envId
    config.apiKey = apiKey

    flagship._config = config

    flagship.setStatus(FlagshipStatus.STARTING)

    // check custom logger
    if (!config.logManager) {
      config.logManager = new FlagshipLogManager()
    }

    if (!envId || envId === '' || !apiKey || apiKey === '') {
      flagship.setStatus(FlagshipStatus.NOT_INITIALIZED)
      logError(config, INITIALIZATION_PARAM_ERROR, PROCESS_INITIALIZATION)
      return
    }

    let decisionManager = flagship.configManager?.decisionManager

    if (typeof decisionManager === 'object' && decisionManager instanceof BucketingManager) {
      decisionManager.stopPolling()
    }

    const httpClient = new HttpClient()

    decisionManager = flagship.buildDecisionManager(flagship, config as FlagshipConfig, httpClient)

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
      if (flagship._status === FlagshipStatus.STARTING) {
        flagship.setStatus(FlagshipStatus.READY)
      }
      logInfo(
        config,
        sprintf(SDK_STARTED_INFO, SDK_VERSION),
        PROCESS_INITIALIZATION
      )
    } else {
      flagship.setStatus(FlagshipStatus.NOT_INITIALIZED)
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

  public static newVisitor (params:INewVisitor|null): Visitor | null {
    if (!this.isReady()) {
      return null
    }

    const visitorId = params?.visitorId || null
    const context = params?.context || {}
    const isAuthenticated = params?.isAuthenticated ?? false
    const hasConsented = params?.hasConsented ?? false

    const visitorDelegate = new VisitorDelegate({
      visitorId,
      context,
      isAuthenticated,
      hasConsented,
      configManager: this.getInstance().configManager,
      initialModifications: params?.initialModifications,
      initialCampaigns: params?.initialCampaigns
    })

    const visitor = new Visitor(visitorDelegate)

    if (this.getConfig().fetchNow) {
      visitor.synchronizeModifications()
    }
    return visitor
  }
}
