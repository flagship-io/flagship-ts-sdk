import { Modification } from '../index';
import { HitAbstract, IPage, IScreen, IEvent, IItem, ITransaction } from '../hit/index';
import { primitive, modificationsRequested } from '../types';
import { VisitorStrategyAbstract } from './VisitorStrategyAbstract';
import { CampaignDTO } from '../decision/api/models';
export declare const TYPE_HIT_REQUIRED_ERROR = "property type is required and must ";
export declare class DefaultStrategy extends VisitorStrategyAbstract {
    /**
     *  Update the visitor context values, matching the given keys, used for targeting.
     *
     * A new context value associated with this key will be created if there is no previous matching value.
     * Context key must be String, and value type must be one of the following : Number, Boolean, String.
     * @param {string} key : context key.
     * @param {primitive} value : context value.
     */
    private updateContextKeyValue;
    updateContext(context: Record<string, primitive>): void;
    clearContext(): void;
    getModification<T>(params: modificationsRequested<T>, activateAll?: boolean): Promise<T>;
    getModification<T>(params: modificationsRequested<T>[], activateAll?: boolean): Promise<T[]>;
    private checkAndGetModification;
    getModificationSync<T>(params: modificationsRequested<T>, activateAll?: boolean): T;
    getModificationSync<T>(params: modificationsRequested<T>[], activateAll?: boolean): T[];
    getModificationSync<T>(params: modificationsRequested<T> | modificationsRequested<T>[], activateAll?: boolean): T | T[];
    getModificationInfo(key: string): Promise<Modification | null>;
    getModificationInfoSync(key: string): Modification | null;
    synchronizeModifications(): Promise<void>;
    activateModification(key: string): Promise<void>;
    activateModification(keys: {
        key: string;
    }[]): Promise<void>;
    activateModification(keys: string[]): Promise<void>;
    private hasTrackingManager;
    private activate;
    activateModificationSync(key: string): void;
    activateModificationSync(keys: {
        key: string;
    }[]): void;
    activateModificationSync(keys: string[]): void;
    activateModificationSync(params: string | string[] | {
        key: string;
    }[]): void;
    sendHit(hit: HitAbstract): Promise<void>;
    sendHit(hit: HitAbstract[]): Promise<void>;
    sendHit(hit: IPage | IScreen | IEvent | IItem | ITransaction): Promise<void>;
    sendHit(hit: (IPage | IScreen | IEvent | IItem | ITransaction)[]): Promise<void>;
    private getHit;
    private prepareAndSendHit;
    sendHitSync(hit: HitAbstract[]): void;
    sendHitSync(hit: HitAbstract): void;
    sendHitSync(hit: (IPage | IScreen | IEvent | IItem | ITransaction)[]): void;
    sendHitSync(hit: HitAbstract | IPage | IScreen | IEvent | IItem | ITransaction): void;
    sendHitSync(hit: HitAbstract | HitAbstract[] | IPage | IScreen | IEvent | IItem | ITransaction | (IPage | IScreen | IEvent | IItem | ITransaction)[]): void;
    /**
     * returns a Promise<object> containing all the data for all the campaigns associated with the current visitor.
     *@deprecated
     */
    getAllModifications(activate?: boolean): Promise<{
        visitorId: string;
        campaigns: CampaignDTO[];
    }>;
    /**
     * Get data for a specific campaign.
     * @param campaignId Identifies the campaign whose modifications you want to retrieve.
     * @param activate
     * @deprecated
     * @returns
     */
    getModificationsForCampaign(campaignId: string, activate?: boolean): Promise<{
        visitorId: string;
        campaigns: CampaignDTO[];
    }>;
}
