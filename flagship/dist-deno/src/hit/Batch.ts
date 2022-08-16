import { CUSTOMER_ENV_ID_API_ITEM, DS_API_ITEM, QT_API_ITEM, T_API_ITEM } from '../enum/FlagshipConstant.ts'
import { IHit } from '../types.ts'
import { HitAbstract, IHitAbstract } from './HitAbstract.ts'

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

<<<<<<< HEAD
    constructor (params: Omit<IBatch, 'type'|'createdAt'>) {
      super({ ...params, type: BATCH })
      this.hits = params.hits
    }
=======
  constructor (params: Omit<IBatch, 'type'>) {
    super({ ...params, type: BATCH })
    this.hits = params.hits
  }
>>>>>>> origin/main

  public isReady (): boolean {
    return !!(
      super.isReady() &&
        this.hits &&
        this.hits.length > 0 &&
        this.hits.every(hit => hit.isReady(false))
    )
  }

<<<<<<< HEAD
    public toApiKeys ():Record<string, unknown> {
      const apiKeys:Record<string, unknown> = {
        [DS_API_ITEM]: this.ds,
        [CUSTOMER_ENV_ID_API_ITEM]: `${this.config?.envId}`,
        [T_API_ITEM]: this.type,
        [QT_API_ITEM]: Date.now() - this.createdAt
      }
      apiKeys.h = this.hits.map(hit => {
        const hitKeys = hit.toApiKeys()
        delete hitKeys[CUSTOMER_ENV_ID_API_ITEM]
        delete hitKeys[DS_API_ITEM]
        return hitKeys
      })
      return apiKeys
    }

    public getErrorMessage (): string {
      return ERROR_MESSAGE
    }
=======
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
>>>>>>> origin/main
}
