import { SdkApi } from '../../sdkApi/v1/SdkApi'
import { ISharedActionTracking } from '../../sharedFeature/ISharedActionTracking'

export function buildSdkApi (sharedActionTracking: ISharedActionTracking):void {
  if (typeof window === 'undefined') {
    return
  }
  window.ABTastyWebSdk = {
    v1: new SdkApi({ sharedActionTracking }).getApiV1()
  }
}
