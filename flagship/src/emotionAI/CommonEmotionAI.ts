import { IHttpClient, IHttpResponse } from '../utils/HttpClient'
import { IEmotionAI } from './IEmotionAI'
import { EAIConfig } from '../type.local'
import { logDebugSprintf, logErrorSprintf, sprintf } from '../utils/utils'
import { EAI_SCORE_CONTEXT_KEY, EMOTION_AI_EVENT_URL, EMOTION_AI_UC_URL, FETCH_EAI_SCORE, FETCH_EAI_SCORE_ERROR, FETCH_EAI_SCORE_SUCCESS, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, MAX_COLLECTING_TIME_MS, MAX_LAST_COLLECTING_TIME_MS, MAX_SCORING_POLLING_TIME, SCORING_INTERVAL, SEND_EAI_EVENT, SEND_EAI_EVENT_ERROR, SEND_EAI_EVENT_SUCCESS } from '../enum/FlagshipConstant'
import { IVisitorEvent } from './hit/IVisitorEvent'
import { IPageView } from './hit/IPageView'
import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { EAIScore, TroubleshootingLabel } from '../types'
import { VisitorAbstract } from '../visitor/VisitorAbstract'
import { VisitorEvent } from './hit/VisitorEvent'
import { Troubleshooting } from '../hit/Troubleshooting'
import { LogLevel } from '../enum/index'
import { UsageHit } from '../hit/UsageHit'

type ConstructorParam = {
  httpClient: IHttpClient;
  sdkConfig: IFlagshipConfig;
  eAIConfig: EAIConfig|undefined;
}

export abstract class CommonEmotionAI implements IEmotionAI {
  protected _EAIScore?: EAIScore
  protected _EAIScoreChecked: boolean
  protected _httpClient: IHttpClient
  protected _sdkConfig: IFlagshipConfig
  protected _eAIConfig?: EAIConfig
  protected _isEAIDataCollecting: boolean
  protected _fetchEAIScorePromise?: Promise<IHttpResponse>
  protected _startScoringTimestamp!: number
  protected _scoringIntervalId?: NodeJS.Timeout
  protected _onEAICollectStatusChange?: (status: boolean) => void
  protected _visitor!: VisitorAbstract
  /**
   * Indicates whether EAI data has been collected
   */
  protected _startCollectingEAIDataTimestamp!: number

  public constructor ({ httpClient, sdkConfig, eAIConfig }: ConstructorParam) {
    this._EAIScoreChecked = false
    this._httpClient = httpClient
    this._sdkConfig = sdkConfig
    this._eAIConfig = eAIConfig
    this._isEAIDataCollecting = false
  }

  public init (visitor: VisitorAbstract): void {
    this._visitor = visitor
  }

  onEAICollectStatusChange (callback: (status: boolean) => void): void {
    this._onEAICollectStatusChange = callback
  }

  public get EAIScore (): EAIScore | undefined {
    return this._EAIScore
  }

  public get EAIScoreChecked (): boolean {
    return this._EAIScoreChecked
  }

  public abstract cleanup (): void ;

  protected setIsEAIDataCollected (isCollected: boolean): Promise<void> {
    return this._visitor.setIsEAIDataCollected(isCollected)
  }

  protected isEAIDataCollected (): Promise<boolean> {
    return this._visitor.isEAIDataCollected()
  }

  protected sendEAIScoreTroubleshooting (eAIScore?: EAIScore, endpoint?:string): void {
    const troubleshooting = new Troubleshooting({
      flagshipInstanceId: this._visitor.sdkInitialData?.instanceId as string,
      visitorId: this._visitor.visitorId,
      label: TroubleshootingLabel.EMOTION_AI_SCORE_FROM_LOCAL_CACHE,
      logLevel: LogLevel.DEBUG,
      eAIScore,
      isEAIScoreFromLocalCache: true,
      config: this._sdkConfig,
      httpRequestUrl: endpoint,
      traffic: this._visitor.traffic
    })
    this._visitor.sendTroubleshooting(troubleshooting)
  }

  protected sendRequestTroubleshooting (response:IHttpResponse,
    label: TroubleshootingLabel,
    endpoint?:string,
    method = 'GET',
    apiKeys?:Record<string, boolean | string | number>,
    eAIScore?:EAIScore): void {
    const troubleshooting = new Troubleshooting({
      flagshipInstanceId: this._visitor.sdkInitialData?.instanceId as string,
      visitorId: this._visitor.visitorId,
      label,
      logLevel: LogLevel.DEBUG,
      hitContent: apiKeys,
      eAIScore,
      httpResponseBody: response.body,
      httpRequestMethod: method,
      httpRequestUrl: endpoint,
      httpResponseCode: response.status,
      httpResponseHeaders: response.headers,
      traffic: this._visitor.traffic,
      config: this._sdkConfig
    })
    this._visitor.sendTroubleshooting(troubleshooting)
  }

