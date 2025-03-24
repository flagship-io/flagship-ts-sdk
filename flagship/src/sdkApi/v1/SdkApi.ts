import { ISharedActionTracking } from '../../sharedFeature/ISharedActionTracking'
import { SdkApiParam } from '../../type.local'
import { ISdkApiV1 } from './ISdkApiV1'

export class SdkApi {
  private sharedActionTracking?: ISharedActionTracking
  public constructor ({ sharedActionTracking }:SdkApiParam) {
    this.sharedActionTracking = sharedActionTracking
  }

  public getApiV1 (): ISdkApiV1 {
    return {
      _getActionTrackingNonce: () => this.sharedActionTracking?.generateNonce()
    }
  }
}
