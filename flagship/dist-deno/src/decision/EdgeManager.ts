import { CampaignDTO } from '../types.ts';
import { VisitorAbstract } from '../visitor/VisitorAbstract.ts';
import { BucketingManager } from './BucketingManager.ts';

export class EdgeManager extends BucketingManager {
  public getCampaignsAsync(visitor: VisitorAbstract): Promise<CampaignDTO[] | null> {
    return super.getCampaignsAsync(visitor);
  }
}
