import { IFlagshipConfig } from '../config/index.ts'
import { BATCH, CUSTOMER_ENV_ID_API_ITEM } from '../enum/index.ts'
import { type Activate } from './Activate.ts'

export class ActivateBatch {
  private readonly _hits : Activate[]
  private readonly _config : IFlagshipConfig

  public get hits () : Activate[] {
    return this._hits
  }

  public get config () : IFlagshipConfig {
    return this._config
  }

  constructor (hits:Activate[], config:IFlagshipConfig) {
    this._config = config
    this._hits = hits
  }

  public toApiKeys ():Record<string, unknown> {
    return {
      [CUSTOMER_ENV_ID_API_ITEM]: `${this.config?.envId}`,
      [BATCH]: this.hits.map(x => {
        const apiKeys = x.toApiKeys()
        delete apiKeys[CUSTOMER_ENV_ID_API_ITEM]
        return apiKeys
      })
    }
  }
}
