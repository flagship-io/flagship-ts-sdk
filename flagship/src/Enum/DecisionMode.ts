class DecisionMode {
    
    static readonly DECISION_API:number = 1;

    static isDecisionMode(value:number):boolean{
        switch(value){
            case this.DECISION_API:
                return true;
            default:
                return false

        }
    }
}