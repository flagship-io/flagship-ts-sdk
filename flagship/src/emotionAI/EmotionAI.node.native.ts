import { CommonEmotionAI } from './CommonEmotionAI'
import AsyncStorage from '@react-native-async-storage/async-storage'

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
  }
}
