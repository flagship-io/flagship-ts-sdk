import { EAIScore } from '../types'
import { VisitorAbstract } from '../visitor/VisitorAbstract'
import { IPageView } from './hit/IPageView'
import { IVisitorEvent } from './hit/IVisitorEvent'

export interface IEmotionAI {

    init(visitor:VisitorAbstract): void;

    fetchEAIScore() : Promise<EAIScore|undefined>;

    collectEAIData(currentPage?: Omit<IPageView, 'toApiKeys'>) : Promise<void>;

    cleanup() : void;

    reportVisitorEvent(event: IVisitorEvent): Promise<void>;

    reportPageView(pageView: IPageView): Promise<void>;

    onEAICollectStatusChange(callback: (status: boolean) => void): void;
}
