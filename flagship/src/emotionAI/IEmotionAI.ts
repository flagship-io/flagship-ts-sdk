
export interface IEmotionAI {
    readonly EAIScore? : string;
    readonly EAIScoreChecked : boolean;

    fetchEAIScore(visitorId:string) : Promise<string|undefined>;

    collectEAIData(visitorId:string) : void;
}
