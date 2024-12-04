import { CommonEmotionAI } from './CommonEmotionAI'
import { IPageView } from './hit/IPageView'
import { PageView } from './hit/PageView'

export class EmotionAI extends CommonEmotionAI {
  public cleanup (): void {
    this._isEAIDataCollecting = false
  }

  protected async processPageView (currentPage: Omit<IPageView, 'toApiKeys'>): Promise<void> {
    const pageView = new PageView(currentPage)
    await this.reportPageView(pageView)
  }

  protected async startCollectingEAIData (visitorId: string, currentPage?: Omit<IPageView, 'toApiKeys'>): Promise<void> {
    this._isEAIDataCollecting = true
    this._startCollectingEAIDataTimestamp = Date.now()
    this._onEAICollectStatusChange?.(true)
    if (currentPage) {
      await this.processPageView(currentPage)
    }
  }

  protected removeListeners (): void {
    this._onEAICollectStatusChange?.(false)
  }
}
