import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { CLIENT_CACHE_KEY } from '../enum/index'
import { IVisitorProfileCache } from '../type.local'
import { VisitorProfile } from '../types'
import { logErrorSprintf } from '../utils/utils'

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
