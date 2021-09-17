import { Modification } from '../index'
import { FlagshipStatus, METHOD_DEACTIVATED_ERROR, METHOD_DEACTIVATED_SEND_CONSENT_ERROR } from '../enum/index'
import { IHit, modificationsRequested, primitive } from '../types'
import { logError, sprintf } from '../utils/utils'
import { DefaultStrategy } from './DefaultStrategy'
import { HitAbstract } from '../hit/index'

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
  getModificationsSync<T> (params: modificationsRequested<T>[], _activateAll?: boolean): T[] {
    this.log('getModifications')
    return params.map(item => {
      return item.defaultValue
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getModificationInfoSync (_key: string): Modification | null {
    this.log('getModificationInfo')
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public activateModificationSync (_params: string): void {
    this.log('activateModification')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public activateModificationsSync (_params: string[] | { key: string }[]): void {
    this.log('activateModifications')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendHitSync (_hit: HitAbstract | IHit): void {
    this.log('sendHit')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendHitsSync (_hits: HitAbstract[] | IHit[]): void {
    this.log('sendHits')
  }

  private log (methodName:string) {
    logError(this.config, sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
  }
}
