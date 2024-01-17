import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { Diagnostic, IDiagnostic } from './Diagnostic'

export type UsageHitType = Omit<IDiagnostic & {config: IFlagshipConfig}, 'createdAt'|'category'|'type'>

export class UsageHit extends Diagnostic {
  public constructor (param:UsageHitType) {
    super({ ...param, type: 'USAGE' })
  }
}
