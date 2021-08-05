import { HitAbstract, IEvent, IItem, IPage, IScreen, ITransaction } from '../hit/index';
import { DefaultStrategy } from './DefaultStrategy';
export declare class NoConsentStrategy extends DefaultStrategy {
    activateModificationSync(params: string | string[] | {
        key: string;
    }[]): void;
    sendHitSync(hit: HitAbstract | HitAbstract[] | IPage | IScreen | IEvent | IItem | ITransaction | (IPage | IScreen | IEvent | IItem | ITransaction)[]): void;
    private log;
}
