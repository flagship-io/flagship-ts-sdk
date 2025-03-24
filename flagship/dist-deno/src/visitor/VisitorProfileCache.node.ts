import { IFlagshipConfig } from '../config/IFlagshipConfig.ts'
import { IVisitorProfileCache } from '../type.local.ts'
import { VisitorProfile } from '../types.ts'

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
