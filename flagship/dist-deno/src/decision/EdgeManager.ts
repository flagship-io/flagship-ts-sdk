import { VisitorAbstract } from '../visitor/VisitorAbstract.ts'
import { CampaignDTO } from './api/models.ts'
import { BucketingManager } from './BucketingManager.ts'

export class EdgeManage extends BucketingManager {
  public getCampaignsAsync (visitor: VisitorAbstract): Promise<CampaignDTO[] | null> {
    if (this.config.initialBucketing) {
      return super.getCampaignsAsync(visitor)
    }
    return this.getDecisionApiCampaignsAsync(visitor)
  }
}
