import { CUSTOMER_ENV_ID_API_ITEM, CUSTOMER_UID, DS_API_ITEM, QT_API_ITEM, SCREEN_RESOLUTION_API_ITEM, SESSION_NUMBER, T_API_ITEM, USER_IP_API_ITEM, USER_LANGUAGE, VISITOR_ID_API_ITEM } from '../enum/FlagshipConstant.ts'
import { IHit, primitive } from '../types.ts'
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
    private _hits! : HitAbstract[];
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
