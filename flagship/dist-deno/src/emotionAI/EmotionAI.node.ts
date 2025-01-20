import { EAIScore } from '../types.ts'
import { CommonEmotionAI } from './CommonEmotionAI.ts'

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
