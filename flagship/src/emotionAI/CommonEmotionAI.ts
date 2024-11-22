import { IHttpClient, IHttpResponse } from '../utils/HttpClient'
import { IEmotionAI } from './IEmotionAI'
import { EAIConfig } from '../type.local'
import { logDebugSprintf, logErrorSprintf, sprintf } from '../utils/utils'
import { EMOTION_AI_EVENT_URL, EMOTION_AI_UC_URL, FETCH_EAI_SCORE, FETCH_EAI_SCORE_ERROR, FETCH_EAI_SCORE_SUCCESS, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, SEND_EAI_EVENT, SEND_EAI_EVENT_ERROR, SEND_EAI_EVENT_SUCCESS } from '../enum/FlagshipConstant'
import { IVisitorEvent } from './hit/IVisitorEvent'
import { IPageView } from './hit/IPageView'
import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { EAIScore } from '../types'
import { VisitorAbstract } from '../visitor/VisitorAbstract'

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
  protected _scoringInterval = 5000
  protected _onEAICollectStatusChange?: (status: boolean) => void
  protected _visitor!: VisitorAbstract
  /**
   * Indicates whether EAI data has been collected
   */
  protected _isEAIDataCollected: boolean
  protected _startCollectingEAIDataTimestamp!: number

  public constructor ({ httpClient, sdkConfig, eAIConfig }: ConstructorParam) {
    this._EAIScoreChecked = false
    this._httpClient = httpClient
    this._sdkConfig = sdkConfig
    this._eAIConfig = eAIConfig
    this._isEAIDataCollecting = false
    this._isEAIDataCollected = false
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

  public async fetchEAIScore (): Promise<EAIScore|undefined> {
    const visitorId = this._visitor.visitorId
    if (this._fetchEAIScorePromise) {
      await this._fetchEAIScorePromise
      return this._EAIScore
    }

    if (!this._eAIConfig?.eaiActivationEnabled) {
      return undefined
    }

    if (this._EAIScoreChecked) {
      return this._EAIScore
    }

    const cachedEAIScore = this._visitor.getCachedEAIScore()

    if (cachedEAIScore) {
      this._EAIScore = cachedEAIScore
      this._EAIScoreChecked = true
      return this._EAIScore
    }

    try {
      const url = sprintf(EMOTION_AI_UC_URL, this._sdkConfig.envId, visitorId)
      this._fetchEAIScorePromise = this._httpClient.getAsync(url)
      const response = await this._fetchEAIScorePromise
      this._EAIScore = response.body
      this._EAIScoreChecked = true

      if (this._EAIScore) {
        this._visitor.setCachedEAIScore(this._EAIScore)
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
    } finally {
      this._fetchEAIScorePromise = undefined
    }
    return this._EAIScore
  }

  protected abstract startCollectingEAIData (visitorId: string, currentPage?: Omit<IPageView, 'toApiKeys'>): Promise<void> ;

  public async collectEAIData (currentPage?: Omit<IPageView, 'toApiKeys'>): Promise<void> {
    if (!this._eAIConfig?.eaiActivationEnabled || this._isEAIDataCollecting ||
      !this._eAIConfig?.eaiCollectEnabled || this._isEAIDataCollected) {
      return
    }
    const score = await this.fetchEAIScore()
    if (score) {
      return
    }
    const visitorId = this._visitor.visitorId
    await this.startCollectingEAIData(visitorId, currentPage)
  }

  public abstract reportVisitorEvent (visitorEvent:IVisitorEvent): Promise<void>;

  public reportPageView (pageView:IPageView): Promise<void> {
    return this.sendEAIEvent(pageView)
  }

  protected async sendEAIEvent (event:IVisitorEvent|IPageView): Promise<void> {
    try {
      await this._httpClient.postAsync(EMOTION_AI_EVENT_URL, {
        body: event.toApiKeys(),
        headers: {
          [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
        }
      })
      logDebugSprintf(this._sdkConfig, SEND_EAI_EVENT, SEND_EAI_EVENT_SUCCESS, event.toApiKeys())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logErrorSprintf(this._sdkConfig, SEND_EAI_EVENT, SEND_EAI_EVENT_ERROR, error.message)
    }
  }
}
