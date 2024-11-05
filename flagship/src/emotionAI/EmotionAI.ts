
import { CommonEmotionAI } from './CommonEmotionAI'

export class EmotionAI extends CommonEmotionAI {
  protected getCachedScore (cacheKey: string): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(cacheKey)
    }
    return null
  }

  protected setCachedScore (cacheKey: string, score: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(cacheKey, score)
    }
  }

  protected startCollectingEAIData (visitorId: string): void {
    // Send EAIData to server
  }
}
