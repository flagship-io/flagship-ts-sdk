import { FSSdkStatus, FLAG_USER_EXPOSED, METHOD_DEACTIVATED_ERROR, FLAG_METADATA, METADATA_SDK_NOT_READY } from '../enum/index'
import { FlagDTO, IFlagMetadata, IHit } from '../types'
import { logErrorSprintf } from '../utils/utils'
import { DefaultStrategy } from './DefaultStrategy'
import { HitAbstract } from '../hit/index'
import { BatchDTO } from '../hit/Batch'
import { FlagMetadata } from '../flag/FlagMetadata'
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

  getFlagValue <T> (param:{ key:string, defaultValue: T, flag?:FlagDTO, userExposed?: boolean}): T {
    this.log('Flag.value')
    return param.defaultValue
  }

  async visitorExposed (): Promise<void> {
    this.log(FLAG_USER_EXPOSED)
  }

  getFlagMetadata (param:{metadata:IFlagMetadata, key?:string, hasSameType:boolean}):IFlagMetadata {
    const emptyMetaData = FlagMetadata.Empty()
    logErrorSprintf(this.config, FLAG_METADATA, METADATA_SDK_NOT_READY, this.visitor.visitorId, param.key, emptyMetaData)
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
    logErrorSprintf(this.config, methodName, METHOD_DEACTIVATED_ERROR, this.visitor.visitorId, methodName, FSSdkStatus[FSSdkStatus.SDK_NOT_INITIALIZED])
  }
}
