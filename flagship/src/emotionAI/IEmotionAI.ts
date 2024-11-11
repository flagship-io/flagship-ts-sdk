
export interface IEmotionAI {

    fetchEAIScore(visitorId:string) : Promise<Record<string, string>|undefined>;

    collectEAIData(visitorId:string) : void;

    cleanup() : void;
}
