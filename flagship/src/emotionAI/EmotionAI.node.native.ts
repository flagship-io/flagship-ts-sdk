import { CommonEmotionAI } from './CommonEmotionAI'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { VisitorEvent } from './hit/VisitorEvent'
import { MAX_COLLECTING_TIME_MS, MAX_LAST_COLLECTING_TIME_MS, MAX_SCORING_POLLING_TIME } from '../enum/FlagshipConstant'
import { IPageView } from './hit/IPageView'
import { PageView } from './hit/PageView'

export class EmotionAI extends CommonEmotionAI {
  public cleanup (): void {
    //
  }

  protected async getCachedScore (cacheKey: string): Promise<string | null> {
    return AsyncStorage.getItem(cacheKey)
  }

  protected async setCachedScore (cacheKey: string, score: string): Promise<void> {
    return AsyncStorage.setItem(cacheKey, score)
  }

  protected async processPageView (currentPage: Omit<IPageView, 'toApiKeys'>): Promise<void> {
    const pageView = new PageView(currentPage)
    await this.reportPageView(pageView)
  }

  protected async startCollectingEAIData (visitorId: string, currentPage?: Omit<IPageView, 'toApiKeys'>): Promise<void> {
    if (currentPage) {
      await this.processPageView(currentPage)
    }
    this._isEAIDataCollecting = true
    this._startCollectingEAIDataTimestamp = Date.now()
    this._onEAICollectStatusChange?.(true)
  }

  protected stopCollectingEAIData (visitorId:string): void {
    this._onEAICollectStatusChange?.(false)
    this._startScoringTimestamp = Date.now()

    this._scoringIntervalId = setInterval(async () => {
      if (Date.now() - this._startScoringTimestamp > MAX_SCORING_POLLING_TIME) {
        clearInterval(this._scoringIntervalId)
        this._isEAIDataCollecting = false
        this._isEAIDataCollected = true
      }
      this._EAIScoreChecked = false
      const score = await this.fetchEAIScore(visitorId)
      if (score) {
        clearInterval(this._scoringIntervalId)
        this._isEAIDataCollecting = false
        this._isEAIDataCollected = true
      }
    }, this._scoringInterval)
  }

  public async reportVisitorEvent (visitorEvent: VisitorEvent): Promise<void> {
    const timestampDiff = Date.now() - this._startCollectingEAIDataTimestamp
    if (timestampDiff <= MAX_COLLECTING_TIME_MS) {
      this.sendEAIEvent(visitorEvent)
    }

    if ((timestampDiff > MAX_COLLECTING_TIME_MS && timestampDiff <= MAX_LAST_COLLECTING_TIME_MS)) {
      this.sendEAIEvent(visitorEvent)
      this.stopCollectingEAIData(visitorEvent.visitorId)
    }
    if (timestampDiff > MAX_LAST_COLLECTING_TIME_MS) {
      this.stopCollectingEAIData(visitorEvent.visitorId)
      this._isEAIDataCollecting = false
      this._isEAIDataCollected = true
    }
  }
}
