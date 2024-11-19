import { CommonEmotionAI } from './CommonEmotionAI'
import { IVisitorEvent } from './hit/IVisitorEvent'

export class EmotionAI extends CommonEmotionAI {
  public async reportVisitorEvent (visitorEvent: IVisitorEvent): Promise<void> {
    //
  }

  public cleanup (): void {
    //
  }

  protected async getCachedScore (_cacheKey: string): Promise<string | null> {
    return null
  }

  protected async setCachedScore (_cacheKey: string, _score: string): Promise<void> {
    //
  }

  protected async startCollectingEAIData (_visitorId: string): Promise<void> {
    //
  }
}
