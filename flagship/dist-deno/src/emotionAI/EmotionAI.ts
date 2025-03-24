import { IFlagshipConfig } from '../config/IFlagshipConfig.ts'
import { CLICK_PATH_DELAY_MS, MAX_CLICK_PATH_LENGTH, SCROLL_END_DELAY_MS } from '../enum/FlagshipConstant.ts'
import { EAIConfig } from '../type.local.ts'
import { TroubleshootingLabel } from '../types.ts'
import { IHttpClient } from '../utils/HttpClient.ts'
import { CommonEmotionAI } from './CommonEmotionAI.ts'
import { PageView } from './hit/PageView.ts'
import { VisitorEvent } from './hit/VisitorEvent.ts'

type ConstructorParam = {
  httpClient: IHttpClient;
  sdkConfig: IFlagshipConfig;
  eAIConfig: EAIConfig|undefined;
}

export class EmotionAI extends CommonEmotionAI {
  protected onScroll!: (event: Event) => void
  protected onMouseMove!: (event: MouseEvent) => void
  protected onMouseDown!: (event: MouseEvent) => void
  protected onMouseUp!: (event: MouseEvent) => void
  protected onPopState!: (event: PopStateEvent) => void
  protected _originalPushState: typeof window.history.pushState
  protected _originalReplaceState: typeof window.history.replaceState
  protected _clickPath = ''
  protected scrollTimeoutId: number | null = null
  protected readonly scrollEndDelay: number = 200
  protected _clickPathTimeoutId: number | null = null
  protected _lastPageViewLocation?: string

  public constructor (params: ConstructorParam) {
    super(params)
    this._originalPushState = window.history.pushState
    this._originalReplaceState = window.history.replaceState
  }

  public cleanup (): void {
    this.removeListeners()
    this._isEAIDataCollecting = false
    clearInterval(this._scoringIntervalId)
  }

  getDeviceCategory (): string {
    const userAgent = navigator.userAgent.toLowerCase()

    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'iphone'
    }
    if (/android/.test(userAgent)) {
      return 'android'
    }
    if (/windows nt/.test(userAgent)) {
      return 'win32'
    }
    if (/macintosh|mac os x/.test(userAgent)) {
      return 'darwin'
    }
    if (/linux/.test(userAgent)) {
      if (/armv8l/.test(userAgent)) {
        return 'linux armv8l'
      }
      return 'linux'
    }

