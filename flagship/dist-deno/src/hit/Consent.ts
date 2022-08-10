import { HitType, VISITOR_CONSENT } from '../enum/index.ts'
import { HitAbstract, IHitAbstract } from './HitAbstract.ts'

export const ERROR_MESSAGE = 'visitorConsent is required'

export interface IConsent extends IHitAbstract{
    visitorConsent: boolean
}

export class Consent extends HitAbstract implements IConsent {
    private _visitorConsent! : boolean;

    public constructor (param:Omit<IConsent, 'type'|'createdAt'>) {
      super({
        type: HitType.CONSENT,
        userIp: param.userIp,
        screenResolution: param.screenResolution,
        locale: param.locale,
        sessionNumber: param.sessionNumber
      })
      this.visitorConsent = param.visitorConsent
    }

    public get visitorConsent () : boolean {
      return this._visitorConsent
    }

    public set visitorConsent (v : boolean) {
      this._visitorConsent = v
    }

    public isReady (checkParent = true):boolean {
      return !!((!checkParent || super.isReady()))
    }

    public toApiKeys ():Record<string, unknown> {
      const apiKeys = super.toApiKeys()
      apiKeys[VISITOR_CONSENT] = this.visitorConsent
      return apiKeys
    }

    public toObject ():Record<string, unknown> {
      return {
        ...super.toObject(),
        visitorConsent: this.visitorConsent
      }
    }

    public getErrorMessage (): string {
      return ERROR_MESSAGE
    }
}
