import { FlagshipStatus, FLAG_USER_EXPOSED, METHOD_DEACTIVATED_ERROR, FLAG_METADATA, METADATA_SDK_NOT_READY } from '../enum/index'
import { FlagDTO, IFlagMetadata, IHit, modificationsRequested } from '../types'
import { logErrorSprintf } from '../utils/utils'
import { DefaultStrategy } from './DefaultStrategy'
import { HitAbstract, HitShape } from '../hit/index'
import { BatchDTO } from '../hit/Batch'
import { FlagMetadata } from '../flag/FlagMetadata'
import { Troubleshooting } from '../hit/Troubleshooting'
import { Analytic } from '../hit/Analytic'

export class NotReadyStrategy extends DefaultStrategy {
  async synchronizeModifications (): Promise<void> {
    this.log('synchronizeModifications')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getModificationSync<T> (params: modificationsRequested<T>): T {
    this.log('getModification')
    return params.defaultValue
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getModificationsSync<T> (params: modificationsRequested<T>[], _activateAll?: boolean): Record<string, T> {
    this.log('getModifications')
    const flags:Record<string, T> = {}
    params.forEach(item => {
      flags[item.key] = item.defaultValue
    })
    return flags
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getModificationInfoSync (_key: string): FlagDTO | null {
    this.log('getModificationInfo')
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async activateModification (_params: string): Promise<void> {
    this.log('activateModification')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async activateModifications (_params: string[] | { key: string }[]): Promise<void> {
    this.log('activateModifications')
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
  public sendTroubleshootingHit (_hit: Troubleshooting): Promise<void> {
    return Promise.resolve()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async sendAnalyticHit (_hit: Analytic) {
    return Promise.resolve()
  }

  private log (methodName:string) {
    logErrorSprintf(this.config, methodName, METHOD_DEACTIVATED_ERROR, this.visitor.visitorId, methodName, FlagshipStatus[FlagshipStatus.NOT_INITIALIZED])
  }
}