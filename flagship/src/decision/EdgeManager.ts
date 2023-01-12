import { VisitorAbstract } from '../visitor/VisitorAbstract'
import { CampaignDTO } from './api/models'
import { BucketingManager } from './BucketingManager'

export class EdgeManager extends BucketingManager {
  public getCampaignsAsync (visitor: VisitorAbstract): Promise<CampaignDTO[] | null> {
    return super.getCampaignsAsync(visitor)
  }
}
