import { METHOD_DEACTIVATED_CONSENT_ERROR } from '../enum/index'
import { HitAbstract, IEvent, IItem, IPage, IScreen, ITransaction } from '../hit/index'
import { logError, sprintf } from '../utils/utils'
import { DefaultStrategy } from './DefaultStrategy'

export class NoConsentStrategy extends DefaultStrategy {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  activateModificationSync (params: string | string[] | { key: string }[]): void {
    this.log('activateModification')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendHitSync (hit: HitAbstract | HitAbstract[] | IPage | IScreen | IEvent | IItem | ITransaction | (IPage | IScreen | IEvent | IItem | ITransaction)[]): void {
    this.log('sendHit')
  }

  private log (methodName:string) {
    logError(this.config, sprintf(METHOD_DEACTIVATED_CONSENT_ERROR, methodName, this.visitor.visitorId), methodName)
  }
}
