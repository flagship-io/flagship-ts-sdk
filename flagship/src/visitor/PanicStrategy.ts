
import { FSSdkStatus, FLAG_VISITOR_EXPOSED, METHOD_DEACTIVATED_ERROR, FLAG_METADATA, METADATA_PANIC_MODE } from '../enum/index'
import { CampaignDTO, FlagDTO, IFSFlagMetadata, IHit, primitive } from '../types'
import { logInfoSprintf } from '../utils/utils'
import { DefaultStrategy } from './DefaultStrategy'
import { HitAbstract } from '../hit/index'
import { BatchDTO } from '../hit/Batch'
import { FSFlagMetadata } from '../flag/FSFlagMetadata'
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

  protected fetchCampaignsFromCache (): CampaignDTO[] {
    return []
  }

  authenticate (): void {
    this.log('authenticate')
  }

  unauthenticate (): void {
    this.log('unauthenticate')
  }

  updateContextAsync(context: Record<string, primitive>): Promise<void>;
  updateContextAsync(key: string, value: primitive): Promise<void>;
  async updateContextAsync (): Promise<void> {
    this.log('updateContextAsync')
  }

  async clearContextAsync (): Promise<void> {
    this.log('clearContextAsync')
  }

  async authenticateAsync (): Promise<void> {
    this.log('authenticateAsync')
  }

  async unauthenticateAsync (): Promise<void> {
    this.log('unauthenticateAsync')
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

  getFlagMetadata (param:{ key:string, flag?:FlagDTO}):IFSFlagMetadata {
    const emptyMetaData = FSFlagMetadata.Empty()
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async sendActivate (_flagDto: FlagDTO, _defaultValue?: unknown): Promise<void> {
    //
  }

  private log (methodName:string) {
    logInfoSprintf(this.config, methodName, METHOD_DEACTIVATED_ERROR, this.visitor.visitorId, methodName, FSSdkStatus[FSSdkStatus.SDK_PANIC])
  }
}
