
import { MAX_COLLECTING_TIME_MS, MAX_LAST_COLLECTING_TIME_MS } from '../enum/FlagshipConstant'
import { CommonEmotionAI } from './CommonEmotionAI'
import { VisitorEvent } from './hit/VisitorEvent'

export class EmotionAI extends CommonEmotionAI {
  protected onScroll!: (event: Event) => void
  protected onMouseMove!: (event: MouseEvent) => void
  protected onMouseDown!: (event: MouseEvent) => void
  protected onMouseUp!: (event: MouseEvent) => void

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
    this._startCollectingEAIDataTimestamp = Date.now()
    let mouseDownTimestamp: number | null = null

    this.onScroll = (event: Event) => this.handleScroll(event, visitorId)
    this.onMouseMove = (event: MouseEvent) => this.handleMouseMove(event, visitorId)

    this.onMouseDown = () => {
      mouseDownTimestamp = Date.now()
    }
    this.onMouseUp = (event: MouseEvent) => {
      if (mouseDownTimestamp) {
        const clickDuration = Date.now() - mouseDownTimestamp
        this.handleClick(event, visitorId, clickDuration)
        mouseDownTimestamp = null
      }
    }

    window.addEventListener('scroll', this.onScroll)
    document.addEventListener('mousemove', this.onMouseMove)
    document.addEventListener('mousedown', this.onMouseDown)
    document.addEventListener('mouseup', this.onMouseUp)
  }

  protected stopCollectingEAIData (): void {
    this._isEAIDataCollecting = false
    window.removeEventListener('scroll', this.onScroll)
    document.removeEventListener('mousemove', this.onMouseMove)
    document.removeEventListener('mousedown', this.onMouseDown)
    document.removeEventListener('mouseup', this.onMouseUp)
  }

  private handleScroll = (event: Event, visitorId: string): void => {
    console.log('scroll', event, visitorId)
  }

  private handleMouseMove = (event: MouseEvent, visitorId: string): void => {
    console.log('mousemove', event, visitorId)
  }

  private handleClick = (event: MouseEvent, visitorId: string, clickDuration: number): void => {
    const timestamp = Date.now().toString().slice(-5)
    const visitorEvent = new VisitorEvent({
      visitorId,
      customerAccountId: this._sdkConfig.envId as string,
      clickPosition: `${event.clientX},${event.clientY},${timestamp},${clickDuration};`,
      screenSize: `${window.innerWidth},${window.innerHeight}`,
      currentUrl: window.location.href
    })
    const timestampDiff = Date.now() - this._startCollectingEAIDataTimestamp
    if (timestampDiff >= MAX_COLLECTING_TIME_MS && timestampDiff <= MAX_LAST_COLLECTING_TIME_MS) {
      this.stopCollectingEAIData()
    }
  }
}
