import { METHOD_DEACTIVATED_CONSENT_ERROR } from '../enum/index.ts'
import { HitAbstract, IEvent, IItem, IPage, IScreen, ITransaction } from '../hit/index.ts'
import { logError, sprintf } from '../utils/utils.ts'
import { DefaultStrategy } from './DefaultStrategy.ts'

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
