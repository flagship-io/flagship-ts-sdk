/// <reference types="node" />
import { Modification } from '../index';
import { IConfigManager, IFlagshipConfig } from '../config/index';
import { modificationsRequested, primitive } from '../types';
import { IVisitor } from './IVisitor';
import { CampaignDTO } from '../decision/api/models';
import { HitAbstract, IPage, IScreen, IEvent, IItem, ITransaction } from '../hit/index';
import { VisitorStrategyAbstract } from './VisitorStrategyAbstract';
import { EventEmitter } from '../nodeDeps';
export declare abstract class VisitorAbstract extends EventEmitter implements IVisitor {
    protected _visitorId: string;
    protected _context: Record<string, primitive>;
    protected _modifications: Map<string, Modification>;
    protected _configManager: IConfigManager;
    protected _config: IFlagshipConfig;
    protected _campaigns: CampaignDTO[];
    protected _hasConsented: boolean;
    constructor(visitorId: string | null, context: Record<string, primitive>, configManager: IConfigManager);
    protected createVisitorId(): string;
    get visitorId(): string;
    set visitorId(v: string);
    /**
     * Return True or False if the visitor has consented for protected data usage.
     * @return bool
     */
    get hasConsented(): boolean;
    /**
      * Set if visitor has consented for protected data usage.
      * @param {boolean} hasConsented True if the visitor has consented false otherwise.
      */
    setConsent(hasConsented: boolean): void;
    get context(): Record<string, primitive>;
    /**
    * Clear the current context and set a new context value
    */
    set context(v: Record<string, primitive>);
    get modifications(): Map<string, Modification>;
    set modifications(v: Map<string, Modification>);
    get configManager(): IConfigManager;
    get config(): IFlagshipConfig;
    get campaigns(): CampaignDTO[];
    set campaigns(v: CampaignDTO[]);
    protected getStrategy(): VisitorStrategyAbstract;
    abstract updateContext(context: Record<string, primitive>): void;
    abstract clearContext(): void;
    abstract getModification<T>(params: modificationsRequested<T>, activateAll?: boolean): Promise<T>;
    abstract getModification<T>(params: modificationsRequested<T>[], activateAll?: boolean): Promise<T[]>;
    abstract getModification<T>(params: modificationsRequested<T> | modificationsRequested<T>[], activateAll?: boolean): Promise<T | T[]>;
    abstract getModificationSync<T>(params: modificationsRequested<T>, activateAll?: boolean): T;
    abstract getModificationSync<T>(params: modificationsRequested<T>[], activateAll?: boolean): T[];
    abstract getModificationSync<T>(params: modificationsRequested<T> | modificationsRequested<T>[], activateAll?: boolean): T | T[];
    abstract getModificationInfo(key: string): Promise<Modification | null>;
    abstract getModificationInfoSync(key: string): Modification | null;
    abstract synchronizeModifications(): Promise<void>;
    abstract activateModification(key: string): Promise<void>;
    abstract activateModification(keys: {
        key: string;
    }[]): Promise<void>;
    abstract activateModification(keys: string[]): Promise<void>;
    abstract activateModification(params: string | Array<{
        key: string;
    }> | Array<string>): Promise<void>;
    abstract activateModificationSync(key: string): void;
    abstract activateModificationSync(keys: {
        key: string;
    }[]): void;
    abstract activateModificationSync(keys: string[]): void;
    abstract activateModificationSync(params: string | Array<{
        key: string;
    }> | Array<string>): void;
    abstract sendHit(hit: HitAbstract): Promise<void>;
    abstract sendHit(hit: HitAbstract[]): Promise<void>;
    abstract sendHit(hit: IPage | IScreen | IEvent | IItem | ITransaction): Promise<void>;
    abstract sendHit(hit: (IPage | IScreen | IEvent | IItem | ITransaction)[]): Promise<void>;
    abstract sendHit(hit: IPage | IScreen | IEvent | IItem | ITransaction | Array<IPage | IScreen | IEvent | IItem | ITransaction> | HitAbstract | HitAbstract[]): Promise<void>;
    abstract sendHitSync(hit: HitAbstract[]): void;
    abstract sendHitSync(hit: HitAbstract): void;
    abstract sendHitSync(hit: (IPage | IScreen | IEvent | IItem | ITransaction)[]): void;
    abstract sendHitSync(hit: HitAbstract | IPage | IScreen | IEvent | IItem | ITransaction): void;
    abstract sendHitSync(hit: IPage | IScreen | IEvent | IItem | ITransaction | Array<IPage | IScreen | IEvent | IItem | ITransaction> | HitAbstract | HitAbstract[]): void;
    abstract getAllModifications(activate: boolean): Promise<{
        visitorId: string;
        campaigns: CampaignDTO[];
    }>;
    abstract getModificationsForCampaign(campaignId: string, activate: boolean): Promise<{
        visitorId: string;
        campaigns: CampaignDTO[];
    }>;
}
