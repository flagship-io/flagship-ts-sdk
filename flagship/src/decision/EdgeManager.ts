import { CampaignDTO } from '../types';
import { VisitorAbstract } from '../visitor/VisitorAbstract';
import { BucketingManager } from './BucketingManager';

export class EdgeManager extends BucketingManager {
  public getCampaignsAsync(visitor: VisitorAbstract): Promise<CampaignDTO[] | null> {
    return super.getCampaignsAsync(visitor);
  }
}
