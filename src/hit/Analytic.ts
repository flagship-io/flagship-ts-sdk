import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { Diagnostic, IDiagnostic } from './Diagnostic'

export type AnalyticType = Omit<IDiagnostic & {config: IFlagshipConfig}, 'createdAt'|'category'|'type'>

export class Analytic extends Diagnostic {
  public constructor (param:AnalyticType) {
    super({ ...param, type: 'USAGE' })
  }

  public toApiKeys () {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.visitorId = undefined as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.anonymousId = undefined as any
    return super.toApiKeys()
  }
}
