
import { CommonEmotionAI } from './CommonEmotionAI'

export class EmotionAI extends CommonEmotionAI {
  public cleanup (): void {
    throw new Error('Method not implemented.')
  }

  protected getCachedScore (cacheKey: string): string | null {
    throw new Error('Method not implemented.')
  }

  protected setCachedScore (cacheKey: string, score: string): void {
    throw new Error('Method not implemented.')
  }

  protected startCollectingEAIData (visitorId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
