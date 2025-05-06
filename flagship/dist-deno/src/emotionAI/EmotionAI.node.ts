import { ConstructorParam } from '../type.local.ts';
import { EAIScore } from '../types.ts';
import { IEmotionAI } from './IEmotionAI.ts';

export class EmotionAI implements IEmotionAI {

  public constructor(_params: ConstructorParam) {
    //
  }

  init(): void {
    //
  }

  async reportPageView(): Promise<void> {
    //
  }

  onEAICollectStatusChange(): void {
    //
  }

  protected async startCollectingEAIData(): Promise<void> {
    //
  }

  public async reportVisitorEvent(): Promise<void> {
    //
  }

  public cleanup(): void {
    //
  }

  protected removeListeners(): void {
    //
  }

  public async fetchEAIScore(): Promise<EAIScore | undefined> {
    return undefined;
  }

  public async collectEAIEventsAsync(): Promise<void> {
    //
  }
}
