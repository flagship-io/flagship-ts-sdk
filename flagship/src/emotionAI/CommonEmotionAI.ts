import { IHttpClient, IHttpResponse } from '../utils/HttpClient'
import { IEmotionAI } from './IEmotionAI'
import { EAIConfig } from '../type.local'
import { logErrorSprintf, sprintf } from '../utils/utils'
import { EMOTION_AI_UC_URL, VISITOR_EAI_SCORE_KEY } from '../enum/FlagshipConstant'
import { IVisitorEvent } from './hit/IVisitorEvent'
import { IPageView } from './hit/IPageView'
import { IFlagshipConfig } from '../config/IFlagshipConfig'

type ConstructorParam = {
  httpClient: IHttpClient;
  sdkConfig: IFlagshipConfig;
  eAIConfig: EAIConfig|undefined;
}

export abstract class CommonEmotionAI implements IEmotionAI {
  protected _EAIScore?: Record<string, string>
  protected _EAIScoreChecked: boolean
  protected _httpClient: IHttpClient
  protected _sdkConfig: IFlagshipConfig
  protected _eAIConfig?: EAIConfig
  protected _isEAIDataCollecting: boolean
  protected _fetchEAIScorePromise?: Promise<IHttpResponse>
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

  public get EAIScore (): Record<string, string> | undefined {
    return this._EAIScore
  }

  public get EAIScoreChecked (): boolean {
    return this._EAIScoreChecked
  }

  protected abstract getCachedScore (cacheKey: string): Promise<string | null> ;

  protected abstract setCachedScore (cacheKey: string, score: string): Promise<void> ;

  public abstract cleanup (): void ;

  public async fetchEAIScore (visitorId:string): Promise<Record<string, string>|undefined> {
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

    const cacheKey = sprintf(VISITOR_EAI_SCORE_KEY, visitorId)
    const cachedEAIScore = await this.getCachedScore(cacheKey)

    if (cachedEAIScore) {
      this._EAIScore = JSON.parse(cachedEAIScore)
      this._EAIScoreChecked = true
      return this._EAIScore
    }

    try {
      const url = sprintf(EMOTION_AI_UC_URL, visitorId)
      this._fetchEAIScorePromise = this._httpClient.getAsync(url)
      const response = await this._fetchEAIScorePromise
      this._EAIScore = response.body
      this._EAIScoreChecked = true
      if (this._EAIScore) {
        this.setCachedScore(cacheKey, JSON.stringify(this._EAIScore))
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logErrorSprintf(
        this._sdkConfig,
        'EmotionAI.fetchEAIScore',
        'Failed to fetch EAIScore: {0}',
        error.message
      )
    } finally {
      this._fetchEAIScorePromise = undefined
    }
    return this._EAIScore
  }

  protected abstract startCollectingEAIData (visitorId: string): Promise<void> ;

  public async collectEAIData (visitorId: string): Promise<void> {
    if (!this._eAIConfig?.eaiActivationEnabled || this._isEAIDataCollecting ||
      !this._eAIConfig?.eaiCollectEnabled || this._isEAIDataCollected) {
      return
    }
    const score = await this.fetchEAIScore(visitorId)
    if (score) {
      return
    }
    await this.startCollectingEAIData(visitorId)
  }

  public async sendVisitorEvent (visitorEvent:IVisitorEvent): Promise<void> {
    try {
      console.log('sendVisitorEvent', visitorEvent.toApiKeys())
    } catch (error) {
      //
    }
  }

  public async sendPageView (pageView:IPageView): Promise<void> {
    try {
      console.log('sendPageView', pageView.toApiKeys())
    } catch (error) {
      //
    }
  }
}
