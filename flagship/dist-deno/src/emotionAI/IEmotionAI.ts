import { EAIScore } from '../types.ts';
import { VisitorAbstract } from '../visitor/VisitorAbstract.ts';
import { IPageView } from './hit/IPageView.ts';
import { IVisitorEvent } from './hit/IVisitorEvent.ts';

export interface IEmotionAI {

    init(visitor:VisitorAbstract): void;

    fetchEAIScore() : Promise<EAIScore|undefined>;

    collectEAIEventsAsync(currentPage?: Omit<IPageView, 'toApiKeys'>) : Promise<void>;

    cleanup() : void;

    reportVisitorEvent(event: IVisitorEvent): Promise<void>;

    reportPageView(pageView: IPageView): Promise<void>;

    onEAICollectStatusChange(callback: (status: boolean) => void): void;
}
