import { ANONYMOUS_ID, CUSTOMER_ENV_ID_API_ITEM, SCREEN_RESOLUTION_API_ITEM, SESSION_NUMBER, USER_IP_API_ITEM, USER_LANGUAGE, VARIATION_GROUP_ID_API_ITEM, VARIATION_ID_API_ITEM, VISITOR_ID_API_ITEM } from "../enum/FlagshipConstant"
import { HitAbstract, IHitAbstract } from "./HitAbstract"


export interface IActivate extends IHitAbstract{
    variationId: string
    variationGroupId: string
    envId: string
}

export class Activate extends HitAbstract implements IActivate{
    
    private _variationId! : string;
    private _variationGroupId! : string;
    private _envId! : string;

    public constructor(param:IActivate){
        super({
            type: 'ACTIVATE',
            userIp: param?.userIp,
            screenResolution: param?.screenResolution,
            locale: param?.locale,
            sessionNumber: param?.sessionNumber
          })
          
        const {variationId, variationGroupId, envId} = param
        this.variationId = variationId
        this.variationGroupId = variationGroupId
        this.envId = envId
    }

    public get variationId() : string {
        return this._variationId;
    }
    public set variationId(v : string) {
        this._variationId = v;
    }

    public get variationGroupId() : string {
        return this._variationGroupId;
    }
    public set variationGroupId(v : string) {
        this._variationGroupId = v;
    }
    
    public get envId() : string {
        return this._envId;
    }
    public set envId(v : string) {
        this._envId = v;
    }
    

    public isReady (checkParent = true):boolean {
        return !!((!checkParent || super.isReady()) && this.visitorId && this.variationId && this.variationGroupId && this.envId)
      }
    
    public toApiKeys ():Record<string, unknown> {
        const apiKeys:Record<string, unknown> = {}

        apiKeys[VISITOR_ID_API_ITEM] = this.visitorId
        apiKeys[VARIATION_ID_API_ITEM] = this.variationId
        apiKeys[VARIATION_GROUP_ID_API_ITEM] =  this.variationGroupId
        apiKeys[CUSTOMER_ENV_ID_API_ITEM] = this.envId
        apiKeys[ANONYMOUS_ID] = this.anonymousId

        if (this.userIp) {
            apiKeys[USER_IP_API_ITEM] = this.userIp
          }
          if (this.screenResolution) {
            apiKeys[SCREEN_RESOLUTION_API_ITEM] = this.screenResolution
          }
          if (this.locale) {
            apiKeys[USER_LANGUAGE] = this.locale
          }
          if (this.sessionNumber) {
            apiKeys[SESSION_NUMBER] = this.sessionNumber
          }

          if (this.visitorId && this.anonymousId) {
            apiKeys[VISITOR_ID_API_ITEM] = this.visitorId
            apiKeys[ANONYMOUS_ID] = this.anonymousId
          } else {
            apiKeys[VISITOR_ID_API_ITEM] = this.anonymousId || this.visitorId
            apiKeys[ANONYMOUS_ID] = null
          }

        return apiKeys
      }
    
      public toObject ():Record<string, unknown> {
        return {
          ...super.toObject(),
          variationId: this.variationId,
          variationGroupId: this.variationGroupId,
          envId: this.envId
        }
      }
    
    
    public getErrorMessage(): string {
        throw new Error("Method not implemented.")
    }

}