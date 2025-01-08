import { FSSdkStatus, FLAG_VISITOR_EXPOSED, METHOD_DEACTIVATED_ERROR, FLAG_METADATA, METADATA_SDK_NOT_READY } from '../enum/index'
import { FlagDTO, IFSFlagMetadata, IHit } from '../types'
import { logErrorSprintf } from '../utils/utils'
import { DefaultStrategy } from './DefaultStrategy'
import { HitAbstract } from '../hit/index'
import { BatchDTO } from '../hit/Batch'
import { FSFlagMetadata } from '../flag/FSFlagMetadata'
import { Troubleshooting } from '../hit/Troubleshooting'

export class NotReadyStrategy extends DefaultStrategy {
  async lookupHits (): Promise<void> {
    //
  }

  async lookupVisitor (): Promise<void> {
    //
  }

  public async cacheVisitor ():Promise<void> {
    //
  }

  public async collectEAIEventsAsync (): Promise<void> {
    this.log('collectEAIData')
  }

  public onEAICollectStatusChange (): void {
    //
  }

  public reportEaiPageView (): void {
    //
  }

  public reportEaiVisitorEvent (): void {
    //
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async sendHit (_hit: HitAbstract | IHit | BatchDTO): Promise<void> {
    this.log('sendHit')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async sendHits (_hits: HitAbstract[] | IHit[] |BatchDTO[]): Promise<void> {
    this.log('sendHits')
  }

  async fetchFlags ():Promise<void> {
    this.log('fetchFlags')
  }

  getFlagValue<T> (param:{ key:string, defaultValue: T, flag?:FlagDTO, visitorExposed?: boolean}): T extends null ? unknown : T {
    this.log('Flag.value')
    return param.defaultValue as T extends null ? unknown : T
  }

  async visitorExposed (): Promise<void> {
    this.log(FLAG_VISITOR_EXPOSED)
  }

  getFlagMetadata (param:{ key:string, flag?:FlagDTO}):IFSFlagMetadata {
    const emptyMetaData = FSFlagMetadata.Empty()
    logErrorSprintf(this.config, FLAG_METADATA, METADATA_SDK_NOT_READY, this.visitor.visitorId, param.key, emptyMetaData)
    return emptyMetaData
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async sendActivate (_flagDto: FlagDTO, _defaultValue?: unknown): Promise<void> {
    //
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async sendTroubleshootingHit (_hit: Troubleshooting): Promise<void> {
    //
  }

  public async sendSdkConfigAnalyticHit () {
    //
  }

  private log (methodName:string) {
    logErrorSprintf(this.config, methodName, METHOD_DEACTIVATED_ERROR, this.visitor.visitorId, methodName, FSSdkStatus[FSSdkStatus.SDK_NOT_INITIALIZED])
  }
}
