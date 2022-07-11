import { CAMPAIGN_ID, HitType, VARIATION_GROUP_ID_API_ITEM } from '../enum/index'
import { HitAbstract, IHitAbstract } from './HitAbstract'

export const ERROR_MESSAGE = 'variationGroupId and campaignId are required'

export interface ICampaign extends IHitAbstract{
    variationGroupId: string
    campaignId: string
}

export class Campaign extends HitAbstract implements ICampaign {
    private _variationGroupId! : string;
    private _campaignId! : string;

    public constructor (param:Omit<ICampaign, 'type'|'createdAt'>) {
      super({
        type: HitType.CAMPAIGN,
        userIp: param.userIp,
        screenResolution: param.screenResolution,
        locale: param.locale,
        sessionNumber: param.sessionNumber,
        visitorId: param.visitorId,
        anonymousId: param.anonymousId
      })
      this.variationGroupId = param.variationGroupId
      this.campaignId = param.campaignId
    }

    public get variationGroupId () : string {
      return this._variationGroupId
    }

    public set variationGroupId (v : string) {
      this._variationGroupId = v
    }

    public get campaignId () : string {
      return this._campaignId
    }

    public set campaignId (v : string) {
      this._campaignId = v
    }

    public isReady (checkParent = true):boolean {
      return !!((!checkParent || super.isReady()) && this.variationGroupId && this.campaignId)
    }

    public toApiKeys ():Record<string, unknown> {
      const apiKeys = super.toApiKeys()
      apiKeys[VARIATION_GROUP_ID_API_ITEM] = this.variationGroupId
      apiKeys[CAMPAIGN_ID] = this.campaignId
      return apiKeys
    }

    public toObject ():Record<string, unknown> {
      return {
        ...super.toObject(),
        variationGroupId: this.variationGroupId,
        campaignId: this.campaignId
      }
    }

    public getErrorMessage (): string {
      return ERROR_MESSAGE
    }
}
