import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { IVisitorProfileCache } from '../type.local'
import { VisitorProfile } from '../types'

export class VisitorProfileCache implements IVisitorProfileCache {
  private _sdkConfig:IFlagshipConfig
  constructor (sdkConfig:IFlagshipConfig) {
    this._sdkConfig = sdkConfig
  }

  saveVisitorProfile (): void {
    //
  }

  loadVisitorProfile (): VisitorProfile | null {
    //
    return null
  }
}
