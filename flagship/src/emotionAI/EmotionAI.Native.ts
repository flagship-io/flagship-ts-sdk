
import { CommonEmotionAI } from './CommonEmotionAI'

export class EmotionAI extends CommonEmotionAI {
  protected getCachedScore (cacheKey: string): string | null {
    throw new Error('Method not implemented.')
  }

  protected setCachedScore (cacheKey: string, score: string): void {
    throw new Error('Method not implemented.')
  }

  protected startCollectingEAIData (visitorId: string): void {
    throw new Error('Method not implemented.')
  }
}
