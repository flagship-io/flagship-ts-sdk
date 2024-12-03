import { EAIScore } from '../types'
import { CommonEmotionAI } from './CommonEmotionAI'
import { IPageView } from './hit/IPageView'
import { IVisitorEvent } from './hit/IVisitorEvent'

export class EmotionAI extends CommonEmotionAI {
  protected async startCollectingEAIData (visitorId: string, currentPage?: Omit<IPageView, 'toApiKeys'>): Promise<void> {
    //
  }

  public async reportVisitorEvent (visitorEvent: IVisitorEvent): Promise<void> {
    //
  }

  public cleanup (): void {
    //
  }

  public async fetchEAIScore (): Promise<EAIScore | undefined> {
    return undefined
  }

  public async collectEAIData (currentPage?: Omit<IPageView, 'toApiKeys'>): Promise<void> {
    //
  }
}
