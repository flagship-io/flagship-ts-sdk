import { IHttpClient, IHttpResponse } from '../utils/HttpClient'
import { IEmotionAI } from './IEmotionAI'
import { EAIConfig } from '../type.local'
import { logDebugSprintf, logErrorSprintf, sprintf } from '../utils/utils'
import { EMOTION_AI_EVENT_URL, EMOTION_AI_UC_URL, FETCH_EAI_SCORE, FETCH_EAI_SCORE_ERROR, FETCH_EAI_SCORE_SUCCESS, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, MAX_COLLECTING_TIME_MS, MAX_LAST_COLLECTING_TIME_MS, MAX_SCORING_POLLING_TIME, SCORING_INTERVAL, SEND_EAI_EVENT, SEND_EAI_EVENT_ERROR, SEND_EAI_EVENT_SUCCESS } from '../enum/FlagshipConstant'
import { IVisitorEvent } from './hit/IVisitorEvent'
import { IPageView } from './hit/IPageView'
import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { EAIScore } from '../types'
import { VisitorAbstract } from '../visitor/VisitorAbstract'
import { VisitorEvent } from './hit/VisitorEvent'

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

  public async fetchEAIScore (): Promise<EAIScore|undefined> {
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
      return this._EAIScore
    }

    if (this._fetchEAIScorePromise) {
      await this._fetchEAIScorePromise
      return this._EAIScore
    }

    const visitorId = this._visitor.visitorId
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

  protected abstract removeListeners (): void ;

  public async collectEAIData (currentPage?: Omit<IPageView, 'toApiKeys'>): Promise<void> {
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

  protected finalizeDataCollection (isCollected:boolean): void {
    if (this._scoringIntervalId) {
      clearInterval(this._scoringIntervalId)
      this._scoringIntervalId = undefined
    }
    this._isEAIDataCollecting = false
    this.setIsEAIDataCollected(isCollected)
  }

  protected stopCollectingEAIData (): void {
    this.removeListeners()

    this._startScoringTimestamp = Date.now()

    if (!this._eAIConfig?.eaiActivationEnabled) {
      this._isEAIDataCollecting = false
      this.setIsEAIDataCollected(true)
      return
    }

    this._scoringIntervalId = setInterval(async () => {
      const elapsedTime = Date.now() - this._startScoringTimestamp

      if (elapsedTime > MAX_SCORING_POLLING_TIME) {
        this.finalizeDataCollection(false)
        return
      }

      this._EAIScoreChecked = false
      const score = await this.fetchEAIScore()

      if (score) {
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
