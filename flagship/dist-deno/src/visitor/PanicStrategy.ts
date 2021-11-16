import { Modification } from '../index.ts'
import { FlagshipStatus, METHOD_DEACTIVATED_ERROR, METHOD_DEACTIVATED_SEND_CONSENT_ERROR } from '../enum/index.ts'
import { IHit, modificationsRequested, primitive } from '../types.ts'
import { logError, sprintf } from '../utils/utils.ts'
import { DefaultStrategy } from './DefaultStrategy.ts'
import { HitAbstract, HitShape } from '../hit/index.ts'

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
  public getModificationInfoSync (_key: string): Modification | null {
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
  sendHit (_hit: HitAbstract | IHit| HitShape): Promise<void> {
    this.log('sendHit')
    return Promise.resolve()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendHits (_hits: HitAbstract[] | IHit[]|HitShape[]): Promise<void> {
    this.log('sendHits')
    return Promise.resolve()
  }

  private log (methodName:string) {
    logError(this.config, sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
  }
}
