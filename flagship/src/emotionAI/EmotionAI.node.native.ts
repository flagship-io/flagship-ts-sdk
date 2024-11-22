import { CommonEmotionAI } from './CommonEmotionAI'
import { VisitorEvent } from './hit/VisitorEvent'
import { MAX_COLLECTING_TIME_MS, MAX_LAST_COLLECTING_TIME_MS, MAX_SCORING_POLLING_TIME } from '../enum/FlagshipConstant'
import { IPageView } from './hit/IPageView'
import { PageView } from './hit/PageView'

export class EmotionAI extends CommonEmotionAI {
  public cleanup (): void {
    //
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

  protected stopCollectingEAIData (): void {
    this._onEAICollectStatusChange?.(false)
    this._startScoringTimestamp = Date.now()

    this._scoringIntervalId = setInterval(async () => {
      if (Date.now() - this._startScoringTimestamp > MAX_SCORING_POLLING_TIME) {
        clearInterval(this._scoringIntervalId)
        this._isEAIDataCollecting = false
        this._isEAIDataCollected = true
      }
      this._EAIScoreChecked = false
      const score = await this.fetchEAIScore()
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
      this.stopCollectingEAIData()
    }
    if (timestampDiff > MAX_LAST_COLLECTING_TIME_MS) {
      this.stopCollectingEAIData()
      this._isEAIDataCollecting = false
      this._isEAIDataCollected = true
    }
  }
}
