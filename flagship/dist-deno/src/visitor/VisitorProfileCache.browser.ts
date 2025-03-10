import { IFlagshipConfig } from '../config/IFlagshipConfig.ts'
import { CLIENT_CACHE_KEY } from '../enum/index.ts'
import { IVisitorProfileCache } from '../type.local.ts'
import { VisitorProfile } from '../types.ts'
import { logErrorSprintf } from '../utils/utils.ts'

export class VisitorProfileCache implements IVisitorProfileCache {
  private _sdkConfig:IFlagshipConfig
  constructor (sdkConfig:IFlagshipConfig) {
    this._sdkConfig = sdkConfig
  }

  saveVisitorProfile (visitorProfile: VisitorProfile): void {
    try {
      localStorage.setItem(CLIENT_CACHE_KEY, JSON.stringify(visitorProfile))
    } catch (error: any) {
      logErrorSprintf(this._sdkConfig, 'VisitorProfileCache.saveVisitorProfile', error?.message)
    }
  }

  loadVisitorProfile (): VisitorProfile | null {
    try {
      const data = localStorage.getItem(CLIENT_CACHE_KEY)
      return data ? JSON.parse(data) : null
    } catch (error: any) {
      logErrorSprintf(this._sdkConfig, 'VisitorProfileCache.loadVisitorProfile', error?.message)
    }
    return null
  }
}