  protected sendRequestTroubleshootingError (error: any,
    label: TroubleshootingLabel,
    endpoint?:string,
    apiKeys?:Record<string, boolean | string | number>): void {
    const troubleshooting = new Troubleshooting({
      flagshipInstanceId: this._visitor.sdkInitialData?.instanceId as string,
      visitorId: this._visitor.visitorId,
      label,
      logLevel: LogLevel.ERROR,
      httpRequestMethod: 'GET',
      httpRequestUrl: endpoint,
      hitContent: apiKeys,
      traffic: this._visitor.traffic,
      httpResponseBody: error?.message,
      httpResponseHeaders: error?.headers,
      httpResponseCode: error?.statusCode,
      config: this._sdkConfig
    })
    this._visitor.sendTroubleshooting(troubleshooting)
  }

  protected sendCollectingTroubleshooting (timestamp:number, label:TroubleshootingLabel, score?: EAIScore): void {
    const troubleshooting = new Troubleshooting({
      flagshipInstanceId: this._visitor.sdkInitialData?.instanceId as string,
      visitorId: this._visitor.visitorId,
      label,
      logLevel: LogLevel.DEBUG,
      eAIDataTimestamp: new Date(timestamp).toISOString(),
      config: this._sdkConfig,
      eAIScore: score,
      traffic: this._visitor.traffic
    })
    this._visitor.sendTroubleshooting(troubleshooting)
  }

  protected sendCollectingUsageHit (label:TroubleshootingLabel): void {
    const usageHit = new UsageHit({
      visitorId: this._visitor.sdkInitialData?.instanceId as string,
      label,
      config: this._sdkConfig,
      logLevel: LogLevel.DEBUG
    })

    this._visitor.sendUsageHit(usageHit)
  }

  public async fetchEAIScore (noCache = false): Promise<EAIScore|undefined> {
    if (!this._eAIConfig?.eaiActivationEnabled) {
      return undefined
    }
    if (this._EAIScoreChecked) {
      return this._EAIScore
    }

    const cachedEAIScore = await this._visitor.getCachedEAIScore()

    if (cachedEAIScore) {
      this._EAIScore = cachedEAIScore
      this._EAIScoreChecked = true
      this._visitor.updateContext(EAI_SCORE_CONTEXT_KEY, this._EAIScore?.eai?.eas)
      this.sendEAIScoreTroubleshooting(this._EAIScore)
      return this._EAIScore
    }

    if (this._fetchEAIScorePromise) {
      await this._fetchEAIScorePromise
      return this._EAIScore
    }

    const visitorId = this._visitor.visitorId

    const url = sprintf(EMOTION_AI_UC_URL, this._sdkConfig.envId, visitorId)

    const versionQuery = noCache ? `&v=${Date.now()}` : ''

    const endpoint = `${url}?partner=eai${versionQuery}`

    try {
      this._fetchEAIScorePromise = this._httpClient.getAsync(endpoint)

      const response = await this._fetchEAIScorePromise

      this._EAIScore = response.body
      this._EAIScoreChecked = true

      this.sendRequestTroubleshooting(response, TroubleshootingLabel.EMOTION_AI_SCORE, endpoint, 'GET', undefined, this._EAIScore)

      if (this._EAIScore) {
        this._visitor.setCachedEAIScore(this._EAIScore)
        this._visitor.updateContext(EAI_SCORE_CONTEXT_KEY, this._EAIScore?.eai?.eas)
      }

      logDebugSprintf(this._sdkConfig, FETCH_EAI_SCORE, FETCH_EAI_SCORE_SUCCESS, visitorId, this._EAIScore)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logErrorSprintf(
        this._sdkConfig,
        FETCH_EAI_SCORE,
        FETCH_EAI_SCORE_ERROR,
        visitorId,
        error.message
      )
      this.sendRequestTroubleshootingError(error, TroubleshootingLabel.EMOTION_AI_SCORE_ERROR, endpoint)
    } finally {
      this._fetchEAIScorePromise = undefined
    }
    return this._EAIScore
  }

  protected abstract startCollectingEAIData (visitorId: string, currentPage?: Omit<IPageView, 'toApiKeys'>): Promise<void> ;

  protected abstract removeListeners (): void ;

