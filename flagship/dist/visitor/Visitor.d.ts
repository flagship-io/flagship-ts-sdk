/// <reference types="node" />
import { Modification } from '../model/Modification';
import { HitAbstract, IPage, IScreen } from '../hit/index';
import { IEvent } from '../hit/Event';
import { IItem } from '../hit/Item';
import { ITransaction } from '../hit/Transaction';
import { modificationsRequested, primitive } from '../types';
import { EventEmitter } from '../nodeDeps';
import { IVisitor } from './IVisitor';
import { VisitorAbstract } from './VisitorAbstract';
import { IFlagshipConfig } from '../config/index';
import { CampaignDTO } from '../decision/api/models';
export declare class Visitor extends EventEmitter implements IVisitor {
    private visitorDelegate;
    constructor(visitorDelegate: VisitorAbstract);
    get visitorId(): string;
    set visitorId(v: string);
    get anonymousId(): string | null;
    get hasConsented(): boolean;
    setConsent(hasConsented: boolean): void;
    get config(): IFlagshipConfig;
    get context(): Record<string, primitive>;
    get modifications(): Map<string, Modification>;
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
