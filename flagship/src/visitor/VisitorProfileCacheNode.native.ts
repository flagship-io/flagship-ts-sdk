import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { Flagship } from '../main/Flagship'
import { IVisitorProfileCache } from '../type.local'
import { VisitorProfile } from '../types'
import { logErrorSprintf } from '../utils/utils'

export class VisitorProfileCacheNode implements IVisitorProfileCache {
  private _sdkConfig:IFlagshipConfig
  constructor (sdkConfig:IFlagshipConfig) {
    this._sdkConfig = sdkConfig
  }

  saveVisitorProfile (visitorProfile: VisitorProfile): void {
    try {
      const onSaveVisitorProfile = (Flagship as any).getOnSaveVisitorProfile()
      onSaveVisitorProfile?.(JSON.stringify(visitorProfile))
    } catch (error: any) {
      logErrorSprintf(this._sdkConfig, 'VisitorProfileCache.saveVisitorProfile', error?.message)
    }
  }

  loadVisitorProfile (): VisitorProfile | null {
    try {
      const data = (Flagship as any).getVisitorProfile()
      return data ? JSON.parse(data) : null
    } catch (error: any) {
      logErrorSprintf(this._sdkConfig, 'VisitorProfileCache.loadVisitorProfile', error?.message)
    }
    return null
  }
}
