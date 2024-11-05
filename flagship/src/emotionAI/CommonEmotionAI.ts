import { IFlagshipConfig } from 'src/mod'
import { IHttpClient } from '../utils/HttpClient'
import { IEmotionAI } from './IEmotionAI'
import { EAIConfig } from '../type.local'
import { logErrorSprintf, sprintf } from '../utils/utils'
import { EMOTION_AI_UC_URL, VISITOR_EAI_SCORE_KEY } from '../enum/FlagshipConstant'

type ConstructorParam = {
  httpClient: IHttpClient;
  sdkConfig: IFlagshipConfig;
  eAIConfig: EAIConfig;
}

export abstract class CommonEmotionAI implements IEmotionAI {
  protected _EAIScore?: string
  protected _EAIScoreChecked
  protected _httpClient: IHttpClient
  protected _sdkConfig: IFlagshipConfig
  protected _eAIConfig: EAIConfig

  public constructor ({ httpClient, sdkConfig, eAIConfig }: ConstructorParam) {
    this._EAIScoreChecked = false
    this._httpClient = httpClient
    this._sdkConfig = sdkConfig
    this._eAIConfig = eAIConfig
  }

  public get EAIScore (): string | undefined {
    return this._EAIScore
  }

  public get EAIScoreChecked (): boolean {
    return this._EAIScoreChecked
  }

  protected abstract getCachedScore (cacheKey: string): string | null ;

  protected abstract setCachedScore (cacheKey: string, score: string): void ;

  public async fetchEAIScore (visitorId:string): Promise<string|undefined> {
    if (!this._eAIConfig.EAIActivationEnabled) {
      return undefined
    }

    if (this._EAIScoreChecked) {
      return this._EAIScore
    }

    const cacheKey = sprintf(VISITOR_EAI_SCORE_KEY, visitorId)
    const cachedEAIScore = this.getCachedScore(cacheKey)

    if (cachedEAIScore) {
      this._EAIScore = cachedEAIScore
      this._EAIScoreChecked = true
      return this._EAIScore
    }

    try {
      const url = sprintf(EMOTION_AI_UC_URL, visitorId)
      const response = await this._httpClient.getAsync(url)
      this._EAIScore = response.body
      this._EAIScoreChecked = true
      this.setCachedScore(cacheKey, this._EAIScore as string)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logErrorSprintf(
        this._sdkConfig,
        'EmotionAI.fetchEAIScore',
        'Failed to fetch EAIScore: {0}',
        error.message
      )
    }

    return this._EAIScore
  }

  protected abstract startCollectingEAIData (visitorId: string): void

  public async collectEAIData (visitorId: string): Promise<void> {
    if (this._EAIScoreChecked || !this._eAIConfig.EAICollectEnabled) {
      return
    }
    const score = await this.fetchEAIScore(visitorId)
    if (score !== undefined) {
      return
    }
    this.startCollectingEAIData(visitorId)
  }
}
