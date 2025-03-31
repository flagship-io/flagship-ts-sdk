import { ISharedActionTracking } from '../../sharedFeature/ISharedActionTracking';
import { SdkApiParam } from '../../type.local';
import { VisitorAbstract } from '../../visitor/VisitorAbstract';
import { ISdkApiV1 } from './ISdkApiV1';

export class SdkApi {
  private sharedActionTracking?: ISharedActionTracking;
  private visitor?: VisitorAbstract;
  public constructor({ sharedActionTracking }: SdkApiParam) {
    this.sharedActionTracking = sharedActionTracking;
  }

  public setVisitor(visitor: VisitorAbstract): void {
    this.visitor = visitor;
  }

  public getApiV1(): ISdkApiV1 {
    return {
      _getActionTrackingNonce: () => this.sharedActionTracking?.generateNonce(),
      _getVisitorId: () => this.visitor?.isClientSuppliedID !== true ? this.visitor?.visitorId : undefined
    };
  }
}
