import { ISharedActionTracking } from '../../sharedFeature/ISharedActionTracking'
import { SdkApiParam } from '../../type.local'
import { ISdkApi } from './ISdkApi'

export class SdkApi implements ISdkApi {
  private sharedActionTracking?: ISharedActionTracking
  public constructor ({ sharedActionTracking }:SdkApiParam) {
    this.sharedActionTracking = sharedActionTracking
  }

  getActionTrackingNonce (): string|undefined {
    return this.sharedActionTracking?.generateNonce()
  }
}
