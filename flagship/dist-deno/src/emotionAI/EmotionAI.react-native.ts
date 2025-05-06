import { TroubleshootingLabel } from '../types.ts';
import { CommonEmotionAI } from './CommonEmotionAI.ts';
import { IPageView } from './hit/IPageView.ts';
import { PageView } from './hit/PageView.ts';

export class EmotionAI extends CommonEmotionAI {
  public cleanup(): void {
    this._isEAIDataCollecting = false;
  }

  protected async processPageView(currentPage: Omit<IPageView, 'toApiKeys'>): Promise<void> {
    const pageView = new PageView(currentPage);
    await this.reportPageView(pageView);
  }

  protected async startCollectingEAIData(visitorId: string, currentPage?: Omit<IPageView, 'toApiKeys'>): Promise<void> {
    this._isEAIDataCollecting = true;
    this._startCollectingEAIDataTimestamp = Date.now();
    this._onEAICollectStatusChange?.(true);
    if (currentPage) {
      await this.processPageView(currentPage);
    }
    this.sendCollectingTroubleshooting(this._startCollectingEAIDataTimestamp, TroubleshootingLabel.EMOTION_AI_STOP_COLLECTING);
    this.sendCollectingUsageHit(TroubleshootingLabel.EMOTION_AI_START_COLLECTING);
  }

  protected removeListeners(): void {
    this._onEAICollectStatusChange?.(false);
  }
}
