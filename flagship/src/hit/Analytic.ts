import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { Diagnostic, IDiagnostic } from './Diagnostic'

export type AnalyticType = Omit<IDiagnostic & {config: IFlagshipConfig}, 'createdAt'|'category'|'type'>

export class Analytic extends Diagnostic {
  public constructor (param:AnalyticType) {
    super({ ...param, type: 'USAGE' })
  }

  public toApiKeys () {
    this.visitorId = ''
    return super.toApiKeys()
  }
}
