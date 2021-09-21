import { IHit } from '../types.ts'
import { METHOD_DEACTIVATED_CONSENT_ERROR } from '../enum/index.ts'
import { HitAbstract } from '../hit/index.ts'
import { logError, sprintf } from '../utils/utils.ts'
import { DefaultStrategy } from './DefaultStrategy.ts'

export class NoConsentStrategy extends DefaultStrategy {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async activateModification (_params: string): Promise<void> {
    this.log('activateModification')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async activateModifications (_params: string[] | { key: string }[]): Promise<void> {
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
