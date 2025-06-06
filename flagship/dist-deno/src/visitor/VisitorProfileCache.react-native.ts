import { IFlagshipConfig } from '../config/IFlagshipConfig.ts';
import { Flagship } from '../main/Flagship.ts';
import { IVisitorProfileCache } from '../type.local.ts';
import { VisitorProfile } from '../types.ts';
import { logErrorSprintf } from '../utils/utils.ts';

export class VisitorProfileCache implements IVisitorProfileCache {
  private _sdkConfig:IFlagshipConfig;
  constructor(sdkConfig:IFlagshipConfig) {
    this._sdkConfig = sdkConfig;
  }

  saveVisitorProfile(visitorProfile: VisitorProfile): void {
    try {
      const extendedFlagship = Flagship as unknown as {
        getOnSaveVisitorProfile: () => (visitorProfile:string)=>void
      };
      const onSaveVisitorProfile = extendedFlagship.getOnSaveVisitorProfile();
      onSaveVisitorProfile?.(JSON.stringify(visitorProfile));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logErrorSprintf(this._sdkConfig, 'VisitorProfileCache.saveVisitorProfile', error?.message);
    }
  }

  loadVisitorProfile(): VisitorProfile | null {
    try {
      const extendedFlagship = Flagship as unknown as {
        getVisitorProfile: () => string|null,
      };
      const data = extendedFlagship.getVisitorProfile();
      return data ? JSON.parse(data) : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logErrorSprintf(this._sdkConfig, 'VisitorProfileCache.loadVisitorProfile', error?.message);
    }
    return null;
  }
}
