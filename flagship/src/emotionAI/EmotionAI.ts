
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
    this._isEAIDataCollecting = true
    this._startCollectingEAIDataTime = Date.now()
    const scrollHandler = (event: Event) => this.handleScroll(event, visitorId)
    const mouseMoveHandler = (event: MouseEvent) => this.handleMouseMove(event, visitorId)
    const clickHandler = (event: MouseEvent) => this.handleClick(event, visitorId)

    window.addEventListener('scroll', scrollHandler)
    document.addEventListener('mousemove', mouseMoveHandler)
    document.addEventListener('click', clickHandler)
  }

  private handleScroll = (event: Event, visitorId: string): void => {
    console.log('scroll', event, visitorId)
  }

  private handleMouseMove = (event: MouseEvent, visitorId: string): void => {
    console.log('mousemove', event, visitorId)
  }

  private handleClick = (event: MouseEvent, visitorId: string): void => {
    console.log('click', event, visitorId)
  }
}
