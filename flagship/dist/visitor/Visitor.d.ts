/// <reference types="node" />
import { Modification } from '../model/Modification';
import { HitAbstract, IPage, IScreen } from '../hit/index';
import { IConfigManager, IFlagshipConfig } from '../config/index';
import { IEvent } from '../hit/Event';
import { IItem } from '../hit/Item';
import { ITransaction } from '../hit/Transaction';
import { modificationsRequested, primitive } from '../types';
import { CampaignDTO } from '../decision/api/models';
import { EventEmitter } from '../nodeDeps';
export declare const TYPE_HIT_REQUIRED_ERROR = "property type is required and must ";
export declare class Visitor extends EventEmitter {
    private _visitorId;
    private _context;
    private _modifications;
    private _configManager;
    private _config;
    private _campaigns;
    constructor(visitorId: string | null, context: Record<string, primitive>, configManager: IConfigManager);
    private createVisitorId;
    get visitorId(): string;
    set visitorId(v: string);
    get context(): Record<string, primitive>;
    /**
     * Clear the current context and set a new context value
     */
    set context(v: Record<string, primitive>);
    get modifications(): Map<string, Modification>;
    get configManager(): IConfigManager;
    get config(): IFlagshipConfig;
    /**
     * Update the visitor context values, matching the given keys, used for targeting.
     *
     * A new context value associated with this key will be created if there is no previous matching value.
     *
     * Context keys must be String, and values types must be one of the following : Number, Boolean, String.
     * @param {Record<string, primitive>} context : collection of keys, values.
     */
    updateContext(context: Record<string, primitive>): void;
    /**
     *  Update the visitor context values, matching the given keys, used for targeting.
     *
     * A new context value associated with this key will be created if there is no previous matching value.
     * Context key must be String, and value type must be one of the following : Number, Boolean, String.
     * @param {string} key : context key.
     * @param {primitive} value : context value.
     */
    updateContextKeyValue(key: string, value: primitive): void;
    /**
     * clear the actual visitor context
     */
    clearContext(): void;
    /**
     * isOnPanicMode
     */
    private isOnPanicMode;
    /**
     * Retrieve a modification value by its key. If no modification match the given
     * key or if the stored value type and default value type do not match, default value will be returned.
     * @param {string} key : key associated to the modification.
     * @param {T} defaultValue : default value to return.
     * @param {boolean} activate : Set this parameter to true to automatically report on our server that the current visitor has seen this modification. It is possible to call activateModification() later.
     */
    getModification<T>(params: modificationsRequested<T>, activateAll?: boolean): Promise<T>;
    getModification<T>(params: modificationsRequested<T>[], activateAll?: boolean): Promise<T[]>;
    private checkAndGetModification;
    /**
     * Retrieve a modification value by its key. If no modification match the given
     * key or if the stored value type and default value type do not match, default value will be returned.
     * @param {string} key key associated to the modification.
     * @param {T} defaultValue default value to return.
     * @param {boolean} activate Set this parameter to true to automatically report on our server that the current visitor has seen this modification. It is possible to call activateModification() later.
     */
    getModificationSync<T>(params: modificationsRequested<T>, activateAll?: boolean): T;
    getModificationSync<T>(params: modificationsRequested<T>[], activateAll?: boolean): T[];
    getModificationSync<T>(params: modificationsRequested<T> | modificationsRequested<T>[], activateAll?: boolean): T | T[];
    /**
     * returns a Promise<object> containing all the data for all the campaigns associated with the current visitor.
     *@deprecated
     */
    getAllModifications(activate?: boolean): Promise<{
        visitorId: string;
        campaigns: CampaignDTO[];
    }> | null;
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
    }> | null;
    /**
     * Get the campaign modification information value matching the given key.
     * @param {string} key : key which identify the modification.
     * @returns {Modification | null}
     */
    getModificationInfo(key: string): Promise<Modification | null>;
    /**
     * Get the campaign modification information value matching the given key.
     * @param {string} key : key which identify the modification.
     * @returns {Modification | null}
     */
    getModificationInfoSync(key: string): Modification | null;
    /**
     * This function calls the decision api and update all the campaigns modifications
     * from the server according to the visitor context.
     */
    synchronizeModifications(): Promise<void>;
    private hasTrackingManager;
    /**
     * Report this user has seen this modification.
     * @param key : key which identify the modification to activate.
     */
    activateModification(key: string): Promise<void>;
    /**
      * Report this user has seen these modifications.
      * @deprecated use ["key1","key2",...] instead of
      * @param {Array<{ key: string }>} keys keys which identify the modifications to activate.
      */
    activateModification(keys: Array<{
        key: string;
    }>): Promise<void>;
    /**
      * Report this user has seen these modifications.
      * @param keys  keys which identify the modifications to activate.
      */
    activateModification(keys: Array<string>): Promise<void>;
    private activate;
    /**
     * Report this user has seen this modification.
     * @param key : key which identify the modification to activate.
     */
    activateModificationSync(key: string): void;
    /**
     * Report this user has seen these modifications.
     * @deprecated use ["key1","key2",...] instead of
     * @param {Array<{ key: string }>} keys keys which identify the modifications to activate.
     */
    activateModificationSync(keys: Array<{
        key: string;
    }>): void;
    /**
     * Report this user has seen these modifications.
     * @param keys  keys which identify the modifications to activate.
     */
    activateModificationSync(keys: Array<string>): void;
    activateModificationSync(params: string | Array<{
        key: string;
    }> | Array<string>): void;
    /**
     * Send a Hit to Flagship servers for reporting.
     * @param hit
     */
    sendHit(hit: HitAbstract): Promise<void>;
    sendHit(hit: Array<HitAbstract>): Promise<void>;
    sendHit(hit: IPage | IScreen | IEvent | IItem | ITransaction): Promise<void>;
    sendHit(hit: Array<IPage | IScreen | IEvent | IItem | ITransaction>): Promise<void>;
    private getHit;
    private prepareAndSendHit;
    /**
     * Send a Hit to Flagship servers for reporting.
     * @param hit
     */
    sendHitSync(hit: Array<HitAbstract>): void;
    sendHitSync(hit: HitAbstract): void;
    sendHitSync(hit: Array<IPage | IScreen | IEvent | IItem | ITransaction>): void;
    sendHitSync(hit: IPage | IScreen | IEvent | IItem | ITransaction | HitAbstract): void;
    sendHitSync(hit: IPage | IScreen | IEvent | IItem | ITransaction | Array<IPage | IScreen | IEvent | IItem | ITransaction> | HitAbstract | HitAbstract[]): void;
}
