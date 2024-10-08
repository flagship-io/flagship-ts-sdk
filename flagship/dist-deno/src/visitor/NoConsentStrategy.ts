import { CampaignDTO, FlagDTO, IHit } from '../types.ts'
import { FLAG_VISITOR_EXPOSED, METHOD_DEACTIVATED_CONSENT_ERROR } from '../enum/index.ts'
import { HitAbstract } from '../hit/index.ts'
import { logInfo, sprintf } from '../utils/utils.ts'
import { DefaultStrategy } from './DefaultStrategy.ts'
import { BatchDTO } from '../hit/Batch.ts'
import { Troubleshooting } from '../hit/Troubleshooting.ts'

export class NoConsentStrategy extends DefaultStrategy {
  async lookupHits (): Promise<void> {
    //
  }

  async lookupVisitor (): Promise<void> {
    //
  }

  public async cacheVisitor ():Promise<void> {
    //
  }

  protected async cacheHit ():Promise<void> {
    //
  }

  protected fetchVisitorCampaigns (): CampaignDTO[] {
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async sendHit (_hit: HitAbstract | IHit| BatchDTO): Promise<void> {
    this.log('sendHit')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async sendHits (_hits: HitAbstract[] | IHit[] |BatchDTO[]): Promise<void> {
    this.log('sendHits')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async sendActivate (_flagDto: FlagDTO, _defaultValue?: unknown): Promise<void> {
    //
  }

  async visitorExposed (): Promise<void> {
    this.log(FLAG_VISITOR_EXPOSED)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async sendTroubleshootingHit (_hit: Troubleshooting): Promise<void> {
    //
  }

  private log (methodName:string) {
    logInfo(this.config, sprintf(METHOD_DEACTIVATED_CONSENT_ERROR, methodName, this.visitor.visitorId), methodName)
  }
}
