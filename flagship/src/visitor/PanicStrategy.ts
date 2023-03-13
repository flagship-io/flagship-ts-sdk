import { CampaignDTO, FlagDTO } from '../index'
import { FlagshipStatus, FLAG_METADATA, FLAG_USER_EXPOSED, METADATA_PANIC_MODE, METHOD_DEACTIVATED_ERROR } from '../enum/index'
import { IFlagMetadata, IHit, modificationsRequested } from '../types'
import { logInfoSprintf } from '../utils/utils'
import { DefaultStrategy } from './DefaultStrategy'
import { HitAbstract, HitShape } from '../hit/index'
import { BatchDTO } from '../hit/Batch'
import { FlagMetadata } from '../flag/FlagMetadata'

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getModificationSync<T> (params: modificationsRequested<T>): T {
    this.log('getModification')
    return params.defaultValue
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
  getModificationsSync<T> (params: modificationsRequested<T>[], _activateAll?: boolean): Record<string, T> {
    this.log('getModifications')
    const flags:Record<string, T> = {}
    params.forEach(item => {
      flags[item.key] = item.defaultValue
    })
    return flags
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
  sendHits (_hits: HitAbstract[] | IHit[]|HitShape[]|BatchDTO[]): Promise<void> {
    this.log('sendHits')
    return Promise.resolve()
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
    logInfoSprintf(this.config, FLAG_METADATA, METADATA_PANIC_MODE, this.visitor.visitorId, param.key, emptyMetaData)
    return emptyMetaData
  }

  private log (methodName:string) {
    logInfoSprintf(this.config, methodName, METHOD_DEACTIVATED_ERROR, this.visitor.visitorId, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON])
  }
}