  public async collectEAIEventsAsync (currentPage?: Omit<IPageView, 'toApiKeys'>): Promise<void> {
    if (this._isEAIDataCollecting ||
      !this._eAIConfig?.eaiCollectEnabled) {
      return
    }

    const isEAIDataCollected = await this.isEAIDataCollected()

    if (!this._eAIConfig.eaiActivationEnabled && isEAIDataCollected) {
      return
    }

    const score = await this.fetchEAIScore()
    if (score) {
      return
    }

    const visitorId = this._visitor.visitorId
    await this.startCollectingEAIData(visitorId, currentPage)
  }

  public async reportPageView (pageView:IPageView): Promise<void> {
    if (!this._isEAIDataCollecting) {
      return
    }
    return this.sendEAIEvent(pageView)
  }

  protected async sendEAIEvent (event:IVisitorEvent|IPageView): Promise<void> {
    const apiKeys = event.toApiKeys()
    try {
      const response = await this._httpClient.postAsync(EMOTION_AI_EVENT_URL, {
        body: apiKeys,
        headers: {
          [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
        }
      })

      const label = apiKeys.t === 'PAGEVIEW' ? TroubleshootingLabel.EMOTION_AI_PAGE_VIEW : TroubleshootingLabel.EMOTION_AI_VISITOR_EVENT

      this.sendRequestTroubleshooting(response, label, EMOTION_AI_EVENT_URL, 'POST', event.toApiKeys())

      logDebugSprintf(this._sdkConfig, SEND_EAI_EVENT, SEND_EAI_EVENT_SUCCESS, event.toApiKeys())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      const label = apiKeys.t === 'PAGEVIEW' ? TroubleshootingLabel.EMOTION_AI_PAGE_VIEW_ERROR : TroubleshootingLabel.EMOTION_AI_VISITOR_EVENT_ERROR

      this.sendRequestTroubleshootingError(error,
        label,
        EMOTION_AI_EVENT_URL, apiKeys)
      logErrorSprintf(this._sdkConfig, SEND_EAI_EVENT, SEND_EAI_EVENT_ERROR, error.message)
    }
  }

  protected finalizeDataCollection (isCollected:boolean): void {
    if (this._scoringIntervalId) {
      clearInterval(this._scoringIntervalId)
      this._scoringIntervalId = undefined
    }
    this._isEAIDataCollecting = false
    this.setIsEAIDataCollected(isCollected)
  }

  protected stopCollectingEAIData (): void {
    this.sendCollectingTroubleshooting(Date.now(), TroubleshootingLabel.EMOTION_AI_STOP_COLLECTING)
    this.sendCollectingUsageHit(TroubleshootingLabel.EMOTION_AI_STOP_COLLECTING)

    this.removeListeners()

    if (!this._eAIConfig?.eaiActivationEnabled) {
      this._isEAIDataCollecting = false
      this.setIsEAIDataCollected(true)
      return
    }

    this._startScoringTimestamp = Date.now()

    this.sendCollectingTroubleshooting(this._startScoringTimestamp, TroubleshootingLabel.EMOTION_AI_START_SCORING)

    this._scoringIntervalId = setInterval(async () => {
      const elapsedTime = Date.now() - this._startScoringTimestamp

      if (elapsedTime > MAX_SCORING_POLLING_TIME) {
        this.sendCollectingTroubleshooting(Date.now(), TroubleshootingLabel.EMOTION_AI_SCORING_FAILED)
        this.finalizeDataCollection(false)
        return
      }

      this._EAIScoreChecked = false
      const score = await this.fetchEAIScore(true)

      if (score) {
        this.sendCollectingTroubleshooting(Date.now(),
          TroubleshootingLabel.EMOTION_AI_SCORING_SUCCESS, score)
        this.finalizeDataCollection(true)
      }
    }, SCORING_INTERVAL)
  }

  public async reportVisitorEvent (visitorEvent: VisitorEvent): Promise<void> {
    if (!this._isEAIDataCollecting) {
      return
    }
    const timestampDiff = Date.now() - this._startCollectingEAIDataTimestamp
    if (timestampDiff <= MAX_COLLECTING_TIME_MS) {
      this.sendEAIEvent(visitorEvent)
    } else if ((timestampDiff <= MAX_LAST_COLLECTING_TIME_MS)) {
      this.sendEAIEvent(visitorEvent)
      this.stopCollectingEAIData()
    } else {
      this.removeListeners()
      this._isEAIDataCollecting = false
      this.setIsEAIDataCollected(false)
    }
  }
}
