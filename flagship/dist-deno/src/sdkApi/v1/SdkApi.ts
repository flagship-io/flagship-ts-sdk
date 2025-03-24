import { ISharedActionTracking } from '../../sharedFeature/ISharedActionTracking.ts'
import { SdkApiParam } from '../../type.local.ts'
import { ISdkApiV1 } from './ISdkApiV1.ts'

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
