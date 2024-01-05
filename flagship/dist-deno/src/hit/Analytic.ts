import { IFlagshipConfig } from '../config/IFlagshipConfig.ts'
import { Diagnostic, IDiagnostic } from './Diagnostic.ts'

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
