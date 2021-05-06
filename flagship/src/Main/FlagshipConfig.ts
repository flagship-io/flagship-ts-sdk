class FlagshipConfig{
    private _envId:string = null; 
    private _apiKey:string = null;
    private _decisionMode:number = DecisionMode.DECISION_API;
    private _timeOut = FlagshipConstant.REQUEST_TIME_OUT;
    private _logManager = null;
    private _decisionManager = null;
    private _trackingManager = null;

    constructor(envId:string, apiKey:string) {
        this._envId = envId;
        this._apiKey = apiKey;
      }
    
    public getEnvId() : string {
        return this._envId
    }

    public setEnvId(envId : string):FlagshipConfig {
        this._envId = envId;
        return this
    }

    public getApiKey() : string {
        return this._apiKey
    }

    public setApiKey(apiKey : string) {
        this._apiKey = apiKey;
    }
    
    public getDecisionMode() : number {
        return this._decisionMode;
    }
    
    public setDecisionMode(decisionMode : number) {
        if(DecisionMode.isDecisionMode(decisionMode)){
            this._decisionMode = decisionMode;
        }
    }
    
    public getTimeOut() : number {
        return this._timeOut;
    }
     
    public setTimeOut(timeOut : number) {
        this._timeOut = timeOut;
    }
     
}