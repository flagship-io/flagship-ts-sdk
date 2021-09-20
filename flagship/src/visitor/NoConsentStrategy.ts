import { IHit } from '../types'
import { METHOD_DEACTIVATED_CONSENT_ERROR } from '../enum/index'
import { HitAbstract } from '../hit/index'
import { logError, sprintf } from '../utils/utils'
import { DefaultStrategy } from './DefaultStrategy'

export class NoConsentStrategy extends DefaultStrategy {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  activateModificationSync (_params: string): void {
    this.log('activateModification')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  activateModificationsSync (_params: string[] | { key: string }[]): void {
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
    logError(this.config, sprintf(METHOD_DEACTIVATED_CONSENT_ERROR, methodName, this.visitor.visitorId), methodName)
  }
}