    return 'unknown'
  }

  protected async processPageView (visitorId: string): Promise<void> {
    if (this._lastPageViewLocation === window.location.href) {
      return
    }

    this._lastPageViewLocation = window.location.href

    const maxTouchPoints = navigator.maxTouchPoints || 0
    const touchEvent = 'ontouchstart' in window
    const touchStart = 'ontouchstart' in window || 'onmsgesturechange' in window
    const touchSupport = JSON.stringify([maxTouchPoints, touchEvent, touchStart])

    const pageView = new PageView({
      visitorId,
      customerAccountId: this._sdkConfig.envId as string,
      currentUrl: window.location.href,
      hasAdBlocker: false,
      screenDepth: `${window.screen.colorDepth}`,
      screenSize: `${window.innerWidth},${window.innerHeight};`,
      doNotTrack: navigator.doNotTrack || 'unspecified',
      fonts: '[]',
      hasFakeBrowserInfos: false,
      hasFakeLanguageInfos: false,
      hasFakeOsInfos: false,
      hasFakeResolutionInfos: false,
      userLanguage: navigator.language,
      deviceCategory: this.getDeviceCategory(),
      pixelRatio: window.devicePixelRatio,
      documentReferer: document.referrer,
      viewportSize: `[${document.documentElement.clientWidth},${document.documentElement.clientHeight}]`,
      timezoneOffset: new Date().getTimezoneOffset(),
      touchSupport,
      eventCategory: 'click tunnel auto',
      userAgent: navigator.userAgent
    })

    await this.reportPageView(pageView)
  }

  protected async startCollectingEAIData (visitorId: string): Promise<void> {
    this._isEAIDataCollecting = true
    await this.processPageView(visitorId)
    this._startCollectingEAIDataTimestamp = Date.now()

    this.sendCollectingTroubleshooting(this._startCollectingEAIDataTimestamp, TroubleshootingLabel.EMOTION_AI_START_COLLECTING)
    this.sendCollectingUsageHit(TroubleshootingLabel.EMOTION_AI_START_COLLECTING)

    let mouseDownTimestamp: number | null = null

    this.onScroll = () => this.handleScroll(visitorId)
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
    this.onPopState = () => {
      this.processPageView(visitorId)
    }

    window.history.pushState = (...args) => {
      this._originalPushState.apply(window.history, args)
      this.processPageView(visitorId)
    }

    window.history.replaceState = (...args) => {
      this._originalReplaceState.apply(window.history, args)
      this.processPageView(visitorId)
    }

    window.addEventListener('scroll', this.onScroll)
    document.addEventListener('mousemove', this.onMouseMove)
    document.addEventListener('mousedown', this.onMouseDown)
    document.addEventListener('mouseup', this.onMouseUp)
    window.addEventListener('popstate', this.onPopState)
  }

  protected removeListeners (): void {
    window.removeEventListener('scroll', this.onScroll)
    document.removeEventListener('mousemove', this.onMouseMove)
    document.removeEventListener('mousedown', this.onMouseDown)
    document.removeEventListener('mouseup', this.onMouseUp)
    window.removeEventListener('popstate', this.onPopState)
    window.history.pushState = this._originalPushState
    window.history.replaceState = this._originalReplaceState
    if (this.scrollTimeoutId !== null) {
      clearTimeout(this.scrollTimeoutId)
      this.scrollTimeoutId = null
    }
    if (this._clickPathTimeoutId !== null) {
      clearTimeout(this._clickPathTimeoutId)
      this._clickPathTimeoutId = null
    }
  }

  protected onScrollEnd (visitorId: string): void {
    const timestamp = Date.now().toString().slice(-5)
    const scrollPosition = `${window.scrollY},${timestamp};`
    const visitorEvent = new VisitorEvent({
      visitorId,
      customerAccountId: this._sdkConfig.envId as string,
      scrollPosition,
      screenSize: `${window.innerWidth},${window.innerHeight};`,
      currentUrl: window.location.href
    })
    this.reportVisitorEvent(visitorEvent)
  }

  protected handleScroll = (visitorId: string): void => {
    if (this.scrollTimeoutId !== null) {
      clearTimeout(this.scrollTimeoutId)
    }

    this.scrollTimeoutId = window.setTimeout(() => {
      this.onScrollEnd(visitorId)
      this.scrollTimeoutId = null
    }, SCROLL_END_DELAY_MS)
  }

  protected sendClickPath (visitorId: string): void {
    const visitorEvent = new VisitorEvent({
      visitorId,
      customerAccountId: this._sdkConfig.envId as string,
      clickPath: this._clickPath,
      screenSize: `${window.innerWidth},${window.innerHeight};`,
      currentUrl: window.location.href
    })
    this._clickPath = ''
    this.reportVisitorEvent(visitorEvent)
  }

  protected handleMouseMove = (event: MouseEvent, visitorId: string): void => {
    if (this._clickPathTimeoutId !== null) {
      clearTimeout(this._clickPathTimeoutId)
    }
    this._clickPath += `${event.clientX},${event.clientY},${Date.now().toString().slice(-5)};`

    if (this._clickPath.length >= MAX_CLICK_PATH_LENGTH) {
      this.sendClickPath(visitorId)
      return
    }
    this._clickPathTimeoutId = window.setTimeout(() => {
      this.sendClickPath(visitorId)
    }, CLICK_PATH_DELAY_MS)
  }

  protected handleClick = (event: MouseEvent, visitorId: string, clickDuration: number): void => {
    const timestamp = Date.now().toString().slice(-5)
    const visitorEvent = new VisitorEvent({
      visitorId,
      customerAccountId: this._sdkConfig.envId as string,
      clickPosition: `${event.clientX},${event.clientY},${timestamp},${clickDuration};`,
      screenSize: `${window.innerWidth},${window.innerHeight};`,
      currentUrl: window.location.href
    })
    this.reportVisitorEvent(visitorEvent)
  }
}
