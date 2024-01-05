import { CampaignDTO, IHit } from '../types'
import { FLAG_USER_EXPOSED, METHOD_DEACTIVATED_CONSENT_ERROR } from '../enum/index'
import { HitAbstract, HitShape } from '../hit/index'
import { logInfo, sprintf } from '../utils/utils'
import { DefaultStrategy } from './DefaultStrategy'
import { BatchDTO } from '../hit/Batch'
import { Troubleshooting } from '../hit/Troubleshooting'

export class NoConsentStrategy extends DefaultStrategy {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async activateModification (_params: string): Promise<void> {
    this.log('activateModification')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async activateModifications (_params: string[] | { key: string }[]): Promise<void> {
    this.log('activateModifications')
  }

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
  sendHit (_hit: HitAbstract | IHit| HitShape| BatchDTO): Promise<void> {
    this.log('sendHit')
    return Promise.resolve()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendHits (_hits: HitAbstract[] | IHit[] | HitShape[]|BatchDTO[]): Promise<void> {
    this.log('sendHits')
    return Promise.resolve()
  }

  async visitorExposed (): Promise<void> {
    this.log(FLAG_USER_EXPOSED)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public sendTroubleshootingHit (_hit: Troubleshooting): Promise<void> {
    return Promise.resolve()
  }

  private log (methodName:string) {
    logInfo(this.config, sprintf(METHOD_DEACTIVATED_CONSENT_ERROR, methodName, this.visitor.visitorId), methodName)
  }
}