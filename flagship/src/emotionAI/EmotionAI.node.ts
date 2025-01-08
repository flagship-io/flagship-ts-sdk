import { EAIScore } from '../types'
import { CommonEmotionAI } from './CommonEmotionAI'

export class EmotionAI extends CommonEmotionAI {
  protected async startCollectingEAIData (): Promise<void> {
    //
  }

  public async reportVisitorEvent (): Promise<void> {
    //
  }

  public cleanup (): void {
    //
  }

  protected removeListeners (): void {
    //
  }

  public async fetchEAIScore (): Promise<EAIScore | undefined> {
    return undefined
  }

  public async collectEAIEventsAsync (): Promise<void> {
    //
  }
}
