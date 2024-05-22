
import { FSSdkStatus, FLAG_VISITOR_EXPOSED, METHOD_DEACTIVATED_ERROR, FLAG_METADATA, METADATA_PANIC_MODE } from '../enum/index'
import { FlagDTO, IFlagMetadata, IHit } from '../types'
import { logInfoSprintf } from '../utils/utils'
import { DefaultStrategy } from './DefaultStrategy'
import { HitAbstract } from '../hit/index'
import { BatchDTO } from '../hit/Batch'
import { FlagMetadata } from '../flag/FlagMetadata'
import { CampaignDTO } from '../decision/api/models'
import { Troubleshooting } from '../hit/Troubleshooting'

export class PanicStrategy extends DefaultStrategy {
  setConsent (hasConsented:boolean):void {
    this.visitor.hasConsented = hasConsented
  }

  updateContext (): void {
    this.log('updateContext')
  }

  clearContext (): void {
    this.log('clearContext')
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

  protected async cacheHit (): Promise<void> {
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
  async sendHits (_hits: HitAbstract[] | IHit[]|BatchDTO[]): Promise<void> {
    this.log('sendHits')
  }

  getFlagValue<T> (param:{ key:string, defaultValue: T, flag?:FlagDTO, visitorExposed?: boolean}): T extends null ? unknown : T {
    this.log('Flag.value')
    return param.defaultValue as T extends null ? unknown : T
  }

  async visitorExposed (): Promise<void> {
    this.log(FLAG_VISITOR_EXPOSED)
  }

  getFlagMetadata (param:{ key:string, flag?:FlagDTO}):IFlagMetadata {
    const emptyMetaData = FlagMetadata.Empty()
    logInfoSprintf(this.config, FLAG_METADATA, METADATA_PANIC_MODE, this.visitor.visitorId, param.key, emptyMetaData)
    return emptyMetaData
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async sendTroubleshootingHit (_hit: Troubleshooting): Promise<void> {
    //
  }

  public async sendSdkConfigAnalyticHit () {
    //
  }

  private log (methodName:string) {
    logInfoSprintf(this.config, methodName, METHOD_DEACTIVATED_ERROR, this.visitor.visitorId, methodName, FSSdkStatus[FSSdkStatus.SDK_PANIC])
  }
}
