import { CUSTOMER_ENV_ID_API_ITEM, CUSTOMER_UID, SCREEN_RESOLUTION_API_ITEM, SESSION_NUMBER, USER_IP_API_ITEM, USER_LANGUAGE, VISITOR_ID_API_ITEM } from '../enum/FlagshipConstant'
import { IHit } from '../types'
import { HitAbstract, IHitAbstract } from './HitAbstract'

export interface IBatch extends IHitAbstract {
    hits: HitAbstract[]
}

export const BATCH = 'BATCH'
export interface BatchDTO {
    type:'BATCH'
    hits:(IHit|undefined)[]
}

export const ERROR_MESSAGE = 'Please check required fields'
export class Batch extends HitAbstract implements IBatch {
  private _hits! : HitAbstract[]
  public get hits () : HitAbstract[] {
    return this._hits
  }

  public set hits (v : HitAbstract[]) {
    this._hits = v
  }

  constructor (params: Omit<IBatch, 'type'>) {
    super({ ...params, type: BATCH })
    this.hits = params.hits
  }

  public isReady (): boolean {
    return !!(
      super.isReady() &&
        this.hits &&
        this.hits.length > 0 &&
        this.hits.every(hit => hit.isReady(false))
    )
  }

  public toApiKeys ():Record<string, unknown> {
    const apiKeys = super.toApiKeys()
    apiKeys.h = this.hits.map(hit => {
      const hitKeys = hit.toApiKeys()
      delete hitKeys[VISITOR_ID_API_ITEM]
      delete hitKeys[CUSTOMER_ENV_ID_API_ITEM]
      delete hitKeys[USER_IP_API_ITEM]
      delete hitKeys[SCREEN_RESOLUTION_API_ITEM]
      delete hitKeys[USER_LANGUAGE]
      delete hitKeys[SESSION_NUMBER]
      delete hitKeys[VISITOR_ID_API_ITEM]
      delete hitKeys[CUSTOMER_UID]
      return hitKeys
    })
    return apiKeys
  }

  public toObject ():Record<string, unknown> {
    return {
      ...super.toObject(),
      hits: this.hits.map(hit => hit.toObject())
    }
  }

  public getErrorMessage (): string {
    return ERROR_MESSAGE
  }
}
