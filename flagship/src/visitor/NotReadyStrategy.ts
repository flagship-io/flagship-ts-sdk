import { Modification } from '../index'
import { FlagshipStatus, METHOD_DEACTIVATED_ERROR } from '../enum/index'
import { IHit, modificationsRequested } from '../types'
import { logError, sprintf } from '../utils/utils'
import { DefaultStrategy } from './DefaultStrategy'
import { HitAbstract } from '../hit/index'

export class NotReadyStrategy extends DefaultStrategy {
  synchronizeModifications (): Promise<void> {
    this.log('synchronizeModifications')
    return Promise.resolve()
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
  sendHit (_hit: HitAbstract | IHit): Promise<void> {
    this.log('sendHit')
    return Promise.resolve()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendHits (_hits: HitAbstract[] | IHit[]): Promise<void> {
    this.log('sendHits')
    return Promise.resolve()
  }

  private log (methodName:string) {
    logError(this.config, sprintf(METHOD_DEACTIVATED_ERROR, methodName, FlagshipStatus[FlagshipStatus.NOT_INITIALIZED]), methodName)
  }
}
