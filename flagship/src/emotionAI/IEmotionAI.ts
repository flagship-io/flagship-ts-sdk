import { IPageView } from './hit/IPageView'
import { IVisitorEvent } from './hit/IVisitorEvent'

export interface IEmotionAI {

    fetchEAIScore(visitorId:string) : Promise<Record<string, string>|undefined>;

    collectEAIData(visitorId:string) : void;

    cleanup() : void;

    reportVisitorEvent(event: IVisitorEvent): Promise<void>;

    reportPageView(pageView: IPageView): Promise<void>;

    onEAICollectStatusChange(callback: (status: boolean) => void): void;
}
