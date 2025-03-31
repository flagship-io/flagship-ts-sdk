import { ISharedActionTracking } from '../../sharedFeature/ISharedActionTracking.ts';
import { SdkApiParam } from '../../type.local.ts';
import { VisitorAbstract } from '../../visitor/VisitorAbstract.ts';
import { ISdkApiV1 } from './ISdkApiV1.ts';

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
