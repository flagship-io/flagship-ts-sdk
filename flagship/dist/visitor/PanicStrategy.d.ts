import { Modification } from '../index';
import { modificationsRequested, primitive } from '../types';
import { DefaultStrategy } from './DefaultStrategy';
import { HitAbstract, IEvent, IItem, IPage, IScreen, ITransaction } from '../hit/index';
export declare class PanicStrategy extends DefaultStrategy {
    setConsent(hasConsented: boolean): void;
    updateContext(context: Record<string, primitive>): void;
    clearContext(): void;
    getModificationSync<T>(params: modificationsRequested<T> | modificationsRequested<T>[], activateAll?: boolean): T | T[];
    getModificationInfoSync(key: string): Modification | null;
    activateModificationSync(params: string | string[] | {
        key: string;
    }[]): void;
    sendHitSync(hit: HitAbstract | HitAbstract[] | IPage | IScreen | IEvent | IItem | ITransaction | (IPage | IScreen | IEvent | IItem | ITransaction)[]): void;
    private log;
}
