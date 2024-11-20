import { EAIScore } from '../type.local'
import { IPageView } from './hit/IPageView'
import { IVisitorEvent } from './hit/IVisitorEvent'

export interface IEmotionAI {

    fetchEAIScore(visitorId:string) : Promise<EAIScore|undefined>;

    collectEAIData(visitorId:string, currentPage?: Omit<IPageView, 'toApiKeys'>) : void;

    cleanup() : void;

    reportVisitorEvent(event: IVisitorEvent): Promise<void>;

    reportPageView(pageView: IPageView): Promise<void>;

    onEAICollectStatusChange(callback: (status: boolean) => void): void;
}
