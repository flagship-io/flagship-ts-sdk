import { CommonEmotionAI } from './CommonEmotionAI'
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

  protected removeListeners (): void {
    this._onEAICollectStatusChange?.(false)
  }
}
