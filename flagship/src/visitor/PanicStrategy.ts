import { CampaignDTO, FlagDTO } from '../index'
import { FlagshipStatus, METHOD_DEACTIVATED_ERROR, METHOD_DEACTIVATED_SEND_CONSENT_ERROR } from '../enum/index'
import { IHit, modificationsRequested, primitive } from '../types'
import { logError, sprintf } from '../utils/utils'
import { DefaultStrategy } from './DefaultStrategy'
import { HitAbstract, HitShape } from '../hit/index'
import { BatchDTO } from '../hit/Batch'
import { IFlagMetadata } from '../flag/FlagMetadata'

export class PanicStrategy extends DefaultStrategy {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setConsent (hasConsented:boolean):void {
    this.visitor.hasConsented = hasConsented
    const methodName = 'setConsent'
    logError(this.config, sprintf(METHOD_DEACTIVATED_SEND_CONSENT_ERROR, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateContext (_context: Record<string, primitive>): void {
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

  protected async cacheVisitor ():Promise<void> {
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

  async userExposed (): Promise<void> {
    this.log('userExposed')
  }

  getFlagMetadata ():IFlagMetadata {
    this.log('flag.metadata')
    return {
      campaignId: '',
      campaignType: '',
      variationId: '',
      variationGroupId: '',
      isReference: false
    }
  }

  private log (methodName:string) {
    logError(this.config, sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
  }
}
