import { Modification } from '../index.ts'
import { FlagshipStatus, METHOD_DEACTIVATED_ERROR } from '../enum/index.ts'
import { modificationsRequested, primitive } from '../types.ts'
import { logError, sprintf } from '../utils/utils.ts'
import { DefaultStrategy } from './DefaultStrategy.ts'
import { HitAbstract, IEvent, IItem, IPage, IScreen, ITransaction } from '../hit/index.ts'

export class PanicStrategy extends DefaultStrategy {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setConsent (_hasConsented:boolean):void {
    this.log('setConsent')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateContext (context: Record<string, primitive>): void {
    this.log('updateContext')
  }

  clearContext (): void {
    this.log('clearContext')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getModificationSync<T> (params: modificationsRequested<T> | modificationsRequested<T>[], activateAll?: boolean): T | T[] {
    this.log('getModification')
    if (Array.isArray(params)) {
      return params.map(item => {
        return item.defaultValue
      })
    }
    return params.defaultValue
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getModificationInfoSync (key: string): Modification | null {
    this.log('getModificationInfo')
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public activateModificationSync (params: string | string[] | { key: string }[]): void {
    this.log('activateModification')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public sendHitSync (hit: HitAbstract | HitAbstract[] | IPage | IScreen | IEvent | IItem | ITransaction | (IPage | IScreen | IEvent | IItem | ITransaction)[]): void {
    this.log('sendHit')
  }

  private log (methodName:string) {
    logError(this.config, sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.READY_PANIC_ON]), methodName)
  }
}
