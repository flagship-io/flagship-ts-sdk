import { IPageView } from './IPageView.ts'

export class PageView implements IPageView {
  _customerAccountId: string
  _visitorId: string
  _hasAdBlocker: boolean
  _screenDepth: string
  _screenSize: string
  _doNotTrack: string
  _fonts: string
  _hasFakeBrowserInfos: boolean
  _hasFakeLanguageInfos: boolean
  _hasFakeOsInfos: boolean
  _hasFakeResolutionInfos: boolean
  _userLanguage: string
  _deviceCategory: string
  _pixelRatio: number
  _plugins?: string | undefined
  _documentReferer: string
  _viewportSize: string
  _touchSupport: string
  _currentUrl: string
  _userAgent: string
  _customerUserId?: string | undefined
  _timezoneOffset: number
  _eventCategory: string

  public get customerAccountId (): string {
    return this._customerAccountId
  }

  public get visitorId (): string {
    return this._visitorId
  }

  public get hasAdBlocker (): boolean {
    return this._hasAdBlocker
  }

  public get screenDepth (): string {
    return this._screenDepth
  }

  public get screenSize (): string {
    return this._screenSize
  }

  public get doNotTrack (): string {
    return this._doNotTrack
  }

  public get fonts (): string {
    return this._fonts
  }

  public get hasFakeBrowserInfos (): boolean {
    return this._hasFakeBrowserInfos
  }

  public get hasFakeLanguageInfos (): boolean {
    return this._hasFakeLanguageInfos
  }

  public get hasFakeOsInfos (): boolean {
    return this._hasFakeOsInfos
  }

  public get hasFakeResolutionInfos (): boolean {
    return this._hasFakeResolutionInfos
  }

  public get userLanguage (): string {
    return this._userLanguage
  }

  public get deviceCategory (): string {
    return this._deviceCategory
  }

  public get pixelRatio (): number {
    return this._pixelRatio
  }

  public get plugins (): string | undefined {
    return this._plugins
  }

  public get documentReferer (): string {
    return this._documentReferer
  }

  public get viewportSize (): string {
    return this._viewportSize
  }

  public get touchSupport (): string {
    return this._touchSupport
  }

  public get currentUrl (): string {
    return this._currentUrl
  }

  public get userAgent (): string {
    return this._userAgent
  }

  public get customerUserId (): string | undefined {
    return this._customerUserId
  }

  public get timezoneOffset (): number {
    return this._timezoneOffset
  }

  public get eventCategory (): string {
    return this._eventCategory
  }

  public constructor ({
    customerAccountId,
    visitorId,
    hasAdBlocker,
    screenDepth,
    screenSize,
    doNotTrack,
    fonts,
    hasFakeBrowserInfos,
    hasFakeLanguageInfos,
    hasFakeOsInfos,
    hasFakeResolutionInfos,
    userLanguage,
    deviceCategory,
    pixelRatio,
    plugins,
    documentReferer,
    viewportSize,
    touchSupport,
    currentUrl,
    userAgent,
    customerUserId,
    timezoneOffset,
    eventCategory
  }: Omit<IPageView, 'toApiKeys'>) {
    this._customerAccountId = customerAccountId
    this._visitorId = visitorId
    this._hasAdBlocker = hasAdBlocker
    this._screenDepth = screenDepth
    this._screenSize = screenSize
    this._doNotTrack = doNotTrack
    this._fonts = fonts
    this._hasFakeBrowserInfos = hasFakeBrowserInfos
    this._hasFakeLanguageInfos = hasFakeLanguageInfos
    this._hasFakeOsInfos = hasFakeOsInfos
    this._hasFakeResolutionInfos = hasFakeResolutionInfos
    this._userLanguage = userLanguage
    this._deviceCategory = deviceCategory
    this._pixelRatio = pixelRatio
    this._plugins = plugins
    this._documentReferer = documentReferer
    this._viewportSize = viewportSize
    this._touchSupport = touchSupport
    this._currentUrl = currentUrl
    this._userAgent = userAgent
    this._customerUserId = customerUserId
    this._timezoneOffset = timezoneOffset
    this._eventCategory = eventCategory
  }

  public toApiKeys (): Record<string, boolean|string|number> {
    const apiKeys:Record<string, boolean|string|number> = {
      cid: this._customerAccountId,
      vid: this._visitorId,
      adb: this._hasAdBlocker,
      sd: this._screenDepth,
      sr: this._screenSize,
      dnt: this._doNotTrack,
      fnt: this._fonts,
      hlb: this._hasFakeBrowserInfos,
      hll: this._hasFakeLanguageInfos,
      hlo: this._hasFakeOsInfos,
      hlr: this._hasFakeResolutionInfos,
      ul: this._userLanguage,
      dc: this._deviceCategory,
      pxr: this._pixelRatio,
      dr: this._documentReferer,
      vp: this._viewportSize,
      tof: this._timezoneOffset,
      tsp: this._touchSupport,
      dl: this._currentUrl,
      ua: this._userAgent,
      ec: this._eventCategory,
      t: 'PAGEVIEW'
    }
    if (this._plugins) {
      apiKeys.plu = this._plugins
    }
    if (this._customerUserId) {
      apiKeys.cuid = this._customerUserId
    }
    return apiKeys
  }
}
