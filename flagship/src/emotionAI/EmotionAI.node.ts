
import { CommonEmotionAI } from './CommonEmotionAI'

export class EmotionAI extends CommonEmotionAI {
  public cleanup (): void {
    //
  }

  protected getCachedScore (_cacheKey: string): string | null {
    return null
  }

  protected setCachedScore (_cacheKey: string, _score: string): void {
    //
  }

  protected async startCollectingEAIData (_visitorId: string): Promise<void> {
    //
  }
}
