import { ConstructorParam } from '../type.local';
import { EAIScore } from '../types';
import { IEmotionAI } from './IEmotionAI';

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
