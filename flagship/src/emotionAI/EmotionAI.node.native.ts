import { CommonEmotionAI } from './CommonEmotionAI'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { VisitorEvent } from './hit/VisitorEvent'
import { MAX_COLLECTING_TIME_MS, MAX_LAST_COLLECTING_TIME_MS, MAX_SCORING_POLLING_TIME } from '../enum/FlagshipConstant'

export class EmotionAI extends CommonEmotionAI {
  public cleanup (): void {
    throw new Error('Method not implemented.')
  }

  protected async getCachedScore (cacheKey: string): Promise<string | null> {
    return AsyncStorage.getItem(cacheKey)
  }

  protected async setCachedScore (cacheKey: string, score: string): Promise<void> {
    return AsyncStorage.setItem(cacheKey, score)
  }

  async processPageView (visitorId: string): Promise<void> {
    // const viewport = Dimensions.get('window')
    // const screen = Dimensions.get('screen')

    // const pageView = new PageView({
    //   visitorId,
    //   customerAccountId: this._sdkConfig.envId as string,
    //   currentUrl: 'Home Screen',
    //   hasAdBlocker: false,
    //   screenDepth: 24,
    //   screenSize: `${screen.width}x${screen.height}`,
    //   doNotTrack: 'unspecified',
    //   fonts: '',
    //   hasFakeBrowserInfos: false,
    //   hasFakeLanguageInfos: false,
    //   hasFakeOsInfos: false,
    //   hasFakeResolutionInfos: false,
    //   userLanguage: 'en',
    //   deviceCategory: 'mobile',
    //   pixelRatio: PixelRatio.get(),
    //   viewportSize: `${viewport.width}x${viewport.height}`,
    //   touchSupport: 'true',
    //   userAgent: 'React Native',
    //   documentReferer: ''
    // })

    // await this.sendPageView(pageView)
  }

  protected async startCollectingEAIData (visitorId: string): Promise<void> {
    // await this.processPageView(visitorId)
    this._isEAIDataCollecting = true
    this._startCollectingEAIDataTimestamp = Date.now()
    this._onEAICollectStatusChange?.(true)
  }

  protected stopCollectingEAIData (visitorId:string): void {
    this._onEAICollectStatusChange?.(false)
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
      this.stopCollectingEAIData(visitorEvent.visitorId)
      this._isEAIDataCollecting = false
      this._isEAIDataCollected = true
    }
  }
}
