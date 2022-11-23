import { VisitorAbstract } from '../visitor/VisitorAbstract'
import { CampaignDTO } from './api/models'
import { BucketingManager } from './BucketingManager'

export class EdgeManage extends BucketingManager {
  public getCampaignsAsync (visitor: VisitorAbstract): Promise<CampaignDTO[] | null> {
    if (this.config.initialBucketing) {
      return super.getCampaignsAsync(visitor)
    }
    return this.getDecisionApiCampaignsAsync(visitor)
  }
}
