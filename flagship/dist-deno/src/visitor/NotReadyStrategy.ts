import { Modification } from '../index.ts'
import { FlagshipStatus, METHOD_DEACTIVATED_ERROR } from '../enum/index.ts'
import { modificationsRequested } from '../types.ts'
import { logError, sprintf } from '../utils/utils.ts'
import { DefaultStrategy } from './DefaultStrategy.ts'
import { HitAbstract, IEvent, IItem, IPage, IScreen, ITransaction } from '../hit/index.ts'

export class NotReadyStrategy extends DefaultStrategy {
  synchronizeModifications (): Promise<void> {
    this.log('synchronizeModifications')
    return Promise.resolve()
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
    logError(this.config, sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.NOT_INITIALIZED]), methodName)
  }
}
