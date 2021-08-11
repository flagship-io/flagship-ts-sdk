import { Modification } from '../index';
import { HitAbstract, IPage, IScreen, IEvent, IItem, ITransaction } from '../hit/index';
import { primitive, modificationsRequested } from '../types';
import { VisitorAbstract } from './VisitorAbstract';
import { CampaignDTO } from '../decision/api/models';
export declare class VisitorDelegate extends VisitorAbstract {
    updateContext(context: Record<string, primitive>): void;
    clearContext(): void;
    getModification<T>(params: modificationsRequested<T>, activateAll?: boolean): Promise<T>;
    getModification<T>(params: modificationsRequested<T>[], activateAll?: boolean): Promise<T[]>;
    getModificationSync<T>(params: modificationsRequested<T>, activateAll?: boolean): T;
    getModificationSync<T>(params: modificationsRequested<T>[], activateAll?: boolean): T[];
    getModificationInfo(key: string): Promise<Modification | null>;
    getModificationInfoSync(key: string): Modification | null;
    synchronizeModifications(): Promise<void>;
    activateModification(key: string): Promise<void>;
    activateModification(keys: {
        key: string;
    }[]): Promise<void>;
    activateModification(keys: string[]): Promise<void>;
    activateModificationSync(key: string): void;
    activateModificationSync(keys: {
        key: string;
    }[]): void;
    activateModificationSync(keys: string[]): void;
    sendHit(hit: HitAbstract): Promise<void>;
    sendHit(hit: HitAbstract[]): Promise<void>;
    sendHit(hit: IPage | IScreen | IEvent | IItem | ITransaction): Promise<void>;
    sendHit(hit: (IPage | IScreen | IEvent | IItem | ITransaction)[]): Promise<void>;
    sendHitSync(hit: HitAbstract[]): void;
    sendHitSync(hit: HitAbstract): void;
    sendHitSync(hit: (IPage | IScreen | IEvent | IItem | ITransaction)[]): void;
    sendHitSync(hit: HitAbstract | IPage | IScreen | IEvent | IItem | ITransaction): void;
    getAllModifications(activate?: boolean): Promise<{
        visitorId: string;
        campaigns: CampaignDTO[];
    }>;
    getModificationsForCampaign(campaignId: string, activate?: boolean): Promise<{
        visitorId: string;
        campaigns: CampaignDTO[];
    }>;
    authenticate(visitorId: string): void;
    unauthenticate(): void;
}
