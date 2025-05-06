
import { IFlagshipConfig } from '../config/index.ts';
import { Diagnostic, IDiagnostic } from './Diagnostic.ts';

export type TroubleshootingType = Omit<IDiagnostic & {config: IFlagshipConfig}, 'createdAt'|'category'|'type'>
export class Troubleshooting extends Diagnostic {
  public constructor(param:TroubleshootingType) {
    super({
      ...param,
      type: 'TROUBLESHOOTING'
    });
  }
}
