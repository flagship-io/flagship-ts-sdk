import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { MAX_CLICK_PATH_LENGTH, MAX_COLLECTING_TIME_MS, MAX_LAST_COLLECTING_TIME_MS, MAX_SCORING_POLLING_TIME } from '../enum/FlagshipConstant'
import { EAIConfig } from '../type.local'
import { IHttpClient } from '../utils/HttpClient'
import { CommonEmotionAI } from './CommonEmotionAI'
import { PageView } from './hit/PageView'
import { VisitorEvent } from './hit/VisitorEvent'

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

  protected async getCachedScore (cacheKey: string): Promise<string | null> {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(cacheKey)
    }
    return null
  }

  protected async setCachedScore (cacheKey: string, score: string): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(cacheKey, score)
    }
  }

  public cleanup (): void {
    this.removeListeners()
    this._isEAIDataCollecting = false
    this._isEAIDataCollected = false
    clearInterval(this._scoringIntervalId)
  }

  protected async processPageView (visitorId: string): Promise<void> {
    if (this._lastPageViewLocation === window.location.href) {
      return
    }

    this._lastPageViewLocation = window.location.href

    const pageView = new PageView({
      visitorId,
      customerAccountId: this._sdkConfig.envId as string,
      currentUrl: window.location.href,
      hasAdBlocker: false,
      screenDepth: window.screen.colorDepth,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      doNotTrack: navigator.doNotTrack || 'unspecified',
      fonts: '',
      hasFakeBrowserInfos: false,
      hasFakeLanguageInfos: false,
      hasFakeOsInfos: false,
      hasFakeResolutionInfos: false,
      userLanguage: navigator.language,
      deviceCategory: 'desktop',
      pixelRatio: window.devicePixelRatio,
      documentReferer: document.referrer,
      viewportSize: `${document.documentElement.clientWidth}x${document.documentElement.clientHeight}`,
      touchSupport: 'ontouchstart' in window ? 'yes' : 'no',
      userAgent: navigator.userAgent
    })

    await this.reportPageView(pageView)
  }

  protected async startCollectingEAIData (visitorId: string): Promise<void> {
    await this.processPageView(visitorId)
    this._isEAIDataCollecting = true
    this._startCollectingEAIDataTimestamp = Date.now()
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

  protected stopCollectingEAIData (visitorId:string): void {
    this.removeListeners()
    this._startScoringTimestamp = Date.now()

    this._scoringIntervalId = setInterval(async () => {
      if (Date.now() - this._startScoringTimestamp > MAX_SCORING_POLLING_TIME) {
        clearInterval(this._scoringIntervalId)
        this._isEAIDataCollecting = false
        this._isEAIDataCollected = true
      }
      this._EAIScoreChecked = false
      const score = await this.fetchEAIScore(visitorId)
      if (score) {
        clearInterval(this._scoringIntervalId)
        this._isEAIDataCollecting = false
        this._isEAIDataCollected = true
      }
    }, this._scoringInterval)
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
    }, this.scrollEndDelay)
  }

  public async reportVisitorEvent (visitorEvent: VisitorEvent): Promise<void> {
    const timestampDiff = Date.now() - this._startCollectingEAIDataTimestamp
    if (timestampDiff <= MAX_COLLECTING_TIME_MS) {
      this.sendVisitorEvent(visitorEvent)
    }

    if ((timestampDiff > MAX_COLLECTING_TIME_MS && timestampDiff <= MAX_LAST_COLLECTING_TIME_MS)) {
      this.sendVisitorEvent(visitorEvent)
      this.stopCollectingEAIData(visitorEvent.visitorId)
    }
    if (timestampDiff > MAX_LAST_COLLECTING_TIME_MS) {
      this.removeListeners()
      this._isEAIDataCollecting = false
      this._isEAIDataCollected = true
    }
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
    }, 500)
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
