import { IPageView } from './hit/IPageView'
import { IVisitorEvent } from './hit/IVisitorEvent'

export interface IEmotionAI {

    fetchEAIScore(visitorId:string) : Promise<Record<string, string>|undefined>;

    collectEAIData(visitorId:string) : void;

    cleanup() : void;

    sendVisitorEvent(event: IVisitorEvent): Promise<void>;

    sendPageView(pageView: IPageView): Promise<void>;
}
