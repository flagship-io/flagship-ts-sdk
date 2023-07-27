import { IFlagshipConfig } from '../config/index'
import { Diagnostic, IDiagnostic } from './Diagnostic'

export type TroubleshootingType = Omit<IDiagnostic & {config: IFlagshipConfig}, 'createdAt'|'category'|'type'>
export class Troubleshooting extends Diagnostic {
  public constructor (param:TroubleshootingType) {
    super({ ...param, type: 'TROUBLESHOOTING' })
  }
}
