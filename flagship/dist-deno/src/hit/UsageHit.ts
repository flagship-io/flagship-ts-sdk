import { IFlagshipConfig } from '../config/IFlagshipConfig.ts';
import { Diagnostic, IDiagnostic } from './Diagnostic.ts';

export type UsageHitType = Omit<IDiagnostic & {config: IFlagshipConfig}, 'createdAt'|'category'|'type'>

export class UsageHit extends Diagnostic {
  public constructor(param:UsageHitType) {
    super({
      ...param,
      type: 'USAGE'
    });
  }
}
